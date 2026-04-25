import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readSportybet, writeSportybet, readSportybetLog, writeSportybetLog } from "./storage.js";
import { getSettings } from "./settings.js";
import { convertToSportybet } from "./izentbet.js";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const MOBILE_BASE = "https://www.sportybet.com/ng/m";
const MAX_AI_STEPS = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function appendLog(entry) {
  const logs = readSportybetLog();
  logs.unshift({
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  });
  const trimmed = logs.slice(0, 200);
  writeSportybetLog(trimmed);
}

function getSportybet() {
  const data = readSportybet();
  if (!data.connected || !data.encodedCredentials) return null;
  const decoded = Buffer.from(data.encodedCredentials, "base64").toString("utf8");
  const [phone, password] = decoded.split(":");
  return { phone, password, data };
}

function getActiveBots() {
  const sb = readSportybet();
  return (sb.bots || []).filter((b) => b.active === true);
}

function signalMatchesBot(signal, bot) {
  // Confidence check
  const confLevels = { high: 3, medium: 2, low: 1 };
  const sigConf = confLevels[signal.confidence] || 0;
  const minConf = bot.minConfidence || "medium";
  const botConf = confLevels[minConf] || 2;
  if (sigConf < botConf) {
    return { match: false, reason: "Confidence too low" };
  }

  // Minute range
  const min = signal.minute;
  if (bot.startMinute && min < parseInt(bot.startMinute)) {
    return { match: false, reason: "Before start minute" };
  }
  if (bot.stopMinute && min > parseInt(bot.stopMinute)) {
    return { match: false, reason: "After stop minute" };
  }

  // Market / overs line
  const marketMap = {
    "over_0.5": "0.5",
    "over_1.5": "1.5",
    "over_2.5": "2.5",
  };
  const botMarket = marketMap[bot.oversLine] || "1.5";
  if (!signal.betType.includes(botMarket)) {
    return { match: false, reason: "Market mismatch" };
  }

  // League
  if (bot.leagues && bot.leagues.length > 0) {
    if (!bot.leagues.includes(signal.league)) {
      return { match: false, reason: "League not in bot list" };
    }
  }

  // One entry per game
  if (bot.oneEntryPerGame) {
    const logs = readSportybetLog();
    const today = new Date().toDateString();
    const alreadyBet = logs.some(
      (l) =>
        l.fixtureId === signal.fixtureId &&
        l.botId === bot.id &&
        new Date(l.timestamp).toDateString() === today &&
        l.type === "SUCCESS"
    );
    if (alreadyBet) {
      return { match: false, reason: "Already bet on this fixture today" };
    }
  }

  // Simulation mode
  if (bot.simulationMode) {
    return { match: true, simulation: true };
  }

  return { match: true, simulation: false };
}

function calculateStake(bot, sportybet) {
  const balance = sportybet.data.balance || 0;
  const stakeVal = parseFloat(bot.stakeValue) || 2;

  if (bot.stakingMethod === "percent" || bot.stakingMethod === "percent_drip") {
    const pct = stakeVal / 100;
    const stake = Math.floor(balance * pct);
    return Math.min(stake, 50000);
  }

  if (bot.stakingMethod === "flat") {
    return Math.min(stakeVal, 50000);
  }

  return 2000;
}

async function getShareLink(signal) {
  // If signal already has a pre-converted share link, use it immediately
  if (signal.sportybet && signal.sportybet.betLink) {
    console.log("✅ Using pre-converted link:", signal.sportybet.betLink);
    return signal.sportybet.betLink;
  }

  // On-demand conversion via AI Chat endpoint as backup
  console.log("🔄 Converting on-demand for automation...");
  try {
    const conversion = await convertToSportybet(
      signal.home,
      signal.away,
      signal.betType
    );

    if (conversion.success) {
      console.log("✅ On-demand conversion succeeded:", conversion.betLink);
      return conversion.betLink;
    }
  } catch (err) {
    console.error("❌ On-demand converter error:", err.message);
  }

  return null;
}

