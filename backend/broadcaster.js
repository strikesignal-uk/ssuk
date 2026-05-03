import fs from 'fs';
import { join } from 'path';
import { getSettings } from './settings.js';
import { getDataDir, getAllSignals } from './storage.js';

// ── Broadcast log path (persistent volume) ───────────────────────────────────
function getLogPath() {
  return join(getDataDir(), 'broadcast-log.json');
}

// ── Helpers: JSON read/write ─────────────────────────────────────────────────
function readBroadcastLog() {
  try {
    const p = getLogPath();
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function writeBroadcastLog(data) {
  fs.writeFileSync(getLogPath(), JSON.stringify(data, null, 2));
}

function wasAlreadyBroadcast(signalId) {
  const log = readBroadcastLog();
  return log.some(e => e.signalId === signalId);
}

function logBroadcast({ type, signalId, match, message, telegramSent }) {
  const log = readBroadcastLog();
  log.push({
    id: Date.now().toString(),
    type,
    signalId: signalId || null,
    match: match || null,
    message,
    timestamp: new Date().toISOString(),
    telegramSent: !!telegramSent,
  });
  // Keep last 500 entries
  const trimmed = log.slice(-500);
  writeBroadcastLog(trimmed);
}

// ── Send message to Telegram ─────────────────────────────────────────────────
async function sendTelegramMessage(text) {
  try {
    const settings = await getSettings();
    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHANNEL_ID || '@strikesignalpro';

    if (!token) {
      console.warn('[Broadcaster] No Telegram bot token configured');
      return { success: false, error: 'No bot token' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Telegram message sent!');
      return { success: true };
    } else {
      console.error('❌ Telegram error:', data.description);
      return { success: false, error: data.description };
    }
  } catch (err) {
    console.error('❌ Telegram send error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── FUNCTION 1: Broadcast signal alert (when signal FIRES) ──────────────────
async function broadcastSignalAlert(signal) {
  const alertId = signal.id + '_alert';
  if (wasAlreadyBroadcast(alertId)) return;

  const message =
`🚨 <b>LIVE SIGNAL ALERT</b>

⚽ <b>${signal.home} vs ${signal.away}</b>
🏆 ${signal.league || 'League'}
⏱️ Minute: ${signal.minute}'
📊 Market: <b>${signal.betType}</b>
🎯 Confidence: <b>${(signal.confidence || 'medium').toUpperCase()}</b>

📈 <b>Live Stats:</b>
• Total xG: ${signal.xG?.total?.toFixed(2) || 'N/A'}
• Home xG: ${signal.xG?.home?.toFixed(2) || 'N/A'}
• Away xG: ${signal.xG?.away?.toFixed(2) || 'N/A'}
• Danger Attacks: ${signal.dangerAttacks || 'N/A'}
• Shots: ${signal.shots || 'N/A'}
• Pressure: ${signal.pressure || 'N/A'}%

Expected Score: ${signal.expectedScore || 'N/A'}

${signal.$market?.betLink
    ? '⚡ <b>Bet Now:</b> ' + signal.$market.betLink
    : '⚡ Visit strikesignal.pro to bet now'}

Act fast — in-play odds move quickly! 🔥

#StrikeSignal #LiveSignal #NaijaBetting 🇳🇬`;

  const result = await sendTelegramMessage(message);
  logBroadcast({
    type: 'signal_alert',
    signalId: alertId,
    match: `${signal.home} vs ${signal.away}`,
    message,
    telegramSent: result.success,
  });
}

// ── FUNCTION 2: Broadcast WIN result ─────────────────────────────────────────
async function broadcastWinResult(signal) {
  const resultId = signal.id + '_result';
  if (wasAlreadyBroadcast(resultId)) return;

  const stakeExample = 5000;
  const odds = parseFloat(signal.$market?.totalOdds || signal.betOdds || 1.65);
  const returnAmount = Math.round(stakeExample * odds);
  const profit = returnAmount - stakeExample;

  const message =
`✅ <b>SIGNAL RESULT — WIN</b>

⚽ <b>${signal.home} vs ${signal.away}</b>
🏆 ${signal.league || 'League'}
⏱️ Signal fired: ${signal.minute}'
📊 Market: ${signal.betType}
🎯 Confidence: ${(signal.confidence || 'medium').toUpperCase()}

📈 <b>Stats at signal time:</b>
• xG: ${signal.xG?.total?.toFixed(2) || 'N/A'}
• Danger Attacks: ${signal.dangerAttacks || 'N/A'}
• Shots: ${signal.shots || 'N/A'}

Final Score: ${signal.score?.home ?? '?'}-${signal.score?.away ?? '?'} ✅
Result: <b>WIN</b> 🔥

💰 <b>Example return:</b>
Stake: £${stakeExample.toLocaleString()}
Odds: ${odds}
Return: £${returnAmount.toLocaleString()}
Profit: +£${profit.toLocaleString()}

This is what data-driven betting looks like.
No guessing. Just signals. Just wins. ⚡

🔗 strikesignal.pro

#StrikeSignal #BettingSignals #FootballBetting #NaijaBetting #Win 🇳🇬`;

  const result = await sendTelegramMessage(message);
  logBroadcast({
    type: 'win',
    signalId: resultId,
    match: `${signal.home} vs ${signal.away}`,
    message,
    telegramSent: result.success,
  });
}

// ── FUNCTION 3: Broadcast LOSS result ────────────────────────────────────────
async function broadcastLossResult(signal) {
  const resultId = signal.id + '_result';
  if (wasAlreadyBroadcast(resultId)) return;

  // Get today's stats
  const signals = await getAllSignals();
  const today = new Date().toDateString();
  const todaySignals = signals.filter(s =>
    new Date(s.created_at).toDateString() === today && s.result !== 'pending'
  );
  const wins = todaySignals.filter(s => s.result === 'win').length;
  const losses = todaySignals.filter(s => s.result === 'loss').length;
  const total = todaySignals.length;
  const strikeRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const message =
`❌ <b>SIGNAL RESULT — LOSS</b>

⚽ <b>${signal.home} vs ${signal.away}</b>
🏆 ${signal.league || 'League'}
⏱️ Signal fired: ${signal.minute}'
📊 Market: ${signal.betType}
🎯 Confidence: ${(signal.confidence || 'medium').toUpperCase()}

Final Score: ${signal.score?.home ?? '?'}-${signal.score?.away ?? '?'} ❌

Not every signal wins — and we never
hide our losses. That's what separates
StrikeSignal from tipsters.

📊 <b>Today's record so far:</b>
✅ Wins: ${wins}
❌ Losses: ${losses}
🎯 Strike Rate: ${strikeRate}%

The data works over time.
Stay disciplined. Stay consistent. ⚡

🔗 strikesignal.pro

#StrikeSignal #BettingSignals #Transparency #NaijaBetting 🇳🇬`;

  const result = await sendTelegramMessage(message);
  logBroadcast({
    type: 'loss',
    signalId: resultId,
    match: `${signal.home} vs ${signal.away}`,
    message,
    telegramSent: result.success,
  });
}

// ── FUNCTION 4: Daily summary ────────────────────────────────────────────────
async function broadcastDailySummary() {
  const signals = await getAllSignals();
  const today = new Date().toDateString();

  const todaySignals = signals.filter(s =>
    new Date(s.created_at).toDateString() === today && s.result !== 'pending'
  );

  if (todaySignals.length === 0) {
    console.log('[Broadcaster] No resolved signals today — skipping summary');
    return;
  }

  const wins = todaySignals.filter(s => s.result === 'win').length;
  const losses = todaySignals.filter(s => s.result === 'loss').length;
  const total = todaySignals.length;
  const strikeRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Find best signal (highest confidence win)
  const bestSignal = todaySignals
    .filter(s => s.result === 'win' && s.confidence === 'high')
    .sort((a, b) => (b.minute || 0) - (a.minute || 0))[0]
    || todaySignals.find(s => s.result === 'win');

  // Get unique leagues today
  const leagues = [...new Set(todaySignals.map(s => s.league).filter(Boolean))];

  function getFlag(league) {
    if (!league) return '⚽';
    if (league.includes('Premier League')) return '🏴';
    if (league.includes('La Liga')) return '🇪🇸';
    if (league.includes('Bundesliga')) return '🇩🇪';
    if (league.includes('Serie A')) return '🇮🇹';
    if (league.includes('Ligue 1')) return '🇫🇷';
    if (league.includes('Championship')) return '🏴';
    if (league.includes('NPFL') || league.includes('Nigeria')) return '🇳🇬';
    return '⚽';
  }

  const leagueList = leagues.map(l => getFlag(l) + ' ' + l).join('\n');

  const dateStr = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const message =
`📊 <b>DAILY SIGNAL SUMMARY</b>
${dateStr}

Total Signals: ${total}
✅ Wins: ${wins}
❌ Losses: ${losses}
🎯 Strike Rate: <b>${strikeRate}%</b>

${bestSignal ? `🏆 <b>Best signal today:</b>
⚽ ${bestSignal.home} vs ${bestSignal.away}
📊 ${bestSignal.betType} | ${bestSignal.minute}' | ${(bestSignal.confidence || 'medium').toUpperCase()} confidence
` : ''}
🌍 <b>Leagues covered today:</b>
${leagueList || 'None'}

Tomorrow's matches loading... 👀

Join our channel for live signals 👇
🔗 strikesignal.pro

#StrikeSignal #DailySummary #NaijaBetting 🇳🇬⚡`;

  const result = await sendTelegramMessage(message);
  logBroadcast({
    type: 'daily_summary',
    signalId: null,
    match: null,
    message,
    telegramSent: result.success,
  });
  console.log('✅ Daily summary sent to Telegram');
}

// ── Get broadcast feed (for frontend) ────────────────────────────────────────
function getBroadcastFeed(limit = 50) {
  const log = readBroadcastLog();
  return log.slice(-limit).reverse();
}

export {
  broadcastSignalAlert,
  broadcastWinResult,
  broadcastLossResult,
  broadcastDailySummary,
  sendTelegramMessage,
  getBroadcastFeed,
  logBroadcast,
};
