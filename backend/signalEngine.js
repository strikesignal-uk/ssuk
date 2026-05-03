import { convertTo$market, getIzentBetCodes } from './izentbet.js';
import { read$market, read$marketLog, write$marketLog } from './storage.js';
import { getSettings } from './settings.js';
import { processSignalForBots } from './automationEngine.js';
import { broadcastSignalAlert } from './broadcaster.js';

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

  // Eradicate low confidence signals as requested
  if (confidence === 'low') {
    console.log(`[SignalEngine] Discarding LOW confidence signal for ${match.home} vs ${match.away}`);
    return null;
  }

  const expectedScore = `${Math.round(xG.home)}-${Math.round(xG.away)}`;
  const reason = `xGGap: ${xGGap.toFixed(2)}, Danger Attacks: ${dangerAttacks}, xG: ${xG.total.toFixed(2)}`;

  console.log(`\n🎯 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎯 New signal: ${match.home} vs ${match.away}`);
  console.log(`🎯 Bet type: ${betType} | Confidence: ${confidence.toUpperCase()}`);
  console.log(`🎯 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // ── Convert fixture to $market code BEFORE saving ────────────────────────
  console.log(`🔄 Starting conversion for: ${match.home} vs ${match.away}...`);
  const conversionStart = Date.now();
  const conversion = await convertTo$market(match.home, match.away, betType);
  const conversionTime = ((Date.now() - conversionStart) / 1000).toFixed(1);
  console.log(`⏱️ Conversion took ${conversionTime}s`);

  let $marketData = null;
  let bookingCodesData = null;

  if (conversion.success) {
    console.log(`✅ Conversion complete: ${conversion.shareCode}`);
    console.log(`✅ Bet link: ${conversion.betLink}`);
    $marketData = {
      shareCode: conversion.shareCode,
      betLink: conversion.betLink,
      market: conversion.market,
      totalOdds: conversion.totalOdds,
      convertedAt: new Date().toISOString(),
    };
    bookingCodesData = {
      $market: conversion.shareCode,
      $market_url: conversion.betLink,
      $market: null,
    };
  } else {
    console.log(`⚠️ Conversion failed: ${conversion.error}`);
    console.log(`⚠️ Saving signal WITHOUT $market link`);
  }

  // If the admin has enabled "Only show signals with booking codes",
  // suppress this signal when conversion couldn't produce a code.
  const settings = await getSettings();
  if (settings.filterNoBookingCodes === 'true') {
    const hasCodes = $marketData && $marketData.shareCode;
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
    bookingCodes: bookingCodesData || null,
    // $market shape used by frontend LivePage + Opportunities + automation
    $market: $marketData,
  };

  console.log(`💾 Signal saved — $market: ${$marketData ? $marketData.shareCode : 'null'}`);
  console.log(`💾 Signal object $market field: ${JSON.stringify(finalSignal.$market)}`);

  // Fire automation engine asynchronously — do NOT await to avoid blocking the poll cycle
  processSignalForBots({
    ...match,
    ...finalSignal,
    fixtureId: match.fixtureId,
    $market: finalSignal.$market || null
  }).catch(err => {
    console.error("❌ Automation error:", err.message);
  });

  console.log("🤖 Automation check triggered for:", match.home + " vs " + match.away);

  // Fire Telegram broadcast asynchronously — never blocks
  broadcastSignalAlert({
    ...match,
    ...finalSignal,
  }).catch(err => {
    console.error("❌ Broadcast error:", err.message);
  });

  console.log("📣 Telegram broadcast triggered for:", match.home + " vs " + match.away);

  return finalSignal;
}
