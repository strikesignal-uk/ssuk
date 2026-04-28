import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fetchLiveMatches, parseMatch, fetchFixtureById, fetchTodayFixtures, fetchInPlayOdds } from './sportmonks.js';
import { generateSignal } from './signalEngine.js';
import { convertToSportybet } from './izentbet.js';
import { aiEnhanceSignal } from './gemini.js';
import {
  readSignals,
  writeSignals,
  saveSignal,
  updateResult,
  getLast20,
  getLast30Days,
  getAllSignals,
  importSignals,
  isUsingVolume,
  getDataDir,
  readSportybet,
  writeSportybet,
  readSportybetLog,
  writeSportybetLog,
  getAllSportybetConfigs
} from './storage.js';
import { getSettings, updateSettings } from './settings.js';
import { loginSportybet, fetchBalance } from "./sportybetScraper.js";
import { createUser, loginUser, verifyToken, getAllUsers, updateNotifications, getNotifiableUsers, getUserById, updateProfile, createPasswordResetToken, resetPassword, adminUpdateUser, adminSetUserStatus, adminDeleteUser } from './users.js';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { sendSignalNotification, sendWelcomeEmail, sendTestEmail, sendPasswordResetEmail, sendBroadcastEmail } from './email.js';
import { sendTelegramBroadcast } from './telegram.js';
import { askAdminAssistant } from './chat.js';
import { processSignalForBots, testAutomation } from './automationEngine.js';
import { initDB } from './db.js';
import { initiatePayment, verifyPayment, handleWebhook, getUserSubscription, manualVerifyByTxRef } from './subscription.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Initialise DB (no-op if DATABASE_URL not set)
await initDB();

let liveSignals = [];
let liveMatches = [];

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = verifyToken(header.slice(7));
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.user = decoded;
  next();
}

async function poll() {
  const [rawMatches, oddsMap] = await Promise.all([fetchLiveMatches(), fetchInPlayOdds()]);
  liveMatches = [];
  liveSignals = [];
  let signalsGenerated = 0;
  const newSignals = [];
  for (const raw of rawMatches) {
    const match = parseMatch(raw);
    if (!match) continue;
    // Merge in-play odds fetched from dedicated endpoint
    if (oddsMap[match.fixtureId]) {
      match.odds = { ...match.odds, ...oddsMap[match.fixtureId] };
    }
    liveMatches.push(match);
    let signal = await generateSignal(match);
    if (signal) {
      signal = await aiEnhanceSignal(match, signal);
      liveSignals.push({ ...match, ...signal });
      const saved = await saveSignal(match, signal);
      if (saved) newSignals.push({ ...match, ...signal });
      signalsGenerated++;
    }
  }
  // Send email notifications for new signals
  if (newSignals.length > 0) {
    const users = await getNotifiableUsers();
    console.log(`[${new Date().toISOString()}] ${newSignals.length} new signal(s), ${users.length} notifiable user(s)`);
    if (users.length > 0) {
      for (const sig of newSignals) {
        sendSignalNotification(users, sig).catch(err => console.error('Email error:', err.message));
      }
    } else {
      console.log(`[${new Date().toISOString()}] No users with notifications enabled, skipping email`);
    }
    // 🤖 Trigger automation bots for each new signal
    for (const sig of newSignals) {
      processSignalForBots(sig).catch(err => console.error('[Automation] Error:', err.message));
    }
  }
  console.log(`[${new Date().toISOString()}] Matches: ${liveMatches.length}, Signals: ${signalsGenerated}`);
}