// ── Gemini AI Vision ─────────────────────────────────────────────────────────

async function getGeminiModel() {
  const settings = await getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
}

async function askGemini(page, instruction, context) {
  const screenshot = await page.screenshot({
    encoding: "base64",
    fullPage: false,
  });

  const model = await getGeminiModel();
  if (!model) {
    return {
      status: "error",
      action: "fail",
      errorMessage: "Gemini API key not configured",
    };
  }

  const prompt = `You are an intelligent automation agent controlling a Puppeteer browser to place a bet on Sportybet Nigeria.

CURRENT TASK: ${instruction}

CONTEXT: ${JSON.stringify(context)}

CURRENT PAGE SCREENSHOT: [attached]

Look at the screenshot carefully and respond with ONLY a JSON object (no markdown, no explanation):

{
  "observation": "What you see on the screen right now",
  "status": "one of: popup_detected | betslip_loaded | bet_placed | error | loading | login_required | unexpected",
  "action": "one of: click | type | wait | scroll | done | fail",
  "target": "CSS selector OR description of element to interact with",
  "value": "text to type if action is type, else null",
  "waitMs": number_of_milliseconds_to_wait_after_action,
  "reason": "Why you chose this action",
  "betPlaced": true_or_false,
  "errorMessage": "error description if status is error, else null"
}

RULES:
1. If you see "Account Protection" popup with "Yes, it's me" → click it immediately
2. If you see "Secure Your Account" popup with "Skip For Now" → click Skip For Now
3. If you see "Enable 2-step verification" → click Skip For Now
4. If you see any other popup or modal → find the dismiss/skip/close button and click it
5. If betslip is loaded with the correct fixture → verify stake is filled then click Place Bet
6. If you see a success confirmation → set betPlaced: true and action: done
7. If login page appears → set status: login_required
8. If page is still loading → set action: wait, waitMs: 2000
9. Never click "No, it's not me" or "Protect My Account"
10. Always prioritise dismissing popups before interacting with betslip
11. If stake input is empty → type the stake amount
12. The stake amount to use is: ${context.stakeAmount}`;

  const imagePart = {
    inlineData: {
      data: screenshot,
      mimeType: "image/png",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    const cleaned = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Gemini response error:", err.message);
    return {
      status: "error",
      action: "fail",
      errorMessage: "Could not parse Gemini response: " + err.message,
    };
  }
}

// ── Core Bet Placement ───────────────────────────────────────────────────────

async function placeBetWithAI(page, betLink, stakeAmount, signal, bot) {
  console.log("🤖 AI agent starting bet placement...");
  console.log("🔗 Link:", betLink);
  console.log("💰 Stake: ₦" + stakeAmount);

  const context = {
    task: "Place a bet on Sportybet",
    betLink,
    stakeAmount,
    fixture: signal.home + " vs " + signal.away,
    market: signal.betType,
    league: signal.league,
    minute: signal.minute,
  };

  await page.goto(betLink, {
    waitUntil: "networkidle2",
    timeout: 25000,
  });
  await delay(3000);

  let steps = 0;
  let betPlaced = false;
  let lastError = null;

  while (steps < MAX_AI_STEPS && !betPlaced) {
    steps++;
    console.log(`\n🤖 AI Step ${steps}/${MAX_AI_STEPS}`);

    const decision = await askGemini(
      page,
      "Place the bet on Sportybet. Handle any popups first.",
      context
    );

    console.log("🧠 Gemini says:", JSON.stringify(decision));

    if (decision.betPlaced || decision.status === "bet_placed") {
      console.log("✅ Bet placed successfully!");
      betPlaced = true;
      break;
    }

    if (decision.action === "fail" || decision.status === "error") {
      lastError = decision.errorMessage;
      console.error("❌ AI detected error:", lastError);
      break;
    }

    if (decision.status === "login_required") {
      lastError = "Session expired — reconnect Sportybet";
      break;
    }

    try {
      if (decision.action === "click") {
        const el = await page.$(decision.target);
        if (el) {
          await el.click();
          console.log("✅ Clicked:", decision.target);
        } else {
          await page.evaluate((text) => {
            const elements = document.querySelectorAll("button, a, span, div");
            for (const el of elements) {
              if (el.textContent.trim().includes(text)) {
                el.click();
                break;
              }
            }
          }, decision.target);
          console.log("✅ Clicked by text:", decision.target);
        }
        await delay(decision.waitMs || 1500);
      }

      if (decision.action === "type") {
        const input = await page.$(decision.target);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(decision.value || stakeAmount.toString());
          console.log("✅ Typed:", decision.value);
          await delay(decision.waitMs || 800);
        }
      }

      if (decision.action === "wait") {
        console.log("⏳ Waiting:", decision.waitMs, "ms");
        await delay(decision.waitMs || 2000);
      }

      if (decision.action === "scroll") {
        await page.evaluate(() => window.scrollBy(0, 300));
        await delay(1000);
      }

      if (decision.action === "done") {
        betPlaced = true;
        break;
      }
    } catch (actionErr) {
      console.error("❌ Action error:", actionErr.message);
      lastError = actionErr.message;
      await delay(1000);
    }
  }

  return { betPlaced, lastError, steps };
}

