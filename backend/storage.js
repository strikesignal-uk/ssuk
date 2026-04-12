import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SIGNALS_PATH = join(__dirname, 'signals.json');

function ensureSignalsFile() {
  if (!existsSync(SIGNALS_PATH)) {
    writeFileSync(SIGNALS_PATH, '[]', 'utf-8');
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