// Auto-resolve pending signals by checking final scores
async function resolveSignals() {
  const signals = await getAllSignals();
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

    await updateResult(signal.id, result);
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

app.get('/api/matches/today', async (req, res) => {
  try {
    const fixtures = await fetchTodayFixtures();
    res.json(fixtures);
  } catch {
    res.json([]);
  }
});

app.get('/api/signals/live', async (req, res) => {
  const userId = req.query.userId;
  let isPro = false;

  if (userId) {
    const sub = await getUserSubscription(userId);
    isPro = sub.plan === "pro" && sub.active;
  }

  // Ensure every signal has a sportybet field (null if missing)
  const enriched = liveSignals.map(s => {
    let signal = {
      ...s,
      sportybet: s.sportybet || null,
    };

    if (signal.confidence === 'high' && !isPro) {
      signal = {
        ...signal,
        locked: true,
        betType: "🔒 Upgrade to Pro",
        betLink: null,
        lockReason: "High confidence signals are Pro only"
      };
    }
    
    return signal;
  });
  res.json(enriched);
});

app.get('/api/signals', async (req, res) => {
  res.json(await getLast20());
});

app.get('/api/results', async (req, res) => {
  const period = req.query.period || 'daily';
  const now = new Date();
  let cutoff;

  if (period === 'daily') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  } else if (period === 'weekly') {
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    cutoff = monday.getTime();
  } else {
    // monthly
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  const all = await getAllSignals();
  const arr = all.filter(s => new Date(s.created_at).getTime() >= cutoff);
  const resolved = arr.filter(s => s.result !== 'pending');
  const stats = {
    wins: resolved.filter(s => s.result === 'win').length,
    losses: resolved.filter(s => s.result === 'loss').length,
    total: arr.length,
    pending: arr.filter(s => s.result === 'pending').length,
    strikeRate: resolved.length ? Math.round(100 * resolved.filter(s => s.result === 'win').length / resolved.length) : 0
  };
  res.json({ results: arr, stats, period });
});

app.patch('/api/signals/:id/result', async (req, res) => {
  const { id } = req.params;
  const { result } = req.body;
  if (!['win', 'loss'].includes(result)) return res.status(400).json({ error: 'Invalid result' });
  const ok = await updateResult(id, result);
  res.json({ success: ok });
});

app.get('/api/signals/:id/betlink', async (req, res) => {
  const allSignals = await getAllSignals();
  const signal = allSignals.find(s => s.id === req.params.id);
  
  if (!signal) {
    return res.status(404).json({ error: 'Signal not found' });
  }

  if (!signal.sportybet_bet_link) {
    return res.status(404).json({ error: 'No bet link available for this signal' });
  }

  res.json({
    betLink: signal.sportybet_bet_link,
    shareCode: signal.sportybet_share_code,
    market: signal.sportybet_market,
    bet9jaCode: signal.bet9ja_code || null
  });
});

// Manually trigger Sportybet code conversion for a specific signal
app.post('/api/signals/:id/convert', async (req, res) => {
  try {
    const allSignals = await getAllSignals();
    const signal = allSignals.find(s => s.id === req.params.id);
    if (!signal) return res.status(404).json({ error: 'Signal not found' });

    const home = signal.home;
    const away = signal.away;
    const betType = signal.betType || 'Back Over 1.5 Goals';

    console.log(`🔄 Manual convert request: ${home} vs ${away}`);
    const conversion = await convertToSportybet(home, away, betType);

    if (conversion.success) {
      signal.sportybet = {
        shareCode: conversion.shareCode,
        betLink: conversion.betLink,
        market: conversion.market,
        totalOdds: conversion.totalOdds,
        convertedAt: new Date().toISOString(),
      };
      signal.bookingCodes = {
        ...(signal.bookingCodes || {}),
        sportybet: conversion.shareCode,
        sportybet_url: conversion.betLink,
      };
      // Persist the updated signal
      const all = await getAllSignals();
      const idx = all.findIndex(s => s.id === req.params.id);
      if (idx >= 0) {
        all[idx] = signal;
        await writeSignals(all);
      }
      // Also update the in-memory live signals if present
      const liveIdx = liveSignals.findIndex(s => s.id === req.params.id || s.fixtureId === signal.fixtureId);
      if (liveIdx >= 0) {
        liveSignals[liveIdx].sportybet = signal.sportybet;
        liveSignals[liveIdx].bookingCodes = signal.bookingCodes;
      }
      return res.json({ success: true, signal });
    }

    res.json({ success: false, error: conversion.error, signal });
  } catch (err) {
    console.error('[Convert] Error:', err.message);
    res.status(500).json({ error: 'Conversion failed: ' + err.message });
  }
});

app.get('/health', async (req, res) => {
  const allSignals = await getAllSignals();
  res.json({
    status: 'ok',
    signalCount: liveSignals.length,
    totalHistoric: allSignals.length,
    persistentStorage: isUsingVolume(),
    dataDir: getDataDir(),
    time: new Date().toISOString()
  });
});

// Export all signals data (for backup before deploys)
app.get('/api/signals/export', async (req, res) => {
  const all = await getAllSignals();
  res.setHeader('Content-Disposition', `attachment; filename=signals-backup-${new Date().toISOString().slice(0,10)}.json`);
  res.json(all);
});

// Import signals data (merge, never overwrite)
app.post('/api/signals/import', async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Expected an array of signals' });
  const result = await importSignals(data);
  res.json({ success: true, ...result });
});

