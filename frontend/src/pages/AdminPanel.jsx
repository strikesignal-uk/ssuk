import React, { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL;

// ── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      if (res.ok) { sessionStorage.setItem('ss_admin', data.token); onAuth(); }
      else setErr(data.error || 'Invalid password');
    } catch { setErr('Connection error'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-5">
      <form onSubmit={submit} className="bg-[#0d1527] border border-white/5 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-6">
          <img src="/logo.png" alt="StrikeSignal" className="h-10 w-auto" />
        </div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Admin Password</label>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required
          className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none mb-4" />
        {err && <p className="text-red-400 text-xs mb-3">{err}</p>}
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

// ── Sidebar Nav ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'chats', icon: '💬', label: 'Live Chats' },
  { key: 'contacts', icon: '📧', label: 'Contact Messages' },
  { key: 'broadcast', icon: '📣', label: 'Broadcasts' },
  { key: 'users', icon: '👥', label: 'Users' },
  { key: 'stats', icon: '📊', label: 'Signal Stats' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

// ── Live Chats Tab ───────────────────────────────────────────────────────────
function ChatsTab() {
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/api/chat/sessions/all`);
      if (res.ok) setSessions(await res.json());
    } catch {}
  };

  useEffect(() => { loadSessions(); const id = setInterval(loadSessions, 8000); return () => clearInterval(id); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active]);

  const filtered = sessions.filter(s => {
    if (filter === 'agent') return s.needs_agent && !s.resolved;
    if (filter === 'resolved') return s.resolved;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/${active.sessionId}/agent-reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim(), agentName: 'Support Team' })
      });
      if (res.ok) {
        const updated = await res.json();
        setActive(updated);
        setSessions(prev => prev.map(s => s.sessionId === updated.sessionId ? updated : s));
        setReply('');
      }
    } catch {}
    setLoading(false);
  };

  const resolve = async () => {
    if (!active) return;
    await fetch(`${API}/api/chat/${active.sessionId}/resolve`, { method: 'PATCH' });
    loadSessions();
    setActive(null);
  };

  const pendingCount = sessions.filter(s => s.needs_agent && !s.resolved).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Left — Session list */}
      <div className="w-80 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-3">Chat Sessions</h2>
          <div className="flex gap-1">
            {[['all', 'All'], ['agent', `Needs Agent ${pendingCount > 0 ? '(' + pendingCount + ')' : ''}`], ['resolved', 'Resolved']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  filter === k ? 'bg-blue-600 text-white' : 'bg-[#1a2744] text-slate-500 hover:text-white'
                }`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-600 text-sm">No sessions</div>
          ) : filtered.map(s => (
            <button key={s.sessionId} onClick={() => setActive(s)}
              className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/3 transition-all ${
                active?.sessionId === s.sessionId ? 'bg-blue-600/10' : ''
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-slate-500">{s.sessionId.slice(0, 12)}...</span>
                <span className="text-[10px] text-slate-600">{new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              <p className="text-sm text-slate-300 truncate">{s.messages?.[s.messages.length - 1]?.content?.slice(0, 50) || 'No messages'}</p>
              <div className="mt-1.5">
                {s.resolved ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">RESOLVED</span>
                ) : s.needs_agent ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">🔴 NEEDS AGENT</span>
                ) : (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">🟢 BOT</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right — Chat window */}
      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Select a chat session</div>
        ) : (
          <>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-sm">{active.sessionId.slice(0, 16)}</span>
                <span className="text-slate-500 text-xs ml-2">{active.messages?.length || 0} messages</span>
              </div>
              {active.needs_agent && !active.resolved && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/15 text-red-400">AGENT REQUIRED</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(active.messages || []).map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                    m.role === 'user' ? 'bg-blue-600 text-white' :
                    m.role === 'agent' ? 'bg-emerald-600/20 border border-emerald-500/20 text-emerald-100' :
                    'bg-[#1a2744] text-slate-200'
                  }`}>
                    {m.role === 'agent' && <div className="text-[10px] text-emerald-400 font-bold mb-1">🟢 {m.agentName || 'Support'}</div>}
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1">{new Date(m.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {active.needs_agent && !active.resolved && (
              <div className="border-t border-white/5 p-3">
                <div className="flex gap-2 mb-2">
                  <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type reply as Support Team..."
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                    className="flex-1 bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
                  <button onClick={sendReply} disabled={loading || !reply.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 rounded-xl text-sm font-bold transition-all">Send</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={resolve} className="bg-emerald-600/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">✓ Mark Resolved</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Contacts Tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try { const r = await fetch(`${API}/api/contacts`); if (r.ok) setContacts(await r.json()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await fetch(`${API}/api/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
    load();
  };

  const del = async (id) => {
    await fetch(`${API}/api/contacts/${id}`, { method: 'DELETE' });
    load(); if (selected?.id === id) setSelected(null);
  };

  const filtered = contacts.filter(c => filter === 'unread' ? !c.read : filter === 'read' ? c.read : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Contact Messages</h2>
        <div className="flex gap-1">
          {[['all', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${filter === k ? 'bg-blue-600 text-white' : 'bg-[#1a2744] text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                <th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th>
                <th className="text-left p-3">Subject</th><th className="text-left p-3">Preview</th><th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-slate-600">No messages</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className={`border-b border-white/5 cursor-pointer hover:bg-white/3 ${!c.read ? 'bg-blue-600/5' : ''}`}>
                  <td className="p-3 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="p-3 text-white font-medium">{c.name}</td>
                  <td className="p-3 text-slate-400">{c.email}</td>
                  <td className="p-3 text-slate-400">{c.subject}</td>
                  <td className="p-3 text-slate-500 truncate max-w-[200px]">{c.message?.slice(0, 40)}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      {!c.read && <button onClick={e => { e.stopPropagation(); markRead(c.id); }} className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-bold">Read</button>}
                      <button onClick={e => { e.stopPropagation(); del(c.id); }} className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded font-bold">Delete</button>
                      <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-[10px] bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Reply</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Message modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0d1527] border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-4"><h3 className="font-black text-white">{selected.subject}</h3><button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button></div>
            <div className="space-y-2 text-sm mb-4">
              <p className="text-slate-500"><span className="text-slate-300 font-bold">From:</span> {selected.name} ({selected.email})</p>
              <p className="text-slate-500"><span className="text-slate-300 font-bold">Date:</span> {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 text-slate-300 text-sm whitespace-pre-wrap">{selected.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/results?period=daily`).then(r => r.json()).then(d => setStats(d.stats)).catch(() => {});
  }, []);
  if (!stats) return <div className="p-6 text-slate-500">Loading...</div>;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">Signal Stats — Today</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total Signals', stats.total], ['Wins', stats.wins], ['Losses', stats.losses], ['Strike Rate', `${stats.strikeRate}%`]].map(([l, v]) => (
          <div key={l} className="bg-[#0d1527] border border-white/5 rounded-2xl p-5 text-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{l}</div>
            <div className="text-2xl font-black text-white">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch(`${API}/api/admin/users`).then(r => r.ok ? r.json() : []).then(d => setUsers(d)).catch(() => {});
  }, []);
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">Registered Users ({users.length})</h2>
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
            <th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Joined</th>
          </tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td colSpan="3" className="p-6 text-center text-slate-600">No users</td></tr> :
              users.map(u => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3 text-white font-medium">{u.name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Broadcast Tab ────────────────────────────────────────────────────────────
function BroadcastTab() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(false);
  const [telegram, setTelegram] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const askAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true); setAiError('');
    try {
      const res = await fetch(`${API}/api/admin/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (res.ok) setMessage(data.result);
      else setAiError(data.error || 'Failed to generate content');
    } catch { setAiError('Connection error'); }
    setAiGenerating(false);
  };

  const send = async () => {
    if (!message || (!email && !telegram)) return;
    setSending(true); setResult('');
    try {
      const res = await fetch(`${API}/api/admin/broadcast`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || 'StrikeSignal Update', message, channels: { email, telegram } })
      });
      const data = await res.json();
      if (res.ok) setResult(`✅ Sent! Emails: ${data.results.email}, Telegram: ${data.results.telegram ? 'Yes' : 'No'}`);
      else setResult(`❌ Error: ${data.error}`);
    } catch { setResult('❌ Connection error'); }
    setSending(false);
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">Send Broadcast Message</h2>
      
      {/* AI Assistant Box */}
      <div className="bg-gradient-to-r from-blue-600/10 to-emerald-600/10 border border-blue-500/20 rounded-2xl p-5 mb-4">
        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>✨</span> Gemini AI Assistant
        </h3>
        <p className="text-xs text-slate-400 mb-3">Tell the AI what you want to broadcast (e.g., "Write an exciting update about yesterday's 3-0 win streak")</p>
        <div className="flex gap-2">
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="What should the message say?" 
            onKeyDown={e => { if (e.key === 'Enter') askAi(); }}
            className="flex-1 bg-[#0a0f1e]/50 border border-blue-500/20 focus:border-blue-500 text-white rounded-xl px-4 py-2 text-sm outline-none transition-all" />
          <button onClick={askAi} disabled={aiGenerating || !aiPrompt.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap">
            {aiGenerating ? 'Generating...' : 'Generate Text'}
          </button>
        </div>
        {aiError && <p className="text-red-400 text-xs mt-2">{aiError}</p>}
      </div>

      <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject (Email only)</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="StrikeSignal Update" className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
            <span>Message Content (HTML allowed for email)</span>
          </label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows="6" className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="Type your message here..."></textarea>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Channels</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10" />
              <span className="text-sm text-slate-300 font-bold">Email All Users</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={telegram} onChange={e => setTelegram(e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10" />
              <span className="text-sm text-slate-300 font-bold">Telegram Channel</span>
            </label>
          </div>
        </div>
        <div className="pt-2">
          <button onClick={send} disabled={sending || !message || (!email && !telegram)} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
          {result && <span className="ml-4 text-sm font-bold text-slate-300">{result}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [apiSettings, setApiSettings] = useState({ sportmonksApiKey: '', geminiApiKey: '', resendApiKey: '', emailFrom: '', telegramBotToken: '', telegramChatId: '' });
  const [filterNoBookingCodes, setFilterNoBookingCodes] = useState(false);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => { fetch(`${API}/api/settings`).then(r => r.json()).then(d => {
    const { filterNoBookingCodes: fnbc, ...rest } = d;
    setApiSettings(rest);
    setFilterNoBookingCodes(!!fnbc);
  }).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    const body = { filterNoBookingCodes };
    Object.keys(apiSettings).forEach(k => { if (apiSettings[k] && !apiSettings[k].includes('•')) body[k] = apiSettings[k]; });
    const res = await fetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) setMsg('✅ Settings saved');
    else setMsg('❌ Error saving settings');
    setSaving(false);
  };

  const sendTest = async () => {
    setTestMsg('Sending...');
    const res = await fetch(`${API}/api/settings/test-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail }) });
    setTestMsg(res.ok ? '✅ Sent!' : '❌ Failed');
  };

  const Field = ({ label, k, placeholder }) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type="text" value={apiSettings[k] || ''} onChange={e => setApiSettings({ ...apiSettings, [k]: e.target.value })} placeholder={placeholder} className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2 text-sm outline-none transition-colors" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">Global API Settings</h2>
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 space-y-4">
        {msg && <div className="bg-slate-800/50 text-sm px-4 py-2 rounded-xl text-slate-300 font-bold">{msg}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Sportmonks API Key" k="sportmonksApiKey" placeholder="Enter key" />
          <Field label="Gemini AI API Key" k="geminiApiKey" placeholder="Enter key" />
          <Field label="Resend API Key (Email)" k="resendApiKey" placeholder="Enter key" />
          <Field label="Email From Address" k="emailFrom" placeholder="alerts@domain.com" />
          <Field label="Telegram Bot Token" k="telegramBotToken" placeholder="12345:ABCDE..." />
          <Field label="Telegram Chat ID" k="telegramChatId" placeholder="@channel or -100123" />
        </div>
        <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all mt-4">
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <h2 className="text-sm font-black text-white uppercase tracking-widest pt-4">Signal Filters</h2>
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-bold text-white">Only show signals with booking codes</p>
            <p className="text-xs text-slate-500 mt-0.5">When enabled, signals for matches not listed on SportyBet or Bet9ja are suppressed and won't appear on the Live page.</p>
          </div>
          <div className={`relative w-12 h-6 rounded-full transition-all shrink-0 ml-4 cursor-pointer ${
            filterNoBookingCodes ? 'bg-blue-600' : 'bg-slate-700'
          }`} onClick={() => setFilterNoBookingCodes(v => !v)}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              filterNoBookingCodes ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
        </label>
        <p className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5">
          ⚠️ If IzentBet is temporarily unreachable, enabling this will suppress <strong>all</strong> signals. Disable if signals stop appearing unexpectedly.
        </p>
        <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">
          {saving ? 'Saving...' : 'Save Filter Settings'}
        </button>
      </div>
    </div>
  );

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('ss_admin'));
  const [tab, setTab] = useState('chats');

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
      {/* Admin sidebar */}
      <aside className="w-56 bg-[#0d1527] border-r border-white/5 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-center px-4 border-b border-white/5">
          <img src="/logo.png" alt="SS Admin" className="h-6 w-auto" />
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => { sessionStorage.removeItem('ss_admin'); setAuthed(false); }}
            className="w-full text-red-500 hover:bg-red-500/10 text-sm font-semibold py-2 rounded-xl transition-all">Logout</button>
        </div>
      </aside>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {tab === 'chats' && <ChatsTab />}
        {tab === 'contacts' && <ContactsTab />}
        {tab === 'broadcast' && <BroadcastTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
