import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { isUsingDB, query } from './db.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Seed dir is always bundled with the app (committed in git)
const SEED_DIR = join(__dirname, 'seed');
// Runtime data dir — use RAILWAY_VOLUME_MOUNT_PATH or DATA_DIR env var for persistent storage
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(__dirname, 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const SIGNALS_PATH = join(DATA_DIR, 'signals.json');
const SEED_SIGNALS_PATH = join(SEED_DIR, 'signals.json');

function loadJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function ensureSignalsFile() {
  const runtime = existsSync(SIGNALS_PATH) ? loadJSON(SIGNALS_PATH) : null;
  const seed = existsSync(SEED_SIGNALS_PATH) ? loadJSON(SEED_SIGNALS_PATH) : null;

  if (!runtime || !Array.isArray(runtime)) {
    // No runtime data — restore from seed or start empty
    const data = (seed && Array.isArray(seed)) ? seed : [];
    writeFileSync(SIGNALS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    if (data.length > 0) {
      console.log(`[Storage] Restored ${data.length} signals from seed data`);
    }
    return;
  }

  // Runtime exists — merge any missing seed signals into runtime
  if (seed && Array.isArray(seed) && seed.length > 0) {
    const runtimeIds = new Set(runtime.map(s => s.id));
    const missing = seed.filter(s => !runtimeIds.has(s.id));
    if (missing.length > 0) {
      const merged = [...missing, ...runtime].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      writeFileSync(SIGNALS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
      console.log(`[Storage] Merged ${missing.length} missing signals from seed data (total: ${merged.length})`);
    }
  }
}

export function readSignals() {
  ensureSignalsFile();
  const data = readFileSync(SIGNALS_PATH, 'utf-8');
  return JSON.parse(data);
}

export function writeSignals(arr) {
  writeFileSync(SIGNALS_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}

export async function saveSignal(match, signal) {
  const now = Date.now();
  const thirtyMinsAgo = new Date(now - 30 * 60 * 1000).toISOString();

  if (isUsingDB()) {
    const { rows } = await query(
      `SELECT id FROM signals WHERE fixture_id = $1 AND created_at > $2 LIMIT 1`,
      [match.fixtureId, thirtyMinsAgo]
    );
    if (rows.length > 0) return false;
    await query(
      `INSERT INTO signals
        (id, fixture_id, home, away, league, minute, score, xg, danger_attacks, shots,
         pressure, xg_gap, total_goals, bet_type, expected_score, confidence, reason,
         bet_odds, ai_insight, ai_enhanced, result, created_at, $market_share_code, $market_bet_link, $market_market, $market_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
      [
        now.toString(), match.fixtureId, match.home, match.away, match.league,
        match.minute, match.score, JSON.stringify(match.xG), JSON.stringify(match.dangerAttacks),
        JSON.stringify(match.shots), match.pressure, match.xGGap, match.totalGoals,
        signal.betType, signal.expectedScore, signal.confidence, signal.reason,
        signal.betOdds || null, signal.aiInsight || '', signal.aiEnhanced || false,
        'pending', new Date(now).toISOString(),
        signal.$market?.shareCode || null, signal.$market?.betLink || null, signal.$market?.market || null,
        signal.bookingCodes?.$market || null
      ]
    );
    return true;
  }

  ensureSignalsFile();
  const arr = readSignals();
  const exists = arr.some(s => s.fixtureId === match.fixtureId && new Date(s.created_at).getTime() > now - 30 * 60 * 1000);
  if (exists) return false;
  const obj = {
    id: now.toString(), fixtureId: match.fixtureId, home: match.home, away: match.away,
    league: match.league, minute: match.minute, score: match.score, xG: match.xG,
    dangerAttacks: match.dangerAttacks, shots: match.shots, pressure: match.pressure,
    xGGap: match.xGGap, totalGoals: match.totalGoals, betType: signal.betType,
    expectedScore: signal.expectedScore, confidence: signal.confidence, reason: signal.reason,
    betOdds: signal.betOdds || null, aiInsight: signal.aiInsight || '',
    aiEnhanced: signal.aiEnhanced || false, created_at: new Date(now).toISOString(), result: 'pending',
    $market_share_code: signal.$market?.shareCode || null,
    $market_bet_link: signal.$market?.betLink || null,
    $market_market: signal.$market?.market || null,
    $market_code: signal.bookingCodes?.$market || null
  };
  arr.push(obj);
  writeSignals(arr);
  return true;
}

export async function updateResult(id, result) {
  if (isUsingDB()) {
    const { rowCount } = await query('UPDATE signals SET result = $1 WHERE id = $2', [result, id]);
    return rowCount > 0;
  }
  const arr = readSignals();
  const idx = arr.findIndex(s => s.id === id);
  if (idx === -1) return false;
  arr[idx].result = result;
  writeSignals(arr);
  return true;
}

function dbRowToSignal(row) {
  return {
    id: row.id, fixtureId: row.fixture_id, home: row.home, away: row.away, league: row.league,
    minute: row.minute, score: row.score, xG: row.xg, dangerAttacks: row.danger_attacks,
    shots: row.shots, pressure: row.pressure, xGGap: row.xg_gap, totalGoals: row.total_goals,
    betType: row.bet_type, expectedScore: row.expected_score, confidence: row.confidence,
    reason: row.reason, betOdds: row.bet_odds, aiInsight: row.ai_insight,
    aiEnhanced: row.ai_enhanced, result: row.result, created_at: row.created_at,
    $market_share_code: row.$market_share_code, $market_bet_link: row.$market_bet_link,
    $market_market: row.$market_market,
    $market_code: row.$market_code || null
  };
}

export async function getLast20() {
  if (isUsingDB()) {
    const { rows } = await query('SELECT * FROM signals ORDER BY created_at DESC LIMIT 20');
    return rows.map(dbRowToSignal);
  }
  const arr = readSignals();
  return arr.slice(-20).reverse();
}

export async function getLast30Days() {
  if (isUsingDB()) {
    const { rows } = await query(
      `SELECT * FROM signals WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC`
    );
    return rows.map(dbRowToSignal);
  }
  const arr = readSignals();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return arr.filter(s => new Date(s.created_at).getTime() > thirtyDaysAgo).reverse();
}

export async function getAllSignals() {
  if (isUsingDB()) {
    const { rows } = await query('SELECT * FROM signals ORDER BY created_at DESC');
    return rows.map(dbRowToSignal);
  }
  return readSignals().reverse();
}

export async function importSignals(arr) {
  if (!Array.isArray(arr)) return { added: 0 };
  if (isUsingDB()) {
    let added = 0;
    for (const s of arr) {
      if (!s.id) continue;
      try {
        await query(
          `INSERT INTO signals
            (id, fixture_id, home, away, league, minute, score, xg, danger_attacks, shots,
             pressure, xg_gap, total_goals, bet_type, expected_score, confidence, reason,
             bet_odds, ai_insight, ai_enhanced, result, created_at, $market_share_code, $market_bet_link, $market_market, $market_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id, s.fixtureId, s.home, s.away, s.league, s.minute, s.score,
            JSON.stringify(s.xG), JSON.stringify(s.dangerAttacks), JSON.stringify(s.shots),
            s.pressure, s.xGGap, s.totalGoals, s.betType, s.expectedScore, s.confidence,
            s.reason, s.betOdds || null, s.aiInsight || '', s.aiEnhanced || false,
            s.result || 'pending', s.created_at || new Date().toISOString(),
            s.$market_share_code || null, s.$market_bet_link || null, s.$market_market || null,
            s.$market_code || null
          ]
        );
        added++;
      } catch { /* skip duplicates */ }
    }
    return { added, total: added };
  }
  const current = readSignals();
  const existingIds = new Set(current.map(s => s.id));
  const newOnes = arr.filter(s => s.id && !existingIds.has(s.id));
  if (newOnes.length === 0) return { added: 0 };
  const merged = [...current, ...newOnes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  writeSignals(merged);
  return { added: newOnes.length, total: merged.length };
}

export function getDataDir() {
  return DATA_DIR;
}

export function isUsingVolume() {
  return !!process.env.RAILWAY_VOLUME_MOUNT_PATH || (!!process.env.DATA_DIR && process.env.DATA_DIR !== join(__dirname, 'data'));
}

// ── $market Integration Storage ───────────────────────────────────────────

export function get$marketStorePath(userId) {
  if (!userId) userId = 'global';
  return join(DATA_DIR, `$market-${userId}.json`);
}

export function get$marketLogPath(userId) {
  if (!userId) userId = 'global';
  return join(DATA_DIR, `$market-log-${userId}.json`);
}

export function read$market(userId) {
  try { return JSON.parse(readFileSync(get$marketStorePath(userId), 'utf-8')); } catch { return { connected: false, phone: '', password: '', bots: [] }; }
}
export function write$market(userId, data) { writeFileSync(get$marketStorePath(userId), JSON.stringify(data, null, 2), 'utf-8'); }

export function read$marketLog(userId) {
  try { return JSON.parse(readFileSync(get$marketLogPath(userId), 'utf-8')); } catch { return []; }
}
export function write$marketLog(userId, data) { writeFileSync(get$marketLogPath(userId), JSON.stringify(data, null, 2), 'utf-8'); }

export function getAll$marketConfigs() {
  const configs = [];
  try {
    const files = readdirSync(DATA_DIR);
    for (const f of files) {
      if (f.startsWith('$market-') && f.endsWith('.json') && !f.startsWith('$market-log-')) {
        const userId = f.replace('$market-', '').replace('.json', '');
        const data = read$market(userId);
        configs.push({ userId, data });
      }
    }
  } catch {}
  return configs;
}

// ── Blog Storage ────────────────────────────────────────────────────────────
const BLOG_STORE = join(DATA_DIR, 'blog.json');

export async function getBlogPosts() {
  if (isUsingDB()) {
    const { rows } = await query('SELECT * FROM blog_posts ORDER BY created_at DESC');
    return rows;
  }
  try {
    return JSON.parse(readFileSync(BLOG_STORE, 'utf-8')).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch {
    return [];
  }
}

export async function saveBlogPost(post) {
  const now = new Date().toISOString();
  if (isUsingDB()) {
    await query(
      `INSERT INTO blog_posts (id, title, content, image, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, image = EXCLUDED.image`,
      [post.id, post.title, post.content, post.image || null, post.created_at || now]
    );
    return;
  }
  let posts = [];
  try { posts = JSON.parse(readFileSync(BLOG_STORE, 'utf-8')); } catch {}
  const idx = posts.findIndex(p => p.id === post.id);
  if (idx > -1) {
    posts[idx] = { ...posts[idx], ...post };
  } else {
    posts.push({ ...post, created_at: post.created_at || now });
  }
  writeFileSync(BLOG_STORE, JSON.stringify(posts, null, 2), 'utf-8');
}

export async function deleteBlogPost(id) {
  if (isUsingDB()) {
    await query('DELETE FROM blog_posts WHERE id = $1', [id]);
    return;
  }
  let posts = [];
  try { posts = JSON.parse(readFileSync(BLOG_STORE, 'utf-8')); } catch {}
  posts = posts.filter(p => p.id !== id);
  writeFileSync(BLOG_STORE, JSON.stringify(posts, null, 2), 'utf-8');
}