app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  const mask = (val) => val ? '••••••••' + val.slice(-4) : '';
  res.json({
    sportmonksApiKey: mask(settings.sportmonksApiKey),
    geminiApiKey: mask(settings.geminiApiKey),
    resendApiKey: mask(settings.resendApiKey),
    emailFrom: settings.emailFrom || '',
    telegramBotToken: mask(settings.telegramBotToken),
    telegramChatId: settings.telegramChatId || '',
    filterNoBookingCodes: settings.filterNoBookingCodes === 'true'
  });
});

app.put('/api/settings', async (req, res) => {
  const { sportmonksApiKey, geminiApiKey, resendApiKey, emailFrom, telegramBotToken, telegramChatId, filterNoBookingCodes } = req.body;
  const update = {};
  if (typeof sportmonksApiKey === 'string') update.sportmonksApiKey = sportmonksApiKey.trim();
  if (typeof geminiApiKey === 'string') update.geminiApiKey = geminiApiKey.trim();
  if (typeof resendApiKey === 'string') update.resendApiKey = resendApiKey.trim();
  if (typeof emailFrom === 'string') update.emailFrom = emailFrom.trim();
  if (typeof telegramBotToken === 'string') update.telegramBotToken = telegramBotToken.trim();
  if (typeof telegramChatId === 'string') update.telegramChatId = telegramChatId.trim();
  if (typeof filterNoBookingCodes === 'boolean') update.filterNoBookingCodes = String(filterNoBookingCodes);
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }
  await updateSettings(update);
  res.json({ success: true });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const result = await createUser(name, email, password);
  if (result.error) return res.status(400).json({ error: result.error });
  sendWelcomeEmail(email, name).catch(err => console.error('Welcome email error:', err.message));
  res.json(result);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const result = await loginUser(email, password);
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Get full profile
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update profile (name, email, password)
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  const updates = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof email === 'string' && email.trim()) updates.email = email.trim().toLowerCase();
  if (typeof password === 'string' && password.length >= 6) updates.password = password;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });
  const result = await updateProfile(req.user.id, updates);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.user);
});

app.put('/api/auth/notifications', authMiddleware, async (req, res) => {
  const { enabled } = req.body;
  await updateNotifications(req.user.id, !!enabled);
  res.json({ success: true });
});

// Forgot password — always responds with success to prevent email enumeration
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const result = await createPasswordResetToken(email.toLowerCase().trim());
    if (!result.error) {
      sendPasswordResetEmail(email.toLowerCase().trim(), result.name, result.token)
        .catch(err => console.error('Password reset email error:', err.message));
    }
  } catch (err) {
    console.error('Forgot password error:', err.message);
  }
  // Always succeed — don't reveal whether the email exists
  res.json({ success: true });
});

// Reset password using token from email link
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const result = await resetPassword(token, password);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ success: true });
});

app.post('/api/settings/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  const result = await sendTestEmail(email);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ success: true, emailId: result.emailId });
});

app.get('/api/admin/users', async (req, res) => {
  res.json(await getAllUsers());
});

app.get('/api/admin/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/admin/users/:id', async (req, res) => {
  const { name, email } = req.body;
  const result = await adminUpdateUser(req.params.id, { name, email });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.user);
});

app.patch('/api/admin/users/:id/status', async (req, res) => {
  const { status } = req.body;
  const result = await adminSetUserStatus(req.params.id, status);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const result = await adminDeleteUser(req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ success: true });
});

app.post('/api/admin/assistant', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  const generatedText = await askAdminAssistant(prompt);
  res.json({ result: generatedText });
});

