export function generateSignal(match) {
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

  return {
    betType,
    expectedScore,
    confidence,
    reason,
    xGGap,
    betOdds
  };
}
