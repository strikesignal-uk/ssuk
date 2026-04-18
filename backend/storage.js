import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

export function saveSignal(match, signal) {
  ensureSignalsFile();
  const arr = readSignals();
  const now = Date.now();
  const thirtyMinsAgo = now - 30 * 60 * 1000;
  const exists = arr.some(s => s.fixtureId === match.fixtureId && new Date(s.created_at).getTime() > thirtyMinsAgo);
  if (exists) return false;
  const obj = {
    id: now.toString(),
    fixtureId: match.fixtureId,
    home: match.home,
    away: match.away,
    league: match.league,
    minute: match.minute,
    score: match.score,
    xG: match.xG,
    dangerAttacks: match.dangerAttacks,
    shots: match.shots,
    pressure: match.pressure,
    xGGap: match.xGGap,
    totalGoals: match.totalGoals,
    betType: signal.betType,
    expectedScore: signal.expectedScore,
    confidence: signal.confidence,
    reason: signal.reason,
    betOdds: signal.betOdds || null,
    aiInsight: signal.aiInsight || '',
    aiEnhanced: signal.aiEnhanced || false,
    created_at: new Date(now).toISOString(),
    result: 'pending'
  };
  arr.push(obj);
  writeSignals(arr);
  return true;
}

export function updateResult(id, result) {
  const arr = readSignals();
  const idx = arr.findIndex(s => s.id === id);
  if (idx === -1) return false;
  arr[idx].result = result;
  writeSignals(arr);
  return true;
}

export function getLast20() {
  const arr = readSignals();
  return arr.slice(-20).reverse();
}

export function getLast30Days() {
  const arr = readSignals();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return arr.filter(s => new Date(s.created_at).getTime() > thirtyDaysAgo).reverse();
}

export function getAllSignals() {
  return readSignals().reverse();
}

export function importSignals(arr) {
  if (!Array.isArray(arr)) return { added: 0 };
  const current = readSignals();
  const existingIds = new Set(current.map(s => s.id));
  const newOnes = arr.filter(s => s.id && !existingIds.has(s.id));
  if (newOnes.length === 0) return { added: 0 };
  const merged = [...current, ...newOnes].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  writeSignals(merged);
  return { added: newOnes.length, total: merged.length };
}

export function getDataDir() {
  return DATA_DIR;
}

export function isUsingVolume() {
  return !!process.env.RAILWAY_VOLUME_MOUNT_PATH || (!!process.env.DATA_DIR && process.env.DATA_DIR !== join(__dirname, 'data'));
}