app.post('/api/admin/broadcast', async (req, res) => {
  const { subject, message, channels } = req.body;
  if (!message || !channels) return res.status(400).json({ error: 'Missing message or channels' });

  let results = { email: 0, telegram: false };

  // Telegram
  if (channels.telegram) {
    results.telegram = await sendTelegramBroadcast(`<b>${subject}</b>\n\n${message}`);
  }

  // Email
  if (channels.email) {
    const users = await getAllUsers();
    let sentCount = 0;
    for (const u of users) {
      if (u.email) {
        const res = await sendBroadcastEmail(u.email, subject, message);
        if (res.success) sentCount++;
      }
    }
    results.email = sentCount;
  }

  res.json({ success: true, results });
});

// Notification health check
app.get('/api/admin/notification-status', async (req, res) => {
  const settings = await getSettings();
  const hasResendKey = !!(settings.resendApiKey || process.env.RESEND_API_KEY);
  const users = await getNotifiableUsers();
  res.json({
    resendConfigured: hasResendKey,
    emailFrom: settings.emailFrom || process.env.EMAIL_FROM || 'StrikeSignal Alerts <alerts@izentsport.xyz>',
    notifiableUsers: users.length,
    users: users.map(u => ({ email: u.email, name: u.name }))
  });
});

// ── Blog API Routes ─────────────────────────────────────────────────────────
import { getBlogPosts, saveBlogPost, deleteBlogPost } from './storage.js';

app.get('/api/blog', async (req, res) => {
  const posts = await getBlogPosts();
  res.json(posts);
});

app.post('/api/admin/blog', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const post = { id: Date.now().toString(), title, content };
  await saveBlogPost(post);
  res.json(post);
});

app.put('/api/admin/blog/:id', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const post = { id: req.params.id, title, content };
  await saveBlogPost(post);
  res.json(post);
});

app.delete('/api/admin/blog/:id', async (req, res) => {
  await deleteBlogPost(req.params.id);
  res.json({ success: true });
});

// Debug endpoint: shows live poll state and API key status
app.get('/api/debug/live', async (req, res) => {
  const settings = await getSettings();
  const apiKey = settings.sportmonksApiKey || process.env.SPORTMONKS_API_KEY;
  const result = {
    apiKeyConfigured: !!apiKey,
    apiKeySource: settings.sportmonksApiKey ? 'settings' : (process.env.SPORTMONKS_API_KEY ? 'env' : 'none'),
    liveMatchesInMemory: liveMatches.length,
    liveSignalsInMemory: liveSignals.length,
  };
  if (apiKey) {
    try {
      const url = `https://api.sportmonks.com/v3/football/livescores/inplay?include=scores;participants;statistics;league;state&api_token=${apiKey}`;
      const r = await fetch(url);
      const json = await r.json();
      result.apiStatus = r.status;
      result.apiMatchCount = Array.isArray(json.data) ? json.data.length : 0;
      result.apiMessage = json.message || null;
      result.apiSubscription = json.subscription || null;
      // Also test the odds endpoint
      const oddsRes = await fetch(`https://api.sportmonks.com/v3/football/odds/inplay?api_token=${apiKey}&per_page=5`);
      const oddsJson = await oddsRes.json();
      result.oddsApiStatus = oddsRes.status;
      result.oddsApiCount = Array.isArray(oddsJson.data) ? oddsJson.data.length : 0;
      result.oddsApiMessage = oddsJson.message || null;
      if (Array.isArray(json.data) && json.data.length > 0) {
        const first = json.data[0];
        result.sampleMatch = {
          id: first.id,
          state_id: first.state_id,
          starting_at_timestamp: first.starting_at_timestamp,
          hasParticipants: Array.isArray(first.participants) && first.participants.length > 0,
          hasStatistics: Array.isArray(first.statistics) && first.statistics.length > 0,
          hasOdds: Array.isArray(first.odds) && first.odds.length > 0,
          hasScores: Array.isArray(first.scores) && first.scores.length > 0,
        };
      }
    } catch (e) {
      result.apiError = e.message;
    }
  }
  res.json(result);
});

