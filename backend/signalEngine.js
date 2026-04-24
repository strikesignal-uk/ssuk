import { getIzentBetCodes } from './izentbet.js';
import { readSportybet, readSportybetLog, writeSportybetLog } from './storage.js';
import { getSettings } from './settings.js';

export async function generateSignal(match) {
  const { minute, xGGap, dangerAttacks, xG, totalGoals, score, odds } = match;
  if (
    minute < 55 || minute > 85 ||
    xGGap < 1.2 ||
    dangerAttacks < 8 ||
    xG.total < 1.5
  ) return null;

  let betType = 'Back Over 1.5 Goals';
  if (totalGoals >= 2) {
    betType = 'Back Over 2.5 Goals';
  } else if (
    score.home === 0 && score.away === 0 &&
    xG.home > 1.0 && xG.away > 1.0
  ) {
    betType = 'Both Teams to Score';
  }

  // Get odds for the selected bet type
  let betOdds = null;
  if (odds) {
    if (betType === 'Back Over 1.5 Goals') betOdds = odds.over15 || null;
    else if (betType === 'Back Over 2.5 Goals') betOdds = odds.over25 || null;
    else if (betType === 'Both Teams to Score') betOdds = odds.btts || null;
  }

  // Only allow opportunities with odds > 1.5 (when odds data is available)
  if (betOdds !== null && betOdds <= 1.5) return null;

  let confidence = 'low';
  if (xGGap >= 2.0 && dangerAttacks >= 12) {
    confidence = 'high';
  } else if (xGGap >= 1.5 || dangerAttacks >= 10) {
    confidence = 'medium';
  }

  const expectedScore = `${Math.round(xG.home)}-${Math.round(xG.away)}`;
  const reason = `xGGap: ${xGGap.toFixed(2)}, Danger Attacks: ${dangerAttacks}, xG: ${xG.total.toFixed(2)}`;

  const signalBase = {
    home: match.home,
    away: match.away,
    league: match.league,
    minute: match.minute,
    score: match.score,
    betType,
    confidence,
    xGGap
  };

  // Fetch SportyBet + Bet9ja booking codes via IzentBet API
  const bookingCodes = await getIzentBetCodes(signalBase);

  // If the admin has enabled "Only show signals with booking codes",
  // suppress this signal when IzentBet couldn't find it on SportyBet/Bet9ja.
  const settings = await getSettings();
  if (settings.filterNoBookingCodes === 'true') {
    const hasCodes = bookingCodes && (bookingCodes.sportybet || bookingCodes.bet9ja);
    if (!hasCodes) {
      console.log(`[SignalEngine] Suppressing signal — no booking codes for ${match.home} vs ${match.away}`);
      return null;
    }
  }

  const finalSignal = {
    betType,
    expectedScore,
    confidence,
    reason,
    xGGap,
    betOdds,
    // Structured booking codes object consumed by storage + frontend
    bookingCodes: bookingCodes || null,
    // Legacy sportybet shape — kept for backwards compat with existing UI paths
    sportybet: bookingCodes
      ? { shareCode: bookingCodes.sportybet, betLink: bookingCodes.sportybet_url, market: betType }
      : null,
  };

  // Run Sportybet bot execution
  executeSportybetBots(match, finalSignal);

  return finalSignal;
}

function executeSportybetBots(match, signal) {
  try {
    const sb = readSportybet();
    if (!sb.connected || !sb.bots || sb.bots.length === 0) return;

    const activeBots = sb.bots.filter(b => b.active);
    for (const bot of activeBots) {
      // Basic criteria matching
      let matchMarket = false;
      if (bot.market === 'Over 1.5' && signal.betType.includes('Over 1.5')) matchMarket = true;
      if (bot.market === 'Over 2.5' && signal.betType.includes('Over 2.5')) matchMarket = true;
      if (bot.market === 'GG' && signal.betType.includes('Both Teams to Score')) matchMarket = true;
      if (bot.market === 'All') matchMarket = true;

      let matchConfidence = false;
      if (bot.minConfidence === 'High only' && signal.confidence === 'high') matchConfidence = true;
      if (bot.minConfidence === 'High+Med' && (signal.confidence === 'high' || signal.confidence === 'medium')) matchConfidence = true;
      if (bot.minConfidence === 'All') matchConfidence = true;

      let matchMinute = false;
      const mFrom = parseInt(bot.minuteFrom) || 0;
      const mTo = parseInt(bot.minuteTo) || 90;
      if (match.minute >= mFrom && match.minute <= mTo) matchMinute = true;

      if (matchMarket && matchConfidence && matchMinute) {
        // Log entry
        const logs = readSportybetLog();
        logs.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          type: "SUCCESS", // Mocking success for now
          match: `${match.home} vs ${match.away}`,
          botName: bot.name,
          market: signal.betType,
          stake: `₦${parseInt(bot.stakePercent) * 1000 || 2000}`, // Mock stake calculation
          odds: signal.betOdds || 1.65,
          betLink: signal.sportybet?.betLink || "https://sportybet.com/",
          status: "Bet placed successfully (Auto-bet mock)",
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        });
        if (logs.length > 200) logs.shift();
        writeSportybetLog(logs);
      }
    }
  } catch (err) {
    console.error('Error executing sportybet bots:', err.message);
  }
}
