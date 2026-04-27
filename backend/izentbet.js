import fetch from 'node-fetch';

// ── Call the IzentBet AI endpoint DIRECTLY ───────────────────────────────────
// DO NOT call our own /api/ai-chat proxy — that causes the server to call
// itself, which deadlocks when the event loop is busy during the poll cycle.
const AI_DIRECT_ENDPOINT = "https://backend-production-2d71.up.railway.app/functions/v1/ai-bet";

// Timeout for each AI request (45 seconds — the AI can be slow)
const FETCH_TIMEOUT_MS = 45000;

/**
 * Sleep helper for retry delays.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean a betType string into a short market label for prompts.
 * "Back Over 1.5 Goals" → "Over 1.5"
 * "Both Teams to Score"  → "Both Teams to Score"
 */
function cleanMarket(betType) {
  if (!betType) return 'Over 1.5';
  if (betType.includes('Over 0.5')) return 'Over 0.5';
  if (betType.includes('Over 1.5')) return 'Over 1.5';
  if (betType.includes('Over 2.5')) return 'Over 2.5';
  if (betType.includes('Both Teams')) return 'Both Teams to Score';
  return betType.replace('Back ', '').replace(' Goals', '');
}

/**
 * Fetch with a timeout using AbortController.
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

/**
 * Try to extract a SportyBet share code from ALL possible response locations.
 * Returns the share code string or null.
 */