// Debug endpoint: test IzentBet API connection + booking code lookup
app.get('/api/debug/izentbet', async (req, res) => {
  const IZENTBET_API = 'https://backend-production-2d71.up.railway.app/api/v1/strikesignal/convert';
  const API_KEY = 'sk_strike_izent_2026_live';

  // Use query params to override teams, e.g. ?home=Arsenal&away=Chelsea&market=totals&selection=Over+1.5
  const home      = req.query.home      || 'Kolos Kovalivka';
  const away      = req.query.away      || 'SK Poltava';
  const market    = req.query.market    || 'totals';
  const selection = req.query.selection || 'Over 1.5';

  const payload = {
    api_key: API_KEY,
    selections: [{ home_team: home, away_team: away, market, selection, sport: 'football' }]
  };

  const debug = {
    endpoint: IZENTBET_API,
    requestPayload: payload,
    home, away, market, selection,
  };

  try {
    const start = Date.now();
    const r = await fetch(IZENTBET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    debug.httpStatus    = r.status;
    debug.latencyMs     = Date.now() - start;
    const json          = await r.json();
    debug.rawResponse   = json;
    debug.apiReachable  = true;
    debug.apiSuccess    = json.success === true;
    debug.bookingCodes  = json.data || null;
    debug.diagnosis =
      !r.ok              ? `❌ API returned HTTP ${r.status} — check if IzentBet backend is online` :
      !json.success      ? `⚠️ API reachable but returned success:false — match "${home} vs ${away}" likely NOT found on SportyBet` :
      !json.data?.sportybet ? `⚠️ API success but no SportyBet code — match may not be listed on SportyBet NG` :
      `✅ All good — SportyBet code: ${json.data.sportybet}`;
  } catch (err) {
    debug.apiReachable  = false;
    debug.error         = err.message;
    debug.diagnosis     = `❌ Cannot reach IzentBet API: ${err.message}`;
  }

  res.json(debug);
});

// ── Trade Log ─────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync } from 'fs';

const TRADES_PATH = join(process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), 'data'), 'trades.json');

function readTrades() {
  try { return JSON.parse(readFileSync(TRADES_PATH, 'utf-8')); } catch { return []; }
}
function writeTrades(arr) { writeFileSync(TRADES_PATH, JSON.stringify(arr, null, 2), 'utf-8'); }

app.get('/api/trades', authMiddleware, async (req, res) => {
  res.json(readTrades().filter(t => t.userId === req.user.id).reverse());
});

app.post('/api/trades', authMiddleware, async (req, res) => {
  const { match, market, odds, stake, result, date } = req.body;
  if (!match || !market || !odds || !stake) return res.status(400).json({ error: 'match, market, odds, stake required' });
  const trade = {
    id: Date.now().toString(), userId: req.user.id,
    match, market, odds: parseFloat(odds), stake: parseFloat(stake),
    result: result || 'pending', date: date || new Date().toISOString(),
    pnl: result === 'win' ? parseFloat(stake) * (parseFloat(odds) - 1) : result === 'loss' ? -parseFloat(stake) : 0,
    created_at: new Date().toISOString()
  };
  const all = readTrades();
  all.push(trade);
  writeTrades(all);
  res.json(trade);
});

app.patch('/api/trades/:id', authMiddleware, async (req, res) => {
  const { result } = req.body;
  if (!['win', 'loss', 'pending'].includes(result)) return res.status(400).json({ error: 'Invalid result' });
  const all = readTrades();
  const idx = all.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Trade not found' });
  all[idx].result = result;
  all[idx].pnl = result === 'win' ? all[idx].stake * (all[idx].odds - 1) : result === 'loss' ? -all[idx].stake : 0;
  writeTrades(all);
  res.json(all[idx]);
});

app.delete('/api/trades/:id', authMiddleware, async (req, res) => {
  const all = readTrades();
  const filtered = all.filter(t => !(t.id === req.params.id && t.userId === req.user.id));
  writeTrades(filtered);
  res.json({ success: true });
});

// ── SportyBet Integration ───────────────────────────────────────────────────
// readSportybet, writeSportybet, readSportybetLog, writeSportybetLog are imported from storage.js

function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  const first4 = phone.slice(0, 4);
  const last2 = phone.slice(-2);
  return first4 + "XXXXX" + last2;
}

