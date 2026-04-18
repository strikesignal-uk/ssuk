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
  getLast30Days,
  getAllSignals,
  importSignals,
  isUsingVolume,
  getDataDir
} from './storage.js';
import { getSettings, updateSettings } from './settings.js';
import { createUser, loginUser, verifyToken, getAllUsers, updateNotifications, getNotifiableUsers } from './users.js';
import { sendSignalNotification, sendWelcomeEmail, sendTestEmail } from './email.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

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
  const rawMatches = await fetchLiveMatches();
  liveMatches = [];
  liveSignals = [];
  let signalsGenerated = 0;
  const newSignals = [];
  for (const raw of rawMatches) {
    const match = parseMatch(raw);
    if (!match) continue;
    liveMatches.push(match);
    let signal = generateSignal(match);
    if (signal) {
      signal = await aiEnhanceSignal(match, signal);
      liveSignals.push({ ...match, ...signal });
      const saved = saveSignal(match, signal);
      if (saved) newSignals.push({ ...match, ...signal });
      signalsGenerated++;
    }
  }
  // Send email notifications for new signals
  if (newSignals.length > 0) {
    const users = getNotifiableUsers();
    console.log(`[${new Date().toISOString()}] ${newSignals.length} new signal(s), ${users.length} notifiable user(s)`);
    if (users.length > 0) {
      for (const sig of newSignals) {
        sendSignalNotification(users, sig).catch(err => console.error('Email error:', err.message));
      }
    } else {
      console.log(`[${new Date().toISOString()}] No users with notifications enabled, skipping email`);
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

  const all = getAllSignals();
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

app.patch('/api/signals/:id/result', (req, res) => {
  const { id } = req.params;
  const { result } = req.body;
  if (!['win', 'loss'].includes(result)) return res.status(400).json({ error: 'Invalid result' });
  const ok = updateResult(id, result);
  res.json({ success: ok });
});

app.get('/health', (req, res) => {
  const allSignals = readSignals();
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
app.get('/api/signals/export', (req, res) => {
  const all = readSignals();
  res.setHeader('Content-Disposition', `attachment; filename=signals-backup-${new Date().toISOString().slice(0,10)}.json`);
  res.json(all);
});

// Import signals data (merge, never overwrite)
app.post('/api/signals/import', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Expected an array of signals' });
  const result = importSignals(data);
  res.json({ success: true, ...result });
});

app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  const maskedSportmonks = settings.sportmonksApiKey
    ? '••••••••' + settings.sportmonksApiKey.slice(-4)
    : '';
  const maskedGemini = settings.geminiApiKey
    ? '••••••••' + settings.geminiApiKey.slice(-4)
    : '';
  const maskedResend = settings.resendApiKey
    ? '••••••••' + settings.resendApiKey.slice(-4)
    : '';
  res.json({ sportmonksApiKey: maskedSportmonks, geminiApiKey: maskedGemini, resendApiKey: maskedResend, emailFrom: settings.emailFrom || '' });
});

app.put('/api/settings', (req, res) => {
  const { sportmonksApiKey, geminiApiKey, resendApiKey, emailFrom } = req.body;
  const update = {};
  if (typeof sportmonksApiKey === 'string') update.sportmonksApiKey = sportmonksApiKey.trim();
  if (typeof geminiApiKey === 'string') update.geminiApiKey = geminiApiKey.trim();
  if (typeof resendApiKey === 'string') update.resendApiKey = resendApiKey.trim();
  if (typeof emailFrom === 'string') update.emailFrom = emailFrom.trim();
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }
  updateSettings(update);
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

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/notifications', authMiddleware, (req, res) => {
  const { enabled } = req.body;
  updateNotifications(req.user.id, !!enabled);
  res.json({ success: true });
});

app.post('/api/settings/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  const result = await sendTestEmail(email);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ success: true, emailId: result.emailId });
});

app.get('/api/admin/users', (req, res) => {
  res.json(getAllUsers());
});

// Notification health check
app.get('/api/admin/notification-status', (req, res) => {
  const settings = getSettings();
  const hasResendKey = !!(settings.resendApiKey || process.env.RESEND_API_KEY);
  const users = getNotifiableUsers();
  res.json({
    resendConfigured: hasResendKey,
    emailFrom: settings.emailFrom || process.env.EMAIL_FROM || 'StrikeSignal Alerts <alerts@izentsport.xyz>',
    notifiableUsers: users.length,
    users: users.map(u => ({ email: u.email, name: u.name }))
  });
});

app.listen(PORT, () => {
  console.log(`StrikeSignal backend running on port ${PORT}`);
  console.log(`[Storage] Data directory: ${getDataDir()}`);
  console.log(`[Storage] Persistent volume: ${isUsingVolume() ? 'YES' : 'NO (data may be lost on redeploy)'}`);
  console.log(`[Storage] Total signals: ${readSignals().length}`);
});
