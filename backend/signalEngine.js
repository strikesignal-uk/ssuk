import { convertToSportybet, getIzentBetCodes } from './izentbet.js';
import { readSportybet, readSportybetLog, writeSportybetLog } from './storage.js';
import { getSettings } from './settings.js';
import { processSignalForBots } from './automationEngine.js';

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

  console.log(`🎯 Signal fired: ${match.home} vs ${match.away} [${confidence.toUpperCase()}]`);

  // ── Convert fixture to Sportybet code BEFORE saving ────────────────────────
  console.log(`🔄 Converting to Sportybet code...`);
  const conversion = await convertToSportybet(match.home, match.away, betType);

  let sportybetData = null;
  let bookingCodesData = null;

  if (conversion.success) {
    console.log(`✅ Code ready: ${conversion.shareCode}`);
    sportybetData = {
      shareCode: conversion.shareCode,
      betLink: conversion.betLink,
      market: conversion.market,
      totalOdds: conversion.totalOdds,
      convertedAt: new Date().toISOString(),
    };
    bookingCodesData = {
      sportybet: conversion.shareCode,
      sportybet_url: conversion.betLink,
      bet9ja: null,
    };
  } else {
    console.log(`⚠️ No Sportybet link for this signal`);
  }

  // If the admin has enabled "Only show signals with booking codes",
  // suppress this signal when conversion couldn't produce a code.
  const settings = await getSettings();
  if (settings.filterNoBookingCodes === 'true') {
    const hasCodes = sportybetData && sportybetData.shareCode;
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
    // sportybet shape used by frontend LivePage + Opportunities + automation
    sportybet: sportybetData,
  };

  console.log(`💾 Signal saved with Sportybet link`);

  // Fire automation engine asynchronously — do NOT await to avoid blocking the poll cycle
  processSignalForBots({
    ...match,
    ...finalSignal,
    fixtureId: match.fixtureId,
    sportybet: finalSignal.sportybet || null
  }).catch(err => {
    console.error("❌ Automation error:", err.message);
  });

  console.log("🤖 Automation check triggered for:", match.home + " vs " + match.away);

  return finalSignal;
}