app.get('/api/sportybet/status', authMiddleware, (req, res) => {
  const sb = readSportybet(req.user.id);
  if (!sb.connected) return res.json({ connected: false, balance: 0 });

  res.json({
    connected: sb.connected,
    phone: maskPhone(sb.phone),
    sessionKey: sb.sessionKey ? sb.sessionKey.slice(0, 8) + "••••" : null,
    balance: sb.balance || 0,
    balanceFormatted: sb.balanceFormatted || "₦0.00",
    lastBalanceSync: sb.lastBalanceSync,
    connectedAt: sb.connectedAt
  });
});

app.post('/api/sportybet/connect', authMiddleware, async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, error: 'Phone and password required' });
  
  if (!/^(070|080|081|090|091)\d{8}$/.test(phone)) {
    return res.status(400).json({ success: false, error: "Please enter a valid Nigerian phone number" });
  }

  console.log("🔄 Testing Sportybet credentials...");
  const loginTest = await loginSportybet(phone, password);

  if (!loginTest.success) {
    return res.status(401).json({ success: false, error: loginTest.error || "Could not connect to Sportybet. Please check your credentials." });
  }

  const balanceResult = await fetchBalance(phone, password);
  const encoded = Buffer.from(phone + ":" + password).toString("base64");
  const sessionKey = "sprt_" + Buffer.from(phone).toString("base64").slice(0, 8);

  const sb = readSportybet(req.user.id);
  sb.connected = true;
  sb.phone = phone;
  sb.encodedCredentials = encoded;
  sb.sessionKey = sessionKey;
  sb.balance = balanceResult.balance || 0;
  sb.balanceFormatted = balanceResult.balanceFormatted || "₦0.00";
  sb.lastBalanceSync = new Date().toISOString();
  sb.connectedAt = new Date().toISOString();
  
  writeSportybet(req.user.id, sb);

  res.json({
    success: true,
    connected: true,
    phone: maskPhone(phone),
    sessionKey: sessionKey,
    balance: sb.balance,
    balanceFormatted: sb.balanceFormatted,
    message: "Sportybet connected successfully! ✅"
  });
});

app.get('/api/sportybet/balance', authMiddleware, async (req, res) => {
  const sb = readSportybet(req.user.id);
  if (!sb.connected) return res.json({ balance: 0, balanceFormatted: "₦0.00" });

  const lastSync = new Date(sb.lastBalanceSync || 0);
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  if (lastSync > thirtyMinsAgo) {
    return res.json({
      balance: sb.balance,
      balanceFormatted: sb.balanceFormatted,
      lastBalanceSync: sb.lastBalanceSync,
      cached: true
    });
  }

  const decoded = Buffer.from(sb.encodedCredentials, "base64").toString("utf8");
  const [phone, pwd] = decoded.split(":");
  const result = await fetchBalance(phone, pwd);

  if (result.success) {
    sb.balance = result.balance;
    sb.balanceFormatted = result.balanceFormatted;
    sb.lastBalanceSync = result.fetchedAt;
    writeSportybet(req.user.id, sb);
    return res.json({
      balance: sb.balance,
      balanceFormatted: sb.balanceFormatted,
      lastBalanceSync: sb.lastBalanceSync
    });
  }

  res.json({
    balance: sb.balance,
    balanceFormatted: sb.balanceFormatted,
    lastBalanceSync: sb.lastBalanceSync,
    cached: true,
    note: "Using cached balance — refresh failed"
  });
});

app.post('/api/sportybet/disconnect', authMiddleware, (req, res) => {
  const sb = readSportybet(req.user.id);
  sb.connected = false;
  sb.phone = null;
  sb.encodedCredentials = null;
  sb.sessionKey = null;
  sb.balance = 0;
  sb.balanceFormatted = "₦0.00";
  sb.lastBalanceSync = null;
  sb.connectedAt = null;
  writeSportybet(req.user.id, sb);

  if (fs.existsSync('./sportybet-session.json')) {
    fs.unlinkSync('./sportybet-session.json');
  }

  res.json({ success: true });
});

app.get('/api/sportybet/bots', authMiddleware, (req, res) => {
  const sb = readSportybet(req.user.id);
  res.json(sb.bots || []);
});

app.post('/api/sportybet/bots', authMiddleware, (req, res) => {
  const bot = req.body;
  bot.id = Date.now().toString();
  bot.active = false;
  const sb = readSportybet(req.user.id);
  if (!sb.bots) sb.bots = [];
  sb.bots.push(bot);
  writeSportybet(req.user.id, sb);
  res.json(bot);
});