// ── Bot Stats ────────────────────────────────────────────────────────────────

function updateBotStats(botId, success) {
  const sb = readSportybet();
  if (!sb.bots) return;
  const bot = sb.bots.find((b) => b.id === botId);
  if (!bot) return;

  bot.totalBets = (bot.totalBets || 0) + 1;
  if (success) {
    bot.settledBets = (bot.settledBets || 0) + 1;
  }

  writeSportybet(sb);
}

// ── Main Export ──────────────────────────────────────────────────────────────

export async function processSignalForBots(signal) {
  console.log(
    "\n🎯 Processing signal for bots:",
    signal.home + " vs " + signal.away
  );

  // Step 1 — Check Sportybet connected
  const sportybet = getSportybet();
  if (!sportybet) {
    console.log("⚠️ Sportybet not connected — skipping");
    return;
  }

  // Step 2 — Get active bots
  const activeBots = getActiveBots();
  if (activeBots.length === 0) {
    console.log("⚠️ No active bots — skipping");
    return;
  }

  // Step 3 — Get share link
  const betLink = await getShareLink(signal);
  if (!betLink) {
    console.log("⚠️ No share link available — skipping");
    appendLog({
      type: "ERROR",
      fixtureId: signal.fixtureId,
      match: signal.home + " v " + signal.away,
      botName: "System",
      botId: "system",
      market: signal.betType,
      stake: 0,
      betLink: null,
      status: "No share link from converter",
      simulation: false,
    });
    return;
  }

  // Step 4 — Check concurrent bets
  const logs = readSportybetLog();
  const now = Date.now();
  const recentActive = logs.filter(
    (l) =>
      l.type === "ENTRY" &&
      now - new Date(l.timestamp).getTime() < 5 * 60 * 1000
  ).length;

  // Step 5 — Loop through each active bot
  for (const bot of activeBots) {
    console.log("\n🤖 Checking bot:", bot.name);

    // Max concurrent bets
    if (bot.maxConcurrentBets && recentActive >= parseInt(bot.maxConcurrentBets)) {
      console.log("⚠️ Max concurrent bets reached");
      continue;
    }

    // Check signal matches bot
    const matchResult = signalMatchesBot(signal, bot);
    if (!matchResult.match) {
      console.log("⚠️ Signal doesn't match:", matchResult.reason);
      continue;
    }

    console.log("✅ Signal matches bot! Processing...");

    // Calculate stake
    const stakeAmount = calculateStake(bot, sportybet);

    if (stakeAmount < 100) {
      appendLog({
        type: "ERROR",
        fixtureId: signal.fixtureId,
        match: signal.home + " v " + signal.away,
        botName: bot.name,
        botId: bot.id,
        market: signal.betType,
        stake: stakeAmount,
        betLink,
        status: "Stake too small: ₦" + stakeAmount + " (minimum ₦100)",
        simulation: matchResult.simulation,
      });
      continue;
    }

    // Log ENTRY
    appendLog({
      type: "ENTRY",
      fixtureId: signal.fixtureId,
      match: signal.home + " v " + signal.away,
      league: signal.league,
      botName: bot.name,
      botId: bot.id,
      market: signal.betType,
      confidence: signal.confidence,
      minute: signal.minute,
      stake: stakeAmount,
      betLink,
      status: "Attempting bet placement...",
      simulation: matchResult.simulation,
    });

    // Simulation mode
    if (matchResult.simulation) {
      console.log("📊 SIMULATION — no real bet placed");
      appendLog({
        type: "SUCCESS",
        fixtureId: signal.fixtureId,
        match: signal.home + " v " + signal.away,
        league: signal.league,
        botName: bot.name,
        botId: bot.id,
        market: signal.betType,
        confidence: signal.confidence,
        minute: signal.minute,
        stake: stakeAmount,
        betLink,
        status: "Simulated bet: ₦" + stakeAmount.toLocaleString() + " on " + signal.betType,
        simulation: true,
      });
      continue;
    }

    // Real bet — launch Puppeteer
    let browser = null;
    try {
      const { loginSportybet } = await import("./sportybetScraper.js");

      console.log("🔄 Launching browser for bet...");
      const loginResult = await loginSportybet(sportybet.phone, sportybet.password);

      if (!loginResult.success) {
        appendLog({
          type: "ERROR",
          fixtureId: signal.fixtureId,
          match: signal.home + " v " + signal.away,
          botName: bot.name,
          botId: bot.id,
          market: signal.betType,
          stake: stakeAmount,
          betLink,
          status: "Login failed: " + loginResult.error,
          simulation: false,
        });
        continue;
      }

      browser = loginResult.browser;
      const page = loginResult.page;

      // Run AI bet placement
      const result = await placeBetWithAI(page, betLink, stakeAmount, signal, bot);

      if (result.betPlaced) {
        console.log("✅ Bet placed for bot:", bot.name);
        appendLog({
          type: "SUCCESS",
          fixtureId: signal.fixtureId,
          match: signal.home + " v " + signal.away,
          league: signal.league,
          botName: bot.name,
          botId: bot.id,
          market: signal.betType,
          confidence: signal.confidence,
          minute: signal.minute,
          stake: stakeAmount,
          betLink,
          status: "✅ Bet placed: ₦" + stakeAmount.toLocaleString() + " on " + signal.betType,
          aiSteps: result.steps,
          simulation: false,
        });
      } else {
        console.error("❌ Bet failed:", result.lastError);
        appendLog({
          type: "ERROR",
          fixtureId: signal.fixtureId,
          match: signal.home + " v " + signal.away,
          league: signal.league,
          botName: bot.name,
          botId: bot.id,
          market: signal.betType,
          stake: stakeAmount,
          betLink,
          status: "❌ Failed: " + result.lastError,
          aiSteps: result.steps,
          simulation: false,
        });
      }
    } catch (err) {
      console.error("❌ Automation error:", err.message);
      appendLog({
        type: "ERROR",
        fixtureId: signal.fixtureId,
        match: signal.home + " v " + signal.away,
        botName: bot.name,
        botId: bot.id,
        market: signal.betType,
        stake: stakeAmount,
        betLink,
        status: "Error: " + err.message,
        simulation: false,
      });
    } finally {
      if (browser) {
        await browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }
}