function extractShareCode(data) {
  if (!data) {
    console.log("❌ extractShareCode: data is null/undefined");
    return null;
  }

  console.log("🔍 Searching for share code in:", JSON.stringify(data).slice(0, 400));

  // ── Path 1: data.data.converted_codes.sportybet ──────────────────────────
  const code1 = data?.data?.converted_codes?.sportybet;
  if (code1) {
    console.log("✅ Found in data.data.converted_codes.sportybet:", code1);
    return code1;
  }

  // ── Path 2: data.data.booking_code ────────────────────────────────────────
  const code2 = data?.data?.booking_code;
  if (code2) {
    console.log("✅ Found in data.data.booking_code:", code2);
    return code2;
  }

  // ── Path 3: data.converted_codes.sportybet ────────────────────────────────
  const code3 = data?.converted_codes?.sportybet;
  if (code3) {
    console.log("✅ Found in data.converted_codes.sportybet:", code3);
    return code3;
  }

  // ── Path 4: data.booking_code ─────────────────────────────────────────────
  const code4 = data?.booking_code;
  if (code4) {
    console.log("✅ Found in data.booking_code:", code4);
    return code4;
  }

  // ── Path 5: inside selections array ───────────────────────────────────────
  const selections = data?.data?.selections || data?.selections;
  if (selections && Array.isArray(selections)) {
    for (const sel of selections) {
      // Check known field names
      if (sel.booking_code) {
        console.log("✅ Found in sel.booking_code:", sel.booking_code);
        return sel.booking_code;
      }
      if (sel.code) {
        console.log("✅ Found in sel.code:", sel.code);
        return sel.code;
      }
      if (sel.share_code) {
        console.log("✅ Found in sel.share_code:", sel.share_code);
        return sel.share_code;
      }
      if (sel.sportybet_code) {
        console.log("✅ Found in sel.sportybet_code:", sel.sportybet_code);
        return sel.sportybet_code;
      }
      if (sel.shareCode) {
        console.log("✅ Found in sel.shareCode:", sel.shareCode);
        return sel.shareCode;
      }

      // Search the selection text for a 6-char alphanumeric code
      const selStr = JSON.stringify(sel);
      const selCodeMatch = selStr.match(/\b[A-Z0-9]{6}\b/g);
      if (selCodeMatch && selCodeMatch.length > 0) {
        // Filter out common false positives (odds, IDs, etc.)
        const candidate = selCodeMatch.find(c => /[A-Z]/.test(c) && /[0-9]/.test(c));
        if (candidate) {
          console.log("✅ Found code pattern in selection:", candidate);
          return candidate;
        }
      }
    }
  }

  // ── Path 6: extract from sportybet_url anywhere in response ───────────────
  const fullStr = JSON.stringify(data);

  const urlMatch = fullStr.match(/shareCode=([A-Z0-9]+)/i);
  if (urlMatch) {
    console.log("✅ Found code in shareCode URL param:", urlMatch[1]);
    return urlMatch[1];
  }

  const sportybetUrlMatch = fullStr.match(/sportybet\.com[^"]*?([A-Z0-9]{6})/i);
  if (sportybetUrlMatch) {
    console.log("✅ Found code in sportybet URL:", sportybetUrlMatch[1]);
    return sportybetUrlMatch[1];
  }

  // ── Path 7: search message text for a code pattern ────────────────────────
  const message = data?.data?.message || data?.message || "";
  if (message) {
    const msgMatch = message.match(/\b[A-Z0-9]{6}\b/g);
    if (msgMatch) {
      const candidate = msgMatch.find(c => /[A-Z]/.test(c) && /[0-9]/.test(c));
      if (candidate) {
        console.log("✅ Found code in message text:", candidate);
        return candidate;
      }
    }
  }

  // ── Path 8: brute-force search entire response for booking code pattern ───
  // Look for "booking_code":"XXXXXX" or "sportybet":"XXXXXX" patterns
  const codeFieldMatch = fullStr.match(/"(?:booking_code|sportybet|share_code|shareCode|code)"\s*:\s*"([A-Z0-9]{5,8})"/i);
  if (codeFieldMatch) {
    console.log("✅ Found code via field pattern match:", codeFieldMatch[1]);
    return codeFieldMatch[1];
  }

  console.log("❌ No share code found anywhere in response");
  console.log("Full response:", fullStr.slice(0, 500));
  return null;
}

/**
 * Convert a fixture to a SportyBet booking code using the IzentBet AI endpoint.
 * Makes up to 3 attempts with progressively more explicit prompts.
 * Includes retry delays and 45-second timeout per attempt.
 *
 * @param {string} home  - Home team name
 * @param {string} away  - Away team name
 * @param {string} betType - Raw betType e.g. "Back Over 1.5 Goals"
 * @returns {Promise<{success:boolean, shareCode:string|null, betLink:string|null, market:string, totalOdds:number|null, error:string|null}>}
 */
export async function convertToSportybet(home, away, betType) {
  const market = cleanMarket(betType);

  console.log(`\n════════════════════════════════════════════════`);
  console.log(`🔄 convertToSportybet() called`);
  console.log(`   Home: ${home}`);
  console.log(`   Away: ${away}`);
  console.log(`   Market: ${market}`);
  console.log(`   Endpoint: ${AI_DIRECT_ENDPOINT}`);
  console.log(`   Timeout: ${FETCH_TIMEOUT_MS / 1000}s`);
  console.log(`════════════════════════════════════════════════\n`);

  const prompts = [
    // Attempt 1 — simple prompt (matches what works in admin chat)
    `${home} vs ${away} ${market}`,

    // Attempt 2 — explicit request for booking code
    `Convert this fixture to SportyBet booking code:\n${home} vs ${away} - ${market}`,

    // Attempt 3 — very explicit with instructions
    `I need the SportyBet Nigeria booking code for this exact match: ${home} vs ${away}. Market: ${market}. Please search SportyBet Nigeria and return the booking/share code.`,
  ];

  // Delay between retries: 0s, 3s, 5s
  const retryDelays = [0, 3000, 5000];

  for (let i = 0; i < prompts.length; i++) {
    const attemptNum = i + 1;

    // Wait before retry (skip wait on first attempt)
    if (retryDelays[i] > 0) {
      console.log(`⏳ Waiting ${retryDelays[i] / 1000}s before attempt ${attemptNum}...`);
      await sleep(retryDelays[i]);
    }

    const requestBody = {
      messages: [{ role: 'user', content: prompts[i] }],
    };

    try {
      console.log(`📡 [Attempt ${attemptNum}] Calling: ${AI_DIRECT_ENDPOINT}`);
      console.log(`📤 Request body: ${JSON.stringify(requestBody)}`);

      const res = await fetchWithTimeout(AI_DIRECT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, FETCH_TIMEOUT_MS);

      console.log(`📥 Response status: ${res.status}`);

      if (!res.ok) {
        console.warn(`⚠️ Attempt ${attemptNum} HTTP ${res.status}, trying next...`);
        continue;
      }

      // Read as text FIRST for logging, then parse
      const rawText = await res.text();
      console.log(`=== FULL RAW RESPONSE (attempt ${attemptNum}) ===`);
      console.log(rawText);
      console.log(`=================================================`);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.error(`❌ Attempt ${attemptNum} JSON parse failed:`, parseErr.message);
        continue;
      }

      console.log(`📥 Parsed — success: ${data?.success}, has data: ${!!data?.data}`);
      if (data?.data) {
        console.log(`📥 data.data keys: ${Object.keys(data.data).join(', ')}`);
        console.log(`📥 has converted_codes: ${!!data.data.converted_codes}`);
        console.log(`📥 has booking_code: ${!!data.data.booking_code}`);
        console.log(`📥 has selections: ${!!data.data.selections}`);
      }

      // Extract share code from ALL possible locations
      const shareCode = extractShareCode(data);

      if (shareCode) {
        const betLink = `https://www.sportybet.com/ng/m/?shareCode=${shareCode}&c=ng#betslip`;
        const totalOdds = data?.data?.total_odds || null;

        console.log(`✅ Share code extracted: ${shareCode}`);
        console.log(`✅ Bet link: ${betLink}`);
        console.log(`✅ Total odds: ${totalOdds}`);

        return {
          success: true,
          shareCode,
          betLink,
          market,
          totalOdds,
          error: null,
        };
      }

      console.warn(`⚠️ Attempt ${attemptNum} — no share code found, trying next...`);
      console.log(`Full response was: ${JSON.stringify(data).slice(0, 600)}`);
    } catch (err) {
      console.error(`❌ Attempt ${attemptNum} failed: ${err.message}`);
    }
  }

  console.error(`❌ All 3 conversion attempts exhausted for: ${home} vs ${away}`);
  return {
    success: false,
    shareCode: null,
    betLink: null,
    market,
    totalOdds: null,
    error: 'Could not extract Sportybet code after 3 attempts',
  };
}

/**
 * Fetch SportyBet + Bet9ja booking codes from the IzentBet API
 * for a single signal. Uses the AI endpoint directly.
 *
 * @param {Object} signal  – signal object with home, away, league, betType fields
 * @returns {Promise<{sportybet: string|null, sportybet_url: string|null, bet9ja: string|null}|null>}
 */
export async function getIzentBetCodes(signal) {
  console.log(`🔄 getIzentBetCodes() — ${signal.home} vs ${signal.away}`);

  const result = await convertToSportybet(signal.home, signal.away, signal.betType);

  if (result.success) {
    console.log(`✅ Sportybet link ready: ${result.betLink}`);
    return {
      sportybet: result.shareCode,
      sportybet_url: result.betLink,
      bet9ja: null,
    };
  }

  console.warn(`⚠️ No Sportybet link for: ${signal.home} vs ${signal.away}`);
  return null;
}