app.patch('/api/sportybet/bots/:id/toggle', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  const sb = readSportybet(req.user.id);
  if (!sb.bots) sb.bots = [];
  const bot = sb.bots.find(b => b.id === id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });
  bot.active = active;
  writeSportybet(req.user.id, sb);
  res.json(bot);
});

app.put('/api/sportybet/bots/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updatedBot = req.body;
  const sb = readSportybet(req.user.id);
  if (!sb.bots) sb.bots = [];
  const idx = sb.bots.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Bot not found' });
  sb.bots[idx] = { ...sb.bots[idx], ...updatedBot, id }; // ensure ID is preserved
  writeSportybet(req.user.id, sb);
  res.json(sb.bots[idx]);
});

app.delete('/api/sportybet/bots/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const sb = readSportybet(req.user.id);
  if (!sb.bots) sb.bots = [];
  const initialLength = sb.bots.length;
  sb.bots = sb.bots.filter(b => b.id !== id);
  if (sb.bots.length === initialLength) return res.status(404).json({ error: 'Bot not found' });
  writeSportybet(req.user.id, sb);
  res.json({ success: true });
});

app.get('/api/sportybet/execution-log', authMiddleware, (req, res) => {
  const logs = readSportybetLog(req.user.id);
  const typeFilter = req.query.type;
  let filtered = logs;
  if (typeFilter) {
    filtered = logs.filter(l => l.type === typeFilter);
  }
  const last50 = filtered.slice(0, 50);
  const successCount = logs.filter(l => l.type === 'SUCCESS').length;
  const errorCount = logs.filter(l => l.type === 'ERROR').length;
  res.json({
    logs: last50,
    total: logs.length,
    successCount,
    errorCount
  });
});

app.post('/api/sportybet/execution-log', authMiddleware, (req, res) => {
  const entry = req.body;
  const logs = readSportybetLog(req.user.id);
  logs.unshift(entry);
  const trimmed = logs.slice(0, 200);
  writeSportybetLog(req.user.id, trimmed);
  res.json(entry);
});

app.delete('/api/sportybet/execution-log', authMiddleware, (req, res) => {
  writeSportybetLog(req.user.id, []);
  res.json({ success: true });
});

// Test automation with a manual bet link
app.post('/api/sportybet/test-automation', authMiddleware, async (req, res) => {
  const { betLink, stakeAmount } = req.body;
  if (!betLink) return res.status(400).json({ error: 'betLink is required' });
  
  const stake = parseInt(stakeAmount) || 100;
  
  console.log(`\n🧪 Test automation request: ${betLink} — ₦${stake}`);
  
  // Run async — don't block the HTTP response (this takes 30-60s)
  res.json({ success: true, message: 'Automation test started — check execution log for results', betLink, stakeAmount: stake });
  
  // Fire and forget
  testAutomation(req.user.id, betLink, stake).then(result => {
    console.log('🧪 Test automation result:', JSON.stringify(result));
  }).catch(err => {
    console.error('🧪 Test automation error:', err.message);
  });
});

app.get('/api/sportybet/bots/stats', authMiddleware, (req, res) => {
  const sb = readSportybet(req.user.id);
  const logs = readSportybetLog(req.user.id);
  const bots = sb.bots || [];
  const stats = {};

  for (const bot of bots) {
    const botLogs = logs.filter(l => l.botId === bot.id);
    stats[bot.id] = {
      totalBets: botLogs.length,
      successBets: botLogs.filter(l => l.type === 'SUCCESS' && !l.simulation).length,
      failedBets: botLogs.filter(l => l.type === 'ERROR').length,
      simulatedBets: botLogs.filter(l => l.simulation === true).length,
      totalStaked: botLogs.filter(l => l.type === 'SUCCESS').reduce((sum, l) => sum + (l.stake || 0), 0)
    };
  }

  res.json(stats);
});


