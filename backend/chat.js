import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import { getSettings } from './settings.js';
import { getDataDir } from './storage.js';

const SESSIONS_PATH = () => join(getDataDir(), 'chat-sessions.json');
const CONTACTS_PATH = () => join(getDataDir(), 'contacts.json');

// ── Session storage ─────────────────────────────────────────────────────────

function readSessions() {
  try { return JSON.parse(readFileSync(SESSIONS_PATH(), 'utf-8')); }
  catch { return []; }
}

function writeSessions(data) {
  writeFileSync(SESSIONS_PATH(), JSON.stringify(data, null, 2), 'utf-8');
}

export function getSession(sessionId) {
  return readSessions().find(s => s.sessionId === sessionId) || null;
}

export function getAllPendingSessions() {
  return readSessions().filter(s => s.needs_agent && !s.resolved);
}

export function getAllSessions() {
  return readSessions();
}

function saveSession(session) {
  const all = readSessions();
  const idx = all.findIndex(s => s.sessionId === session.sessionId);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  writeSessions(all);
}

export function resolveSession(sessionId) {
  const all = readSessions();
  const s = all.find(s => s.sessionId === sessionId);
  if (!s) return false;
  s.resolved = true;
  writeSessions(all);
  return true;
}

// ── Contact storage ─────────────────────────────────────────────────────────

export function readContacts() {
  try { return JSON.parse(readFileSync(CONTACTS_PATH(), 'utf-8')); }
  catch { return []; }
}

export function saveContact(entry) {
  const all = readContacts();
  all.push(entry);
  writeFileSync(CONTACTS_PATH(), JSON.stringify(all, null, 2), 'utf-8');
}

export function updateContact(id, updates) {
  const all = readContacts();
  const c = all.find(c => c.id === id);
  if (!c) return false;
  Object.assign(c, updates);
  writeFileSync(CONTACTS_PATH(), JSON.stringify(all, null, 2), 'utf-8');
  return true;
}

export function deleteContact(id) {
  let all = readContacts();
  const before = all.length;
  all = all.filter(c => c.id !== id);
  writeFileSync(CONTACTS_PATH(), JSON.stringify(all, null, 2), 'utf-8');
  return all.length < before;
}

// ── Gemini Chat ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are StrikeSignal's helpful AI support assistant.
StrikeSignal is a real-time football betting signal platform by Izent Global Ltd, registered in UK and Nigeria.

The platform:
- Generates live football signals using xG data
- Targets Nigerian bettors using $market and $market
- Subscription costs £5,000/month or £45,000/year
- Covers Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- Has 67% average strike rate
- Uses Sportmonks API for live match data

You can help users with:
- How signals work (xG explanation, signal timing)
- Subscription and billing questions
- How to connect $market account
- Technical issues with the dashboard
- Betting strategy questions

Rules:
- Always be helpful, friendly and professional
- Never guarantee profits or give specific betting advice
- If asked about legal/financial matters, recommend seeking professional advice
- If user needs live agent, say: 'I'll connect you to our support team now. Please hold on a moment.' Then set needs_agent: true in your response
- Keep responses concise — under 100 words
- Use Nigerian context where relevant (£, $market etc)
- Never mention competitors negatively`;

async function getClient() {
  const settings = await getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function getChatResponse(message, conversationHistory, sessionId) {
  // Find or create session
  let session = getSession(sessionId);
  if (!session) {
    session = {
      sessionId,
      createdAt: new Date().toISOString(),
      userEmail: null,
      needs_agent: false,
      resolved: false,
      messages: []
    };
  }

  // Add user message
  session.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });

  // Check for agent transfer keywords
  const lowerMsg = message.toLowerCase();
  const wantsAgent = ['talk to agent', 'live support', 'human', 'talk to support team',
    'speak to someone', 'real person', 'live agent'].some(k => lowerMsg.includes(k));

  if (wantsAgent) {
    session.needs_agent = true;
    const reply = "I'll connect you to our support team now. Please hold on a moment. 🟢 A support agent will be with you shortly.";
    session.messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    saveSession(session);
    return { message: reply, needs_agent: true, sessionId };
  }

  // If already transferred to agent, don't call Gemini
  if (session.needs_agent) {
    saveSession(session);
    return { message: null, needs_agent: true, sessionId };
  }

  // Call Gemini
  try {
    const client = await getClient();
    if (!client) {
      const fallback = "I'm sorry, our AI assistant is temporarily unavailable. Please try again later or type 'talk to agent' for human support.";
      session.messages.push({ role: 'assistant', content: fallback, timestamp: new Date().toISOString() });
      saveSession(session);
      return { message: fallback, needs_agent: false, sessionId };
    }

    // Build history for context
    const history = session.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${history}\n\nRespond to the user's latest message. Be concise and helpful.`;

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const reply = result.text.trim();

    // Check if Gemini wants to transfer
    const needsAgent = reply.toLowerCase().includes("connect you to our support team");

    session.messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    if (needsAgent) session.needs_agent = true;
    saveSession(session);

    return { message: reply, needs_agent: needsAgent, sessionId };
  } catch (err) {
    console.error('[Chat] Gemini error:', err.message);
    const fallback = "I'm having trouble connecting right now. Please try again or type 'talk to agent' for human support.";
    session.messages.push({ role: 'assistant', content: fallback, timestamp: new Date().toISOString() });
    saveSession(session);
    return { message: fallback, needs_agent: false, sessionId };
  }
}

export function addAgentReply(sessionId, message, agentName = 'Support Team') {
  const session = getSession(sessionId);
  if (!session) return null;
  session.messages.push({
    role: 'agent',
    content: message,
    timestamp: new Date().toISOString(),
    agentName
  });
  saveSession(session);
  return session;
}

export async function askAdminAssistant(prompt) {
  const client = await getClient();
  if (!client) return "Error: Gemini API key not configured in settings.";
  
  const systemPrompt = `You are an expert marketing and support assistant for StrikeSignal, an AI-powered football betting signals platform. 
Your job is to help the admin draft professional, engaging broadcast messages for email or Telegram.
Keep messages concise, exciting, and professional. Output only the message content, no pleasantries. Use appropriate emojis.`;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nAdmin Request: ${prompt}`,
    });
    return result.text;
  } catch (err) {
    console.error('[AdminAssistant] Error:', err.message);
    return "Error generating content. Please try again.";
  }
}
