import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { read$market, write$market, read$marketLog, write$marketLog, getAll$marketConfigs } from "./storage.js";
import { getSettings } from "./settings.js";
import { convertTo$market } from "./izentbet.js";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const DESKTOP_BASE = "https://www.$market.com/ng";
const MAX_AI_STEPS = 15;
let activeBetCount = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function appendLog(userId, entry) {
  const logs = read$marketLog(userId);
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
  write$marketLog(userId, trimmed);
}

function get$market(userId) {
  const data = read$market(userId);
  if (!data.connected || !data.encodedCredentials) return null;
  const decoded = Buffer.from(data.encodedCredentials, "base64").toString("utf8");
  const [phone, password] = decoded.split(":");
  return { phone, password, data };
}

function getActiveBots(userId) {
  const sb = read$market(userId);
  return (sb.bots || []).filter((b) => b.active === true);
}

function signalMatchesBot(signal, bot, userId) {
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
  if (bot.oversLine !== "all") {
    const marketMap = {
      "over_0.5": "0.5",
      "over_1.5": "1.5",
      "over_2.5": "2.5",
    };
    const botMarket = marketMap[bot.oversLine] || "1.5";
    if (!signal.betType.includes(botMarket)) {
      return { match: false, reason: "Market mismatch" };
    }
  }

  // League
  if (bot.leagues && bot.leagues.length > 0) {
    if (!bot.leagues.includes(signal.league)) {
      return { match: false, reason: "League not in bot list" };
    }
  }

  // Stop endless retries: If we already succeeded OR exhausted our 2 attempts (logged an ERROR) for this fixture today, skip it.
  const logs = read$marketLog(userId);
  const today = new Date().toDateString();
  const alreadyAttempted = logs.some(
    (l) =>
      l.fixtureId === signal.fixtureId &&
      l.botId === bot.id &&
      new Date(l.timestamp).toDateString() === today &&
      (l.type === "SUCCESS" || l.type === "ERROR")
  );

  if (alreadyAttempted) {
    return { match: false, reason: "Already attempted/bet on this fixture today" };
  }

  // One entry per game (legacy check, kept for compatibility if needed, but handled above)
  if (bot.oneEntryPerGame) {
    // handled by the alreadyAttempted check above
  }

  // Simulation mode
  if (bot.simulationMode) {
    return { match: true, simulation: true };
  }

  return { match: true, simulation: false };
}

