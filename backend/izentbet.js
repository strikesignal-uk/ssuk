import fetch from 'node-fetch';

const IZENTBET_API = "https://backend-production-2d71.up.railway.app/api/v1/strikesignal/convert";
const IZENTBET_AI_API = "https://backend-production-2d71.up.railway.app/functions/v1/ai-bet";
const API_KEY = "sk_strike_izent_2026_live";

// The AI Chat proxy on our own backend — no auth needed
const AI_CHAT_ENDPOINT = "https://strikesignal-api-production.up.railway.app/api/ai-chat";

/**
 * Map StrikeSignal betType strings to the IzentBet market + selection format.
 */
function mapBetType(betType) {
  switch (betType) {
    case 'Back Over 1.5 Goals':
      return { market: 'totals', selection: 'Over 1.5' };
    case 'Back Over 2.5 Goals':
      return { market: 'totals', selection: 'Over 2.5' };
    case 'Both Teams to Score':
      return { market: 'Both Teams To Score', selection: 'Yes' };
    default:
      return { market: 'totals', selection: 'Over 1.5' };
  }
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
 * Try to extract a SportyBet share code from various response shapes.
 * Returns the share code string or null.
 */
function extractShareCode(data) {
  if (!data) return null;

  // Path 1: data.data.converted_codes.sportybet
  const code1 = data.data?.converted_codes?.sportybet;
  if (code1) return code1;

  // Path 2: data.data.booking_code
  const code2 = data.data?.booking_code;
  if (code2) return code2;

  // Path 3: data.converted_codes?.sportybet
  const code3 = data.converted_codes?.sportybet;
  if (code3) return code3;

  // Path 4: data.booking_code
  const code4 = data.booking_code;
  if (code4) return code4;

  // Path 5: extract from sportybet_url
  const url = data.data?.converted_codes?.sportybet_url
            || data.converted_codes?.sportybet_url;
  if (url) {
    const match = url.match(/shareCode=([^&]+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Convert a fixture to a SportyBet booking code using the AI Chat endpoint.
 * Makes up to 3 attempts with progressively more explicit prompts.
 *
 * @param {string} home  - Home team name
 * @param {string} away  - Away team name
 * @param {string} betType - Raw betType e.g. "Back Over 1.5 Goals"
 * @returns {Promise<{success:boolean, shareCode:string|null, betLink:string|null, market:string, totalOdds:number|null, error:string|null}>}
 */
export async function convertToSportybet(home, away, betType) {
  const market = cleanMarket(betType);

  const prompts = [
    // Attempt 1 — standard prompt
    `Convert this fixture to SportyBet booking code:\n${home} vs ${away} - ${market}`,

    // Attempt 2 — more explicit
    `I need the SportyBet booking code for this exact match: ${home} vs ${away}. Market: ${market}. Please provide the SportyBet Nigeria booking code only.`,

    // Attempt 3 — urgent / detailed
    `SportyBet Nigeria booking code needed urgently.\nMatch: ${home} v ${away}\nBet type: ${market}\nPlease search SportyBet Nigeria and return the booking/share code.`,
  ];

  for (let i = 0; i < prompts.length; i++) {
    const attemptNum = i + 1;
    try {
      console.log(`📡 Calling AI Chat endpoint (attempt ${attemptNum})...`);

      const res = await fetch(AI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[i] }],
        }),
      });

      if (!res.ok) {
        console.warn(`⚠️ Attempt ${attemptNum} HTTP ${res.status}, trying next...`);
        continue;
      }

      const data = await res.json();
      const shareCode = extractShareCode(data);

      if (shareCode) {
        const betLink = `https://www.sportybet.com/ng/m/?shareCode=${shareCode}&c=ng#betslip`;
        const totalOdds = data.data?.total_odds || null;

        console.log(`✅ Share code found: ${shareCode} on attempt ${attemptNum}`);

        return {
          success: true,
          shareCode,
          betLink,
          market,
          totalOdds,
          error: null,
        };
      }

      console.warn(`⚠️ Attempt ${attemptNum} returned no share code, trying next...`);
    } catch (err) {
      console.error(`❌ Attempt ${attemptNum} failed:`, err.message);
    }
  }

  console.error(`❌ All conversion attempts failed for: ${home} vs ${away}`);
  return {
    success: false,
    shareCode: null,
    betLink: null,
    market,
    totalOdds: null,
    error: 'Could not get Sportybet code after 3 attempts',
  };
}

/**
 * Fetch SportyBet + Bet9ja booking codes from the IzentBet API
 * for a single signal. Now uses the AI Chat proxy exclusively.
 *
 * @param {Object} signal  – signal object with home, away, league, betType fields
 * @returns {Promise<{sportybet: string|null, sportybet_url: string|null, bet9ja: string|null}|null>}
 */
export async function getIzentBetCodes(signal) {
  console.log(`🔄 Converting fixture to Sportybet code: ${signal.home} vs ${signal.away}`);

  const result = await convertToSportybet(signal.home, signal.away, signal.betType);

  if (result.success) {
    console.log(`✅ Sportybet link ready: ${result.betLink}`);
    return {
      sportybet: result.shareCode,
      sportybet_url: result.betLink,
      bet9ja: null, // Bet9ja handled separately via AI Chat fallback if needed
    };
  }

  console.warn(`⚠️ No Sportybet link for: ${signal.home} vs ${signal.away}`);
  return null;
}
