import fetch from 'node-fetch';
import { getSettings } from './settings.js';
const BASE_URL = 'https://api.sportmonks.com/v3/football';

export async function fetchLiveMatches() {
  try {
    const settings = getSettings();
    const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
    if (!apiKey) return [];
    const url = `${BASE_URL}/livescores/inplay?include=scores;participants;statistics;league;state;periods&api_token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    // Filter out finished matches (state_id 5=FT, 3=HT is ok)
    // Sportmonks in-play state_ids: 1=NS, 2=1H, 3=HT, 22=2H, 5=FT
    return data.filter(m => ![5, 6, 7, 8, 9, 10, 11].includes(m.state_id));
  } catch (e) {
    return [];
  }
}

export async function fetchFixtureById(fixtureId) {
  try {
    const settings = getSettings();
    const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
    if (!apiKey) return null;
    const url = `${BASE_URL}/fixtures/${fixtureId}?include=scores;participants;state&api_token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data;
    if (!raw) return null;

    // state_id 5 = FT (Full Time)
    const isFinished = [5, 6, 7, 8, 9, 10, 11].includes(raw.state_id);
    if (!isFinished) return null;

    const home = raw.participants?.find(p => p.meta.location === 'home');
    const away = raw.participants?.find(p => p.meta.location === 'away');
    if (!home || !away) return null;

    const homeScoreObj = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === home.id);
    const awayScoreObj = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === away.id);
    const homeGoals = Number(homeScoreObj?.score?.goals ?? 0);
    const awayGoals = Number(awayScoreObj?.score?.goals ?? 0);

    return { homeGoals, awayGoals, totalGoals: homeGoals + awayGoals };
  } catch {
    return null;
  }
}

// Sportmonks stat type_id mapping
const STAT_IDS = {
  DANGEROUS_ATTACKS: 44,
  SHOTS_TOTAL: 42,
  SHOTS_ON_TARGET: 86,
  BALL_POSSESSION: 45,
  ATTACKS: 43,
  CORNERS: 34,
  SHOTS_INSIDEBOX: 49,
};

export function parseMatch(raw) {
  try {
    const home = raw.participants.find(p => p.meta.location === 'home');
    const away = raw.participants.find(p => p.meta.location === 'away');
    if (!home || !away) return null;

    // Scores: find CURRENT entries per participant
    const homeScoreObj = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === home.id);
    const awayScoreObj = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === away.id);
    const homeGoals = Number(homeScoreObj?.score?.goals ?? 0);
    const awayGoals = Number(awayScoreObj?.score?.goals ?? 0);

    // Statistics: keyed by participant_id → type_id → value
    const stats = {};
    for (const stat of (raw.statistics || [])) {
      const pid = stat.participant_id;
      if (!stats[pid]) stats[pid] = {};
      stats[pid][stat.type_id] = Number(stat.data?.value ?? 0);
    }
    const getStat = (typeId, pid) => Number(stats[pid]?.[typeId] ?? 0);

    const dangerAttacksHome = getStat(STAT_IDS.DANGEROUS_ATTACKS, home.id);
    const dangerAttacksAway = getStat(STAT_IDS.DANGEROUS_ATTACKS, away.id);
    const dangerAttacks = dangerAttacksHome + dangerAttacksAway;

    const shotsHome = getStat(STAT_IDS.SHOTS_TOTAL, home.id);
    const shotsAway = getStat(STAT_IDS.SHOTS_TOTAL, away.id);
    const shots = shotsHome + shotsAway;

    const onTargetHome = getStat(STAT_IDS.SHOTS_ON_TARGET, home.id);
    const onTargetAway = getStat(STAT_IDS.SHOTS_ON_TARGET, away.id);

    const possessionHome = getStat(STAT_IDS.BALL_POSSESSION, home.id);
    const possessionAway = getStat(STAT_IDS.BALL_POSSESSION, away.id);
    const pressure = possessionHome + possessionAway;

    // Minute: find the active (ticking) period, or fallback to last period's minutes
    const periods = (raw.periods || []).sort((a, b) => a.sort_order - b.sort_order);
    const activePeriod = periods.find(p => p.ticking);
    const lastPeriod = periods[periods.length - 1];
    const minute = activePeriod
      ? Number(activePeriod.minutes || 0)
      : lastPeriod ? Number(lastPeriod.minutes || 0) : 0;

    // Estimate xG from available stats: shots on target * 0.33 + (dangerous attacks * 0.015)
    const xGHome = Number((onTargetHome * 0.33 + dangerAttacksHome * 0.015).toFixed(2));
    const xGAway = Number((onTargetAway * 0.33 + dangerAttacksAway * 0.015).toFixed(2));
    const xG = { home: xGHome, away: xGAway, total: Number((xGHome + xGAway).toFixed(2)) };

    const totalGoals = homeGoals + awayGoals;

    return {
      fixtureId: raw.id,
      home: home.name,
      away: away.name,
      homeId: home.id,
      awayId: away.id,
      league: raw.league?.name || '',
      minute,
      state: raw.state?.short_name || '',
      score: { home: homeGoals, away: awayGoals },
      xG,
      dangerAttacks,
      shots,
      pressure,
      xGGap: Number((xG.total - totalGoals).toFixed(2)),
      totalGoals
    };
  } catch (e) {
    return null;
  }
}