function calculateStake(bot, $market) {
  const balance = $market.data.balance || 0;
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
  if (signal.$market && signal.$market.betLink) {
    console.log("✅ Using pre-converted link:", signal.$market.betLink);
    return signal.$market.betLink;
  }

  // On-demand conversion via AI Chat endpoint as backup
  console.log("🔄 Converting on-demand for automation...");
  try {
    const conversion = await convertTo$market(
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

async function getGeminiClient() {
  const settings = await getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// ── Visual Guard: AI-powered UI obstruction detector & clearer ───────────────

async function visualGuard(page) {
  const MAX_CLEARANCE_ATTEMPTS = 5;
  let attempts = 0;

  while (attempts < MAX_CLEARANCE_ATTEMPTS) {
    attempts++;
    console.log("🛡️ Visual Guard scan #" + attempts);

    let screenshot;
    try {
      screenshot = await page.screenshot({ encoding: "base64", fullPage: false });
    } catch (ssErr) {
      console.error("❌ Visual Guard: screenshot failed:", ssErr.message);
      return { clear: true, attempts }; // assume clear if we can't screenshot
    }

    const client = await getGeminiClient();
    if (!client) {
      console.warn("⚠️ Visual Guard: no Gemini client — skipping");
      return { clear: true, attempts };
    }

    const guardPrompt = `### SYSTEM INSTRUCTION: UI CLEARANCE PROTOCOL

### ROLE
You are the "Visual Guard" for a desktop browser automation mission. Your task is to act as a pre-processor to ensure the desktop web UI is interactive and free of obstructions.

### OBJECTIVE
Analyze the desktop screenshot provided. Check for and clear any UI obstructions BEFORE any main bot actions proceed.

### OBSTRUCTION IDENTIFICATION
Scan specifically for:
- Ads: Interstitial overlays, banner popups, promotional modals
- Notifications: System alerts, in-app push messages, notification banners
- Modals: Rate app, Subscribe, Update prompts
- Cookie/GDPR banners: Accept or Close them
- Permission Dialogs: Location preference popups
- Account Protection: "We detected login from another device" — click "Yes, it's me"
- Security prompts: "Secure Your Account", "Enable 2-step verification" — click "Skip For Now"
- Welcome/Intro screens: Click Skip or Close
- Location Preference popup: Click "Confirm"
- Any overlay or modal blocking the main content

### CLEARANCE STRATEGY
If an obstruction is detected:
1. Locate the Dismissal Element: Find “X”, “Close”, “Skip”, “No Thanks”, “Dismiss”, “Yes it’s me”, “Skip For Now”, “Got it”, “OK”, “Accept”, “Confirm” button
2. Extract precise center coordinates (x, y) for a click action
3. For overlays without buttons: click the X or outside the modal

### OUTPUT — RESPOND WITH ONLY THIS JSON:
{
  "status": "OBSTRUCTED" or "CLEAR",
  "detected_obstacle": "description or none",
  "action": "click" or "swipe" or "none",
  "target_coords": {"x": 0, "y": 0},
  "swipe_direction": "up" or "down" or null,
  "confidence": 0.0 to 1.0,
  "dismissal_text": "text of button to click"
}

RULES:
- If OBSTRUCTED: perform clearance then re-scan
- If CLEAR: proceed to main bot instructions
- NEVER interact with main UI while overlay present
- For "Yes, it's me" buttons: always click them
- For "Skip For Now" buttons: always click them
- For "Confirm" on Location Preference: always click it
- For "No, it's not me" buttons: NEVER click them
- For "Protect My Account" buttons: NEVER click them`;

    const imagePart = {
      inlineData: {
        data: screenshot,
        mimeType: "image/png",
      },
    };

    let guardResult;
    try {
      const result = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: guardPrompt },
          { inlineData: { data: screenshot, mimeType: "image/png" } },
        ],
      });
      const responseText = result.text;
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      guardResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ Visual Guard parse error:", parseErr.message);
      // If we can't parse, assume clear and let the main bot handle it
      return { clear: true, attempts };
    }

    console.log("🛡️ Guard result:", JSON.stringify(guardResult));

    // If CLEAR — exit loop and proceed
    if (guardResult.status === "CLEAR") {
      console.log("✅ Visual Guard: UI is clear — proceeding");
      return { clear: true, attempts };
    }

    // If OBSTRUCTED — perform clearance
    if (guardResult.status === "OBSTRUCTED") {
      console.log("⚠️ Visual Guard: Found obstruction:", guardResult.detected_obstacle);
      console.log("🔧 Visual Guard: Clearing with action:", guardResult.action);

      try {
        if (guardResult.action === "click") {
          const x = guardResult.target_coords?.x;
          const y = guardResult.target_coords?.y;

          if (x && y && x > 0 && y > 0) {
            await page.mouse.click(x, y);
            console.log("✅ Visual Guard: Clicked at coordinates:", x, y);
            await delay(1500);
          } else if (guardResult.dismissal_text) {
            const btnText = guardResult.dismissal_text;
            const clicked = await page.evaluate((text) => {
              const elements = document.querySelectorAll("button, a, span, div, p");
              for (const el of elements) {
                if (el.textContent.trim().toLowerCase().includes(text.toLowerCase()) && el.offsetParent !== null) {
                  el.click();
                  return true;
                }
              }
              return false;
            }, btnText);
            if (clicked) {
              console.log("✅ Visual Guard: Clicked by text:", btnText);
            } else {
              console.log("⚠️ Visual Guard: Could not find button text:", btnText);
            }
            await delay(1500);
          }
        }

        if (guardResult.action === "swipe") {
          const direction = guardResult.swipe_direction;
          if (direction === "up") {
            await page.mouse.move(195, 400);
            await page.mouse.down();
            await page.mouse.move(195, 100, { steps: 10 });
            await page.mouse.up();
          } else if (direction === "down") {
            await page.mouse.move(195, 100);
            await page.mouse.down();
            await page.mouse.move(195, 400, { steps: 10 });
            await page.mouse.up();
          }
          await delay(1000);
        }
      } catch (actionErr) {
        console.error("❌ Visual Guard: Clearance action failed:", actionErr.message);
        await delay(1000);
      }
    }
    // Continue loop to re-scan after clearance
  }

  // Max attempts reached
  console.error("❌ Visual Guard: Could not clear UI after", MAX_CLEARANCE_ATTEMPTS, "attempts");
  return { clear: false, attempts };
}

// ── Retry wrapper that runs Visual Guard before critical actions ──────────────

async function retryWithGuard(page, actionFn) {
  const guard = await visualGuard(page);
  if (!guard.clear) {
    throw new Error("UI not clear for action after " + guard.attempts + " guard attempts");
  }
  return await actionFn();
}

