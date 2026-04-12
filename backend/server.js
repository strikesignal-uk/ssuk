import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fetchLiveMatches, parseMatch, fetchFixtureById } from './sportmonks.js';
import { generateSignal } from './signalEngine.js';
import { aiEnhanceSignal } from './gemini.js';
import {
  readSignals,
  writeSignals,
  saveSignal,
  updateResult,
  getLast20,
  getLast30Days
} from './storage.js';
import { getSettings, updateSettings } from './settings.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

let liveSignals = [];
let liveMatches = [];

async function poll() {
  const rawMatches = await fetchLiveMatches();
  liveMatches = [];
  liveSignals = [];
  let signalsGenerated = 0;
  for (const raw of rawMatches) {
    const match = parseMatch(raw);
    if (!match) continue;
    liveMatches.push(match);
    let signal = generateSignal(match);
    if (signal) {
      signal = await aiEnhanceSignal(match, signal);
      liveSignals.push({ ...match, ...signal });
      saveSignal(match, signal);
      signalsGenerated++;
    }
  }
  console.log(`[${new Date().toISOString()}] Matches: ${liveMatches.length}, Signals: ${signalsGenerated}`);
}

// Auto-resolve pending signals by checking final scores
async function resolveSignals() {
  const signals = readSignals();
  const pending = signals.filter(s => s.result === 'pending');
  if (pending.length === 0) return;

  let resolved = 0;
  for (const signal of pending) {
    const fixture = await fetchFixtureById(signal.fixtureId);
    if (!fixture) continue; // match not finished yet

    let result = 'loss';
    if (signal.betType === 'Back Over 1.5 Goals' && fixture.totalGoals > 1.5) {
      result = 'win';
    } else if (signal.betType === 'Back Over 2.5 Goals' && fixture.totalGoals > 2.5) {
      result = 'win';
    } else if (signal.betType === 'Both Teams to Score' && fixture.homeGoals > 0 && fixture.awayGoals > 0) {
      result = 'win';
    }

    updateResult(signal.id, result);
    resolved++;
  }
  if (resolved > 0) {
    console.log(`[${new Date().toISOString()}] Auto-resolved ${resolved} signals`);
  }
}

cron.schedule('*/1 * * * *', poll);
cron.schedule('*/5 * * * *', resolveSignals);
poll();
resolveSignals();

app.get('/api/matches/live', (req, res) => {
  res.json(liveMatches);
});

app.get('/api/signals/live', (req, res) => {
  res.json(liveSignals);
});

app.get('/api/signals', (req, res) => {
  res.json(getLast20());
});

app.get('/api/results', (req, res) => {
  const arr = getLast30Days();
  const resolved = arr.filter(s => s.result !== 'pending');
  const stats = {
    wins: resolved.filter(s => s.result === 'win').length,
    losses: resolved.filter(s => s.result === 'loss').length,
    total: arr.length,
    strikeRate: resolved.length ? Math.round(100 * resolved.filter(s => s.result === 'win').length / resolved.length) : 0
  };
  res.json({ results: arr, stats });
});

app.patch('/api/signals/:id/result', (req, res) => {
  const { id } = req.params;
  const { result } = req.body;
  if (!['win', 'loss'].includes(result)) return res.status(400).json({ error: 'Invalid result' });
  const ok = updateResult(id, result);
  res.json({ success: ok });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', signalCount: liveSignals.length, time: new Date().toISOString() });
});

app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  const maskedSportmonks = settings.sportmonksApiKey
    ? '••••••••' + settings.sportmonksApiKey.slice(-4)
    : '';
  const maskedGemini = settings.geminiApiKey
    ? '••••••••' + settings.geminiApiKey.slice(-4)
    : '';
  res.json({ sportmonksApiKey: maskedSportmonks, geminiApiKey: maskedGemini });
});

app.put('/api/settings', (req, res) => {
  const { sportmonksApiKey, geminiApiKey } = req.body;
  const update = {};
  if (typeof sportmonksApiKey === 'string') update.sportmonksApiKey = sportmonksApiKey.trim();
  if (typeof geminiApiKey === 'string') update.geminiApiKey = geminiApiKey.trim();
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }
  updateSettings(update);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`StrikeSignal backend running on port ${PORT}`);
});
