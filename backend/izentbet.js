import fetch from 'node-fetch';

const IZENTBET_API = "https://backend-production-2d71.up.railway.app/api/v1/strikesignal/convert";
const API_KEY = "sk_strike_izent_2026_live";

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
      return { market: 'btts', selection: 'Yes' };
    default:
      return { market: 'totals', selection: 'Over 1.5' };
  }
}

/**
 * Fetch SportyBet + Bet9ja booking codes from the IzentBet API
 * for a single signal.
 *
 * @param {Object} signal  – signal object with home, away, league, betType fields
 * @returns {Promise<{sportybet: string|null, sportybet_url: string|null, bet9ja: string|null}|null>}
 */
export async function getIzentBetCodes(signal) {
  try {
    const { market, selection } = mapBetType(signal.betType);

    const selections = [
      {
        home_team: signal.home,
        away_team: signal.away,
        market,
        selection,
        sport: 'football',
      },
    ];

    const res = await fetch(IZENTBET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY, selections }),
    });

    if (!res.ok) {
      throw new Error(`IzentBet API responded with status ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'IzentBet API returned success:false');
    }

    const { sportybet, sportybet_url, bet9ja } = json.data || {};

    console.log(
      `✅ IzentBet codes — SportyBet: ${sportybet ?? 'n/a'} | Bet9ja: ${bet9ja ?? 'n/a'} — ${signal.home} vs ${signal.away}`
    );

    return {
      sportybet: sportybet || null,
      sportybet_url: sportybet_url || (sportybet ? `https://www.sportybet.com/ng/m/?shareCode=${sportybet}&c=ng#betslip` : null),
      bet9ja: bet9ja || null,
    };
  } catch (err) {
    console.error('[IzentBet] Booking code fetch failed:', err.message);
    return null;
  }
}