async function askGemini(page, instruction, context) {
  const screenshot = await page.screenshot({
    encoding: "base64",
    fullPage: false,
  });

  const client = await getGeminiClient();
  if (!client) {
    return {
      status: "error",
      action: "fail",
      errorMessage: "Gemini API key not configured",
    };
  }

  const prompt = `You are an intelligent automation agent controlling a Puppeteer browser to place a bet on $market Nigeria.

CURRENT TASK: ${instruction}

CONTEXT: ${JSON.stringify(context)}

CURRENT PAGE SCREENSHOT: [attached]

Look at the screenshot carefully and respond with ONLY a JSON object (no markdown, no explanation):

{
  "observation": "What you see on the screen right now",
  "status": "one of: popup_detected | betslip_loaded | bet_placed | error | loading | login_required | unexpected",
  "action": "one of: click | type | wait | scroll | done | fail",
  "target": "A valid CSS selector (e.g. '.close-btn') OR the EXACT text visible on the button (e.g. 'Skip For Now' or 'X'). Do NOT use long conversational descriptions like 'the close button'.",
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
12. The stake amount to use is: ${context.stakeAmount}
13. The Visual Guard has already cleared major obstructions. If you still see any popup, click the dismiss button immediately.
14. For "Account Protection" popup: ALWAYS click "Yes, it's me" — coordinates are usually bottom right of popup
15. For "Secure Your Account" popup: ALWAYS click "Skip For Now"
16. For any loading spinner or skeleton screen: Set action: wait, waitMs: 3000
17. If page appears blank or loading: Set action: wait, waitMs: 2000
18. The Visual Guard pre-processor already ran so main UI should be clear for betting`;


  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        { inlineData: { data: screenshot, mimeType: "image/png" } },
      ],
    });
    const responseText = result.text;

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

/**
 * Checks for and accepts any odds changes.
 * $market shows this as a green button spanning the place-bet div,
 * or as text changing to "Accept Changes".
 */