// ── Chat (Gemini AI) ─────────────────────────────────────────────────────────
import {
  getChatResponse, getSession, getAllPendingSessions, getAllSessions,
  addAgentReply, resolveSession as resolveSessionFn,
  saveContact, readContacts, updateContact, deleteContact
} from './chat.js';

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, conversationHistory } = req.body;
    if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId required' });
    const result = await getChatResponse(message, conversationHistory || [], sessionId);
    res.json(result);
  } catch (e) {
    console.error('[Chat] Error:', e.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.get('/api/chat/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/chat/:sessionId/agent-reply', (req, res) => {
  const { message, agentName } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const session = addAgentReply(req.params.sessionId, message, agentName || 'Support Team');
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.get('/api/chat/sessions/all', (req, res) => {
  res.json(getAllSessions());
});

app.get('/api/chat/sessions/pending', (req, res) => {
  res.json(getAllPendingSessions());
});

app.patch('/api/chat/:sessionId/resolve', (req, res) => {
  const ok = resolveSessionFn(req.params.sessionId);
  if (!ok) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
});

// ── Contact Form ─────────────────────────────────────────────────────────────

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email, message required' });
    const entry = {
      id: Date.now().toString(),
      name, email, subject: subject || 'General Enquiry', message,
      read: false,
      createdAt: new Date().toISOString()
    };
    saveContact(entry);
    res.json({ success: true, message: 'Message sent! We\'ll reply within 24 hours.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/api/contacts', (req, res) => {
  res.json(readContacts());
});

app.patch('/api/contacts/:id', (req, res) => {
  const ok = updateContact(req.params.id, req.body);
  if (!ok) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

app.delete('/api/contacts/:id', (req, res) => {
  const ok = deleteContact(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

// ── Admin Auth ───────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPwd = process.env.ADMIN_PASSWORD || 'strikesignal2026';
  if (password === adminPwd) {
    res.json({ success: true, token: 'admin_' + Date.now() });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// ── AI Chat Proxy ────────────────────────────────────────────────────────────

app.post('/api/ai-chat', async (req, res) => {
  try {
    const response = await fetch('https://backend-production-2d71.up.railway.app/functions/v1/ai-bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[AI Chat Proxy] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/ai-chat/bet9ja-build', async (req, res) => {
  try {
    const response = await fetch('https://backend-production-2d71.up.railway.app/functions/v1/ai-bet/bet9ja-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[AI Chat Proxy] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

cron.schedule("*/30 * * * *", async () => {
  try {
    const configs = getAllSportybetConfigs();
    for (const config of configs) {
      const sb = config.data;
      if (!sb.connected) continue;

      console.log(`🔄 Auto-syncing Sportybet balance for user ${config.userId}...`);
      const decoded = Buffer.from(sb.encodedCredentials, "base64").toString("utf8");
      const [phone, pwd] = decoded.split(":");
      const result = await fetchBalance(phone, pwd);

      if (result.success) {
        sb.balance = result.balance;
        sb.balanceFormatted = result.balanceFormatted;
        sb.lastBalanceSync = result.fetchedAt;
        writeSportybet(config.userId, sb);
        console.log(`✅ Balance synced for ${config.userId}:`, result.balanceFormatted);
      }
    }
  } catch (err) {
    console.error("❌ Auto sync failed:", err.message);
  }
});

// ─── Subscription Endpoints ──────────────────────────────────────────────────

app.post('/api/subscription/initiate', async (req, res) => {
  const { plan, userId, email, name } = req.body;
  if (!plan || !userId || !email) return res.status(400).json({ error: 'Missing required fields' });
  const result = await initiatePayment({ id: userId, email, name }, plan);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

app.post('/api/subscription/webhook', async (req, res) => {
  const signature = req.headers['verif-hash'];
  if (!signature) return res.status(400).end();
  
  // Flutterwave requires a 200 OK regardless of processing result
  res.status(200).end();
  
  // Process asynchronously
  await handleWebhook(req.body, signature);
});

app.get('/api/subscription/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const sub = await getUserSubscription(userId);
  res.json(sub);
});

app.post('/api/subscription/verify/:txRef', async (req, res) => {
  const { txRef } = req.params;
  const result = await manualVerifyByTxRef(txRef);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`StrikeSignal backend running on port ${PORT}`);
  console.log(`[Storage] Data directory: ${getDataDir()}`);
  console.log(`[Storage] Persistent volume: ${isUsingVolume() ? 'YES' : 'NO (data may be lost on redeploy)'}`);
  getAllSignals().then(sigs => console.log(`[Storage] Total signals: ${sigs.length}`)).catch(() => {});
});
