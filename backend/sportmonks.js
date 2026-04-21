import fetch from 'node-fetch';
import { getSettings } from './settings.js';
const BASE_URL = 'https://api.sportmonks.com/v3/football';

// Fetch in-play odds from dedicated endpoint and return a map: fixtureId → { over15, over25, btts }
export async function fetchInPlayOdds() {
  try {
    const settings = getSettings();
    const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
    if (!apiKey) return {};
    const url = `${BASE_URL}/odds/inplay?api_token=${apiKey}&per_page=200`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[${new Date().toISOString()}] fetchInPlayOdds: API error ${res.status} — ${text.slice(0, 200)}`);
      return {};
    }
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    const oddsMap = {};
    for (const odd of data) {
      const fixtureId = odd.fixture_id;
      if (!fixtureId) continue;
      if (!oddsMap[fixtureId]) oddsMap[fixtureId] = {};
      const label = (odd.label || '').toLowerCase();
      const total = odd.total != null ? String(odd.total) : '';
      const value = parseFloat(odd.value);
      if (isNaN(value)) continue;
      if (label === 'over' && total === '1.5') {
        if (!oddsMap[fixtureId].over15 || value > oddsMap[fixtureId].over15) oddsMap[fixtureId].over15 = value;
      }
      if (label === 'over' && total === '2.5') {
        if (!oddsMap[fixtureId].over25 || value > oddsMap[fixtureId].over25) oddsMap[fixtureId].over25 = value;
      }
      if (label === 'yes') {
        if (!oddsMap[fixtureId].btts || value > oddsMap[fixtureId].btts) oddsMap[fixtureId].btts = value;
      }
    }
    console.log(`[${new Date().toISOString()}] fetchInPlayOdds: odds for ${Object.keys(oddsMap).length} fixtures`);
    return oddsMap;
  } catch (e) {
    console.error(`[${new Date().toISOString()}] fetchInPlayOdds: Exception — ${e.message}`);
    return {};
  }
}

export async function fetchLiveMatches() {
  try {
    const settings = getSettings();
    const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
    if (!apiKey) {
      console.warn(`[${new Date().toISOString()}] fetchLiveMatches: No API key configured. Set sportmonksApiKey in Admin → Settings.`);
      return [];
    }
    const url = `${BASE_URL}/livescores/inplay?include=scores;participants;statistics;league;state&api_token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[${new Date().toISOString()}] fetchLiveMatches: API error ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
      return [];
    }
    const json = await res.json();
    if (json.message) {
      console.error(`[${new Date().toISOString()}] fetchLiveMatches: API message — ${json.message}`);
    }
    const data = Array.isArray(json.data) ? json.data : [];
    console.log(`[${new Date().toISOString()}] fetchLiveMatches: ${data.length} raw inplay matches from API`);
    // Filter out finished matches (state_id 5=FT, 3=HT is ok)
    // Sportmonks in-play state_ids: 1=NS, 2=1H, 3=HT, 22=2H, 5=FT
    return data.filter(m => ![5, 6, 7, 8, 9, 10, 11].includes(m.state_id));
  } catch (e) {
    console.error(`[${new Date().toISOString()}] fetchLiveMatches: Exception — ${e.message}`);
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

export async function fetchTodayFixtures() {
  try {
    const settings = getSettings();
    const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
    if (!apiKey) return [];
    const today = new Date().toISOString().slice(0, 10);
    const url = `${BASE_URL}/fixtures/date/${today}?include=scores;participants;league;state&api_token=${apiKey}&per_page=100`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    return data.map(raw => {
      const home = raw.participants?.find(p => p.meta?.location === 'home');
      const away = raw.participants?.find(p => p.meta?.location === 'away');
      const homeScore = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === home?.id);
      const awayScore = (raw.scores || []).find(s => s.description === 'CURRENT' && s.participant_id === away?.id);
      return {
        fixtureId: raw.id,
        home: home?.name || 'TBD',
        away: away?.name || 'TBD',
        homeLogo: home?.image_path || '',
        awayLogo: away?.image_path || '',
        league: raw.league?.name || '',
        leagueLogo: raw.league?.image_path || '',
        startingAt: raw.starting_at,
        state: raw.state?.short_name || 'NS',
        stateName: raw.state?.name || 'Not Started',
        stateId: raw.state_id,
        score: {
          home: Number(homeScore?.score?.goals ?? 0),
          away: Number(awayScore?.score?.goals ?? 0),
        },
      };
    }).sort((a, b) => new Date(a.startingAt) - new Date(b.startingAt));
  } catch (e) {
    return [];
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

    // Estimate minute from starting_at_timestamp and match state
    const stateId = raw.state_id;
    const startTs = raw.starting_at_timestamp;
    let minute = 0;
    if (startTs) {
      const elapsed = (Date.now() / 1000 - startTs) / 60;
      if (stateId === 2) { // 1st Half
        minute = Math.min(Math.round(elapsed), 45);
      } else if (stateId === 3) { // HT
        minute = 45;
      } else if (stateId === 22) { // 2nd Half (subtract ~15 min for HT break)
        minute = Math.min(Math.round(elapsed - 15), 93);
      }
    }

    // Estimate xG from available stats: shots on target * 0.33 + (dangerous attacks * 0.015)
    const xGHome = Number((onTargetHome * 0.33 + dangerAttacksHome * 0.015).toFixed(2));
    const xGAway = Number((onTargetAway * 0.33 + dangerAttacksAway * 0.015).toFixed(2));
    const xG = { home: xGHome, away: xGAway, total: Number((xGHome + xGAway).toFixed(2)) };

    const totalGoals = homeGoals + awayGoals;

    // Parse odds for Over 1.5, Over 2.5, and BTTS markets
    const odds = {};
    for (const odd of (raw.odds || [])) {
      const label = (odd.label || '').toLowerCase();
      const total = odd.total != null ? String(odd.total) : '';
      const value = parseFloat(odd.value);
      if (isNaN(value)) continue;

      // Over 1.5 Goals
      if (label === 'over' && total === '1.5') {
        if (!odds.over15 || value > odds.over15) odds.over15 = value;
      }
      // Over 2.5 Goals
      if (label === 'over' && total === '2.5') {
        if (!odds.over25 || value > odds.over25) odds.over25 = value;
      }
      // Both Teams to Score
      if (label === 'yes') {
        if (!odds.btts || value > odds.btts) odds.btts = value;
      }
    }

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
      totalGoals,
      odds
    };
  } catch (e) {
    return null;
  }
}