async function acceptOddsChanges(page) {
  try {
    const clicked = await page.evaluate(() => {
      // Look explicitly for the selector the user mentioned
      const acceptSpan = document.querySelector(".place-bet > span");
      if (acceptSpan && acceptSpan.textContent.toLowerCase().includes("accept")) {
        acceptSpan.click();
        return true;
      }
      
      // Fallback: any button with "accept changes"
      const btns = document.querySelectorAll("button, div, span");
      for (const btn of btns) {
        if (btn.textContent.trim().toLowerCase() === "accept changes" && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log("⚠️ Odds changed! Clicked 'Accept Changes' automatically.");
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

/**
 * Programmatically dismiss known $market popups using hardcoded CSS selectors.
 */
async function dismissAllPopups(page) {
  let dismissed = 0;

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await page.evaluate(() => {
      const actions = [];

      // ── 1. Location Preference popup ──────────────────────────────────────
      // The green "Confirm" button is the ONLY way to dismiss on mobile.
      // Check if the popup is visible by looking for "Location Preference" text
      const allText = document.body?.innerText || "";
      if (allText.includes("Location Preference")) {
        // Try the exact $market Ant Framework button class
        const confirmBtn =
          document.querySelector("button.af-button.af-button--primary") ||
          document.querySelector("button.af-button--primary") ||
          document.querySelector(".af-modal button.af-button") ||
          document.querySelector(".m-dialog button.af-button");

        if (confirmBtn && confirmBtn.offsetParent !== null) {
          confirmBtn.click();
          actions.push("clicked_location_confirm_af");
          return actions;
        }

        // Fallback: find any visible button with text "Confirm"
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
          const txt = btn.textContent.trim();
          if (txt === "Confirm" && btn.offsetParent !== null) {
            btn.click();
            actions.push("clicked_location_confirm_text");
            return actions;
          }
        }
      }

      // ── 2. Account Protection popup ───────────────────────────────────────
      if (allText.includes("Account Protection") || allText.includes("Is this you")) {
        const btns = document.querySelectorAll("button, div, a, span");
        for (const btn of btns) {
          const txt = btn.textContent.trim().toLowerCase();
          if (
            (txt.includes("yes") && txt.includes("me")) ||
            txt === "yes, it's me" ||
            txt === "yes, it's me"
          ) {
            btn.click();
            actions.push("clicked_account_protection_yes");
            return actions;
          }
        }
      }

      // ── 3. Secure Your Account / 2-step verification ──────────────────────
      if (
        allText.includes("Secure Your Account") ||
        allText.includes("2-step verification") ||
        allText.includes("Enable 2-step")
      ) {
        const btns = document.querySelectorAll("button, div, a, span");
        for (const btn of btns) {
          const txt = btn.textContent.trim().toLowerCase();
          if (txt.includes("skip") || txt === "skip for now") {
            btn.click();
            actions.push("clicked_skip_2step");
            return actions;
          }
        }
      }

      // ── 4. Generic modal close buttons ────────────────────────────────────
      const closeSelectors = [
        "div.drag-bar-wrapper",
        ".af-modal-close",
        ".m-dialog-close",
        ".modal-close",
        ".popup-close",
        "[class*='modal'] [class*='close']",
        "[class*='dialog'] [class*='close']",
      ];
      for (const sel of closeSelectors) {
        try {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) {
            el.click();
            actions.push("clicked_generic_close:" + sel);
            return actions;
          }
        } catch {}
      }

      // ── 5. Any visible overlay mask — click to dismiss ────────────────────
      const masks = document.querySelectorAll(
        ".af-modal-mask, .m-mask, .modal-mask, [class*='mask']"
      );
      for (const mask of masks) {
        if (mask.offsetParent !== null && mask.offsetWidth > 100) {
          // Don't click the mask if there's a confirm button — we need to click that instead
          const hasConfirm = mask.parentElement?.querySelector("button");
          if (!hasConfirm) {
            mask.click();
            actions.push("clicked_mask");
            return actions;
          }
        }
      }

      return actions; // empty = no popup found
    });

    if (result && result.length > 0) {
      console.log(`✅ Popup dismissed (attempt ${attempt + 1}):`, result.join(", "));
      dismissed++;
      await delay(1500); // wait for animation
    } else {
      // No popups found — we're clear
      if (attempt === 0) {
        console.log("✅ No popups detected — page is clear");
      }
      break;
    }
  }

  return dismissed;
}

/**
 * Type a number using $market's on-screen keyboard.
 * The betslip uses a custom keyboard, not a real <input>, so we
 * simulate tapping each digit key individually.
 */
async function typeStakeViaKeyboard(page, amount) {
  const digits = amount.toString().split("");
  for (const digit of digits) {
    // $market keyboard keys have class "m-keybord-key" with data-value or text content
    const typed = await page.evaluate((d) => {
      // Try multiple approaches to find keyboard keys
      const keys = document.querySelectorAll(
        ".m-keybord-key, .m-keyboard-key, [class*='keybord-key'], [class*='keyboard-key']"
      );
      for (const key of keys) {
        const text = key.textContent.trim();
        if (text === d) {
          key.click();
          return true;
        }
      }
      // Fallback: find any element in the keyboard area with this digit
      const allKeys = document.querySelectorAll(
        "[class*='keybord'] span, [class*='keyboard'] span, [class*='keybord'] div, [class*='keyboard'] div"
      );
      for (const key of allKeys) {
        if (key.textContent.trim() === d && key.children.length === 0) {
          key.click();
          return true;
        }
      }
      return false;
    }, digit);

    if (typed) {
      console.log(`  ⌨️ Typed digit: ${digit}`);
    } else {
      console.warn(`  ⚠️ Could not type digit: ${digit}`);
    }
    await delay(150); // small delay between key presses
  }
}

/**
 * Place a bet using hardcoded CSS selectors extracted from $market's mobile site.
 * Falls back to AI vision agent if the hardcoded flow fails.
 *
 * HARDCODED SELECTORS (manually extracted from live $market DOM):
 *   Stake input:     span.m-keybord-input:nth-child(3)
 *   Place Bet btn:   div.place-bet
 *   Confirm btn:     button.flexibet-confirm
 *   OK btn:          button.btn-ok
 */
async function placeBetWithAI(page, betLink, stakeAmount, signal, bot) {
  console.log("🤖 AI agent starting bet placement...");
  console.log("🔗 Link:", betLink);
  console.log("💰 Stake: £" + stakeAmount);

  // ── VISUAL GUARD: Pre-check before navigating ──────────────────────────────
  console.log("🛡️ Running Visual Guard before navigation...");
  const preNavGuard = await visualGuard(page);
  if (!preNavGuard.clear) {
    console.error("❌ Visual Guard: UI not clear before navigation — attempting anyway");
  }

  await page.goto(betLink, {
    waitUntil: "networkidle2",
    timeout: 25000,
  });
  await delay(3000);

  // ── STEP 0a: Programmatically dismiss known popups ────────────────────────
  console.log("🔍 Checking for known popups...");
  const popupsDismissed = await dismissAllPopups(page);
  if (popupsDismissed > 0) {
    console.log(`✅ Dismissed ${popupsDismissed} popup(s) programmatically`);
    await delay(2000);
  }

  // ── STEP 0b: Visual Guard after page load ─────────────────────────────────
  console.log("🛡️ Running Visual Guard after page load...");
  const postLoadGuard = await visualGuard(page);
  if (!postLoadGuard.clear) {
    console.error("❌ Visual Guard: Could not clear UI after page load");
    return { betPlaced: false, lastError: "Could not clear UI obstructions after page load", steps: 0 };
  }
  console.log("🤖 Main bot: Proceeding with bet placement...");

  // ══════════════════════════════════════════════════════════════════════════
  //  HARDCODED FLOW — Use exact CSS selectors from the live $market site
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n🎯 Attempting HARDCODED selector flow...");

  try {
    // ── Step 1: Click the stake input to open the keyboard ────────────────
    console.log("📝 Step 1: Clicking stake input...");
    let stakeInput = await page.$("span.m-keybord-input:nth-child(3)");
    if (!stakeInput) {
      // Try alternative selectors
      stakeInput = await page.$("span.m-keybord-input") ||
                   await page.$("[class*='keybord-input']") ||
                   await page.$("[class*='keyboard-input']");
    }

    if (stakeInput) {
      await stakeInput.click();
      console.log("✅ Clicked stake input (span.m-keybord-input)");
      await delay(800);

      // ── Step 2: Type the stake amount via on-screen keyboard ───────────
      console.log("📝 Step 2: Typing stake amount: £" + stakeAmount);

      // First clear any existing value by clicking "C" or delete key
      const cleared = await page.evaluate(() => {
        const clearKeys = document.querySelectorAll(
          ".m-keybord-key, .m-keyboard-key, [class*='keybord-key'], [class*='keyboard-key']"
        );
        for (const key of clearKeys) {
          const text = key.textContent.trim().toUpperCase();
          if (text === "C" || text === "CLR" || text === "CLEAR" || text === "DEL") {
            key.click();
            return text;
          }
        }
        return null;
      });
      if (cleared) {
        console.log(`  ⌨️ Cleared with key: ${cleared}`);
        await delay(300);
      }

      // Type each digit
      await typeStakeViaKeyboard(page, stakeAmount);
      await delay(500);

      // Confirm/close the keyboard if there's a confirm button
      const keyboardConfirmed = await page.evaluate(() => {
        const btns = document.querySelectorAll(
          ".m-keybord-key, .m-keyboard-key, [class*='keybord'] button, [class*='keyboard'] button"
        );
        for (const btn of btns) {
          const text = btn.textContent.trim().toUpperCase();
          if (text === "OK" || text === "✓" || text === "DONE" || text === "CONFIRM") {
            btn.click();
            return text;
          }
        }
        return null;
      });
      if (keyboardConfirmed) {
        console.log(`  ⌨️ Keyboard confirmed with: ${keyboardConfirmed}`);
        await delay(500);
      }
    } else {
      console.log("⚠️ Stake input not found — stake may already be pre-filled");
      // Try direct input approach as fallback
      const directInput = await page.$("input[type='text'], input[type='number']");
      if (directInput) {
        await directInput.click({ clickCount: 3 });
        await directInput.type(stakeAmount.toString(), { delay: 50 });
        console.log("✅ Typed stake via direct input fallback");
        await delay(500);
      }
    }

    // ── Step 3: Click "Place Bet" and Handle Odds Changes ─────────────────
    console.log("📝 Step 3: Clicking Place Bet and handling any odds changes...");
    await delay(1000);

    let placeBetSuccess = false;
    for (let attempts = 0; attempts < 3; attempts++) {
      // 1. Check for "Accept Changes"
      const acceptChangesSpan = await page.$(".place-bet > span");
      if (acceptChangesSpan) {
        const text = await page.evaluate(el => el.textContent.trim().toLowerCase(), acceptChangesSpan);
        if (text.includes("accept") || text.includes("change")) {
          console.log("⚠️ Odds changed! Clicking 'Accept Changes' (.place-bet > span)...");
          try { await acceptChangesSpan.click(); } catch (e) {}
          await delay(1500); // wait for changes to be accepted
        }
      }

      // 2. Find Place Bet button
      let placeBetBtn = await page.$("div.place-bet") || 
                        await page.$("[class*='place-bet']") || 
                        await page.$(".place-bet-btn") || 
                        await page.$("button.place-bet");
      
      if (placeBetBtn) {
        try { await placeBetBtn.click(); } catch (e) {}
        console.log(`✅ Clicked Place Bet (Attempt ${attempts + 1})`);
        await delay(3000); // wait for confirmation dialog or odds change

        // 3. Check if we reached the Confirm step
        let confirmBtn = await page.$("button.flexibet-confirm") || 
                         await page.$("[class*='flexibet-confirm']") || 
                         await page.$("button.confirm");
        
        if (confirmBtn) {
          console.log("✅ Confirmation screen reached.");
          placeBetSuccess = true;
          break; // successfully reached confirm step
        } else {
          console.log("⚠️ Confirm button not found. Checking if odds changed again...");
        }
      } else {
        // Text fallback
        const clicked = await page.evaluate(() => {
          const els = document.querySelectorAll("div, button, a, span");
          for (const el of els) {
            const text = el.textContent.trim().toLowerCase();
            if (text === "place bet" && el.offsetParent !== null) {
              el.click();
              return true;
            }
          }
          return false;
        });
        
        if (clicked) {
          console.log("✅ Clicked Place Bet by text fallback");
          await delay(3000);
          placeBetSuccess = true; // assume success for text fallback
          break;
        } else {
          console.log("❌ Could not find Place Bet button");
          throw new Error("Place Bet button not found");
        }
      }
    }

    // ── Step 4: Click "Confirm" (flexibet-confirm) ──────────────────────
    console.log("📝 Step 4: Clicking Confirm...");
    await dismissAllPopups(page); // dismiss any new popups

    let confirmBtn = await page.$("button.flexibet-confirm");
    if (!confirmBtn) {
      confirmBtn = await page.$("[class*='flexibet-confirm']") ||
                   await page.$("[class*='confirm-bet']") ||
                   await page.$("button.confirm");
    }

    if (confirmBtn) {
      await confirmBtn.click();
      console.log("✅ Clicked Confirm (button.flexibet-confirm)");
      await delay(5000); // wait for bet to be processed
    } else {
      // Text fallback — look for Confirm button
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll("button, div, a");
        for (const btn of btns) {
          const text = btn.textContent.trim().toLowerCase();
          if ((text === "confirm" || text === "confirm bet" || text === "place bet") &&
              btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (clicked) {
        console.log("✅ Clicked Confirm by text fallback");
        await delay(5000);
      } else {
        console.log("⚠️ Confirm button not found — bet may have been placed directly");
        await delay(3000);
      }
    }

    // ── Step 5: Click "OK" (btn-ok) — success confirmation ──────────────
    console.log("📝 Step 5: Looking for OK confirmation...");
    await delay(2000);

    let okBtn = await page.$("button.btn-ok");
    if (!okBtn) {
      okBtn = await page.$("[class*='btn-ok']") ||
              await page.$(".ok-btn") ||
              await page.$("button.success-ok");
    }

    if (okBtn) {
      await okBtn.click();
      console.log("✅ Clicked OK (button.btn-ok) — BET PLACED SUCCESSFULLY! 🎉");
      return { betPlaced: true, lastError: null, steps: 1 };
    }

    // Check if we see a success message even without OK button
    const successCheck = await page.evaluate(() => {
      const text = document.body.innerText || "";
      if (
        text.includes("Bet Placed") ||
        text.includes("bet placed") ||
        text.includes("Successfully") ||
        text.includes("successfully") ||
        text.includes("Bet ID") ||
        text.includes("Congratulations")
      ) {
        return true;
      }
      return false;
    });

    if (successCheck) {
      console.log("✅ Success message detected — BET PLACED SUCCESSFULLY! 🎉");
      return { betPlaced: true, lastError: null, steps: 1 };
    }

    console.log("⚠️ Hardcoded flow completed but no success confirmation detected");
    console.log("🤖 Falling back to AI vision agent for verification...");

  } catch (hardcodedErr) {
    console.error("⚠️ Hardcoded flow error:", hardcodedErr.message);
    console.log("🤖 Falling back to AI vision agent...");
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  AI FALLBACK — Use Gemini vision if hardcoded flow didn't confirm success
  // ══════════════════════════════════════════════════════════════════════════

  const context = {
    task: "Place a bet on $market",
    betLink,
    stakeAmount,
    fixture: signal.home + " vs " + signal.away,
    market: signal.betType,
    league: signal.league,
    minute: signal.minute,
  };

  let steps = 0;
  let betPlaced = false;
  let lastError = null;

  while (steps < MAX_AI_STEPS && !betPlaced) {
    steps++;
    console.log(`\n🤖 AI Fallback Step ${steps}/${MAX_AI_STEPS}`);

    // ── VISUAL GUARD: Run before every AI step ──────────────────────────────
    console.log("🛡️ Running Visual Guard check...");
    const guardResult = await visualGuard(page);
    if (!guardResult.clear) {
      console.log("⚠️ Visual Guard could not clear UI — trying dismissAllPopups fallback");
      await dismissAllPopups(page);
    }

    const decision = await askGemini(
      page,
      `Check the current state of $market. The hardcoded flow already attempted to:
1. Enter stake £${stakeAmount}
2. Click Place Bet
3. Click Confirm
4. Click OK

Look at the screen and determine: Was the bet placed successfully? If you see a success message, bet ID, or confirmation, set betPlaced:true. 
If you see an error message (like "Selection Suspended", "Odds Changed", "Invalid code", etc.) or a "Got it" button acknowledging an error, set status: "error" and action: "fail". DO NOT try to click "Got it" and continue.
If you see the betslip still showing without errors, try clicking the Place Bet button (selector: div.place-bet) or the Confirm button (selector: button.flexibet-confirm) or OK button (selector: button.btn-ok).`,
      context
    );

    console.log("🧠 Gemini says:", JSON.stringify(decision));

    if (decision.betPlaced || decision.status === "bet_placed") {
      console.log("✅ Bet placed successfully (confirmed by AI)!");
      betPlaced = true;
      break;
    }

    if (decision.action === "fail" || decision.status === "error") {
      lastError = decision.errorMessage;
      console.error("❌ AI detected error:", lastError);
      break;
    }

    if (decision.status === "login_required") {
      lastError = "Session expired — reconnect $market";
      break;
    }

    try {
      if (decision.action === "click") {
        // Try the AI's suggested selector
        let el = null;
        try { el = await page.$(decision.target); } catch {}

        // Also try our hardcoded selectors based on context
        if (!el && decision.target?.toLowerCase().includes("place")) {
          el = await page.$("div.place-bet");
        }
        if (!el && decision.target?.toLowerCase().includes("confirm")) {
          el = await page.$("button.flexibet-confirm");
        }
        if (!el && decision.target?.toLowerCase().includes("ok")) {
          el = await page.$("button.btn-ok");
        }

        if (el) {
          await el.click();
          console.log("✅ Clicked:", decision.target);
        } else {
          // Text fallback
          const clicked = await page.evaluate((text) => {
            const elements = document.querySelectorAll("button, a, span, div, i, input");
            const search = text.toLowerCase();
            for (const el of elements) {
              const elText = el.textContent.trim().toLowerCase();
              if (elText && (elText === search || elText.includes(search))) {
                el.click();
                return true;
              }
            }
            return false;
          }, decision.target);
          if (clicked) {
            console.log("✅ Clicked by text:", decision.target);
          } else {
            console.log("⚠️ Could not click:", decision.target);
          }
        }
        await delay(decision.waitMs || 2000);
      }

      if (decision.action === "type") {
        // Use keyboard typing for stake
        await typeStakeViaKeyboard(page, decision.value || stakeAmount);
        await delay(500);
      }

      if (decision.action === "wait") {
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
  const sb = read$market();
  if (!sb.bots) return;
  const bot = sb.bots.find((b) => b.id === botId);
  if (!bot) return;

  bot.totalBets = (bot.totalBets || 0) + 1;
  if (success) {
    bot.settledBets = (bot.settledBets || 0) + 1;
  }

  write$market(sb);
}

// ── Main Export ──────────────────────────────────────────────────────────────

export async function processSignalForBots(signal) {
  console.log(
    "\n🎯 Processing signal for bots:",
    signal.home + " vs " + signal.away
  );

  const configs = getAll$marketConfigs();
  const activeUsers = configs.filter(c => c.data.connected && c.data.encodedCredentials && (c.data.bots || []).some(b => b.active));
  
  if (activeUsers.length === 0) {
    console.log("⚠️ No active bots for any user — skipping");
    return;
  }

  // Get share link once
  const betLink = await getShareLink(signal);
  if (!betLink) {
    console.log("⚠️ No share link available — skipping");
    for (const userConfig of activeUsers) {
      appendLog(userConfig.userId, {
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
    }
    return;
  }

  for (const userConfig of activeUsers) {
    const userId = userConfig.userId;
    console.log("\n--- Processing for user: " + userId + " ---");

    const $market = get$market(userId);
    if (!$market) continue;

    const activeBots = getActiveBots(userId);
    if (activeBots.length === 0) continue;

    for (const bot of activeBots) {
      console.log("\n🤖 Checking bot:", bot.name);

      if (bot.maxConcurrentBets && activeBetCount >= parseInt(bot.maxConcurrentBets)) {
        console.log("⚠️ Max concurrent bets reached");
        continue;
      }

      const matchResult = signalMatchesBot(signal, bot, userId);
      if (!matchResult.match) continue;

      const stakeAmount = calculateStake(bot, $market);

      if (stakeAmount < 100) {
        appendLog(userId, { type: "ERROR", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, botName: bot.name, botId: bot.id, market: signal.betType, stake: stakeAmount, betLink, status: "Stake too small: £" + stakeAmount + " (minimum £100)", simulation: matchResult.simulation });
        continue;
      }

      appendLog(userId, { type: "ENTRY", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, league: signal.league, botName: bot.name, botId: bot.id, market: signal.betType, confidence: signal.confidence, minute: signal.minute, stake: stakeAmount, betLink, status: "Attempting bet placement...", simulation: matchResult.simulation });

      if (matchResult.simulation) {
        appendLog(userId, { type: "SUCCESS", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, league: signal.league, botName: bot.name, botId: bot.id, market: signal.betType, confidence: signal.confidence, minute: signal.minute, stake: stakeAmount, betLink, status: "Simulated bet: £" + stakeAmount.toLocaleString() + " on " + signal.betType, simulation: true });
        continue;
      }

      let browser = null;
      try {
        activeBetCount++;
        const { login$market } = await import("./$marketScraper.js");
        const loginResult = await login$market($market.phone, $market.password);

        if (!loginResult.success) {
          appendLog(userId, { type: "ERROR", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, botName: bot.name, botId: bot.id, market: signal.betType, stake: stakeAmount, betLink, status: "Login failed: " + loginResult.error, simulation: false });
          continue;
        }

        browser = loginResult.browser;
        const page = loginResult.page;

        let result = { betPlaced: false, lastError: "Unknown" };
        
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (attempt > 1) {
            await page.goto(betLink, { waitUntil: "domcontentloaded", timeout: 45000 });
            await new Promise(r => setTimeout(r, 3000));
          }
          result = await placeBetWithAI(page, betLink, stakeAmount, signal, bot);
          if (result.betPlaced) break;
        }

        if (result.betPlaced) {
          appendLog(userId, { type: "SUCCESS", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, league: signal.league, botName: bot.name, botId: bot.id, market: signal.betType, confidence: signal.confidence, minute: signal.minute, stake: stakeAmount, betLink, status: "✅ Bet placed: £" + stakeAmount.toLocaleString() + " on " + signal.betType, aiSteps: result.steps, simulation: false });
        } else {
          appendLog(userId, { type: "ERROR", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, league: signal.league, botName: bot.name, botId: bot.id, market: signal.betType, stake: stakeAmount, betLink, status: "❌ Failed: " + result.lastError, aiSteps: result.steps, simulation: false });
        }
      } catch (err) {
        appendLog(userId, { type: "ERROR", fixtureId: signal.fixtureId, match: signal.home + " v " + signal.away, botName: bot.name, botId: bot.id, market: signal.betType, stake: stakeAmount, betLink, status: "Error: " + err.message, simulation: false });
      } finally {
        activeBetCount = Math.max(0, activeBetCount - 1);
        if (browser) await browser.close();
      }
    }
  }
}

export async function testAutomation(userId, betLink, stakeAmount = 100) {
  console.log("\n════════════════════════════════════════════════");
  console.log("🧪 TEST AUTOMATION — Manual Trigger");
  console.log("   Link:", betLink);
  console.log("   Stake: £" + stakeAmount);
  console.log("════════════════════════════════════════════════\n");

  // Step 1 — Check $market connected
  const $market = get$market(userId);
  if (!$market) {
    const err = "$market not connected — go to Integration tab and connect first";
    console.log("❌", err);
    appendLog(userId, {
      type: "ERROR",
      match: "Test Automation",
      botName: "Manual Test",
      botId: "test",
      market: "test",
      stake: stakeAmount,
      betLink,
      status: err,
      simulation: false,
    });
    return { success: false, error: err };
  }

  // Step 2 — Check Gemini API key
  const client = await getGeminiClient();
  if (!client) {
    const err = "Gemini API key not configured — add it in .env or Admin Panel settings";
    console.log("❌", err);
    appendLog(userId, {
      type: "ERROR",
      match: "Test Automation",
      botName: "Manual Test",
      botId: "test",
      market: "test",
      stake: stakeAmount,
      betLink,
      status: err,
      simulation: false,
    });
    return { success: false, error: err };
  }

  // Step 3 — Login to $market
  let browser = null;
  try {
    const { login$market } = await import("./$marketScraper.js");

    console.log("🔄 Launching browser...");
    appendLog(userId, {
      type: "ENTRY",
      match: "Test Automation",
      botName: "Manual Test",
      botId: "test",
      market: "test",
      stake: stakeAmount,
      betLink,
      status: "Launching browser and logging in...",
      simulation: false,
    });

    const loginResult = await login$market($market.phone, $market.password);

    if (!loginResult.success) {
      const err = "Login failed: " + loginResult.error;
      console.log("❌", err);
      appendLog(userId, {
        type: "ERROR",
        match: "Test Automation",
        botName: "Manual Test",
        botId: "test",
        market: "test",
        stake: stakeAmount,
        betLink,
        status: err,
        simulation: false,
      });
      return { success: false, error: err };
    }

    browser = loginResult.browser;
    const page = loginResult.page;
    console.log("✅ Login successful, navigating to bet link...");

    // Step 4 — Run AI bet placement
    const fakeSignal = {
      home: "Test Home",
      away: "Test Away",
      betType: "Over 1.5",
      league: "Test",
      minute: 60,
    };
    const fakeBot = { name: "Manual Test", id: "test" };

    const result = await placeBetWithAI(page, betLink, stakeAmount, fakeSignal, fakeBot);

    if (result.betPlaced) {
      console.log("✅ TEST: Bet placed successfully!");
      appendLog(userId, {
        type: "SUCCESS",
        match: "Test Automation",
        botName: "Manual Test",
        botId: "test",
        market: "test",
        stake: stakeAmount,
        betLink,
        status: "✅ Test bet placed successfully in " + result.steps + " AI steps",
        aiSteps: result.steps,
        simulation: false,
      });
      // Don't close browser immediately so user can see the result
      setTimeout(async () => {
        if (browser) {
          await browser.close();
          console.log("🔒 Test browser closed after delay");
        }
      }, 15000);
      return { success: true, steps: result.steps, betPlaced: true };
    } else {
      console.error("❌ TEST: Bet failed:", result.lastError);
      appendLog(userId, {
        type: "ERROR",
        match: "Test Automation",
        botName: "Manual Test",
        botId: "test",
        market: "test",
        stake: stakeAmount,
        betLink,
        status: "❌ Test failed: " + result.lastError,
        aiSteps: result.steps,
        simulation: false,
      });
      // Keep browser open for 30s so user can debug
      setTimeout(async () => {
        if (browser) {
          await browser.close();
          console.log("🔒 Test browser closed after delay");
        }
      }, 30000);
      return { success: false, error: result.lastError, steps: result.steps };
    }
  } catch (err) {
    console.error("❌ Test automation error:", err.message);
    appendLog(userId, {
      type: "ERROR",
      match: "Test Automation",
      botName: "Manual Test",
      botId: "test",
      market: "test",
      stake: stakeAmount,
      betLink,
      status: "Error: " + err.message,
      simulation: false,
    });
    if (browser) {
      setTimeout(async () => {
        await browser.close();
      }, 10000);
    }
    return { success: false, error: err.message };
  }
}

