import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import AiChatTab from '../components/AiChatTab';

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
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <img 
            src="/logo.png" 
            alt="StrikeSignal" 
            className="w-[140px] h-auto mb-2"
          />
          <p className="text-[#3b82f6] text-[10px] font-medium tracking-wide">Admin Access</p>
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
  { key: 'dashboard', icon: '📊', label: 'Dashboard Overview' },
  { key: 'blog', icon: '📝', label: 'Blog Manager' },
  { key: 'chats', icon: '💬', label: 'Live Chats' },
  { key: 'ai-chat', icon: '🤖', label: 'AI Betting Chat' },
  { key: 'users', icon: '👥', label: 'Users' },
  { key: 'broadcast', icon: '📣', label: 'Broadcasts' },
  { key: 'contacts', icon: '📧', label: 'Contact Messages' },
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

// ── Dashboard Overview Tab ───────────────────────────────────────────────────
const DEFAULT_STAKE = 2000;
const fmtN = n => '₦' + Math.abs(Number(n)).toLocaleString('en-NG');

const AdminChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-[#0d1527] border border-white/10 rounded-xl px-4 py-2 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`font-black text-sm ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{v >= 0 ? '+' : ''}{fmtN(v)}</p>
    </div>
  );
};

const ADMIN_PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '60d', label: '60D' },
  { key: 'mtd', label: 'MTD' },
  { key: 'all', label: 'All' },
];

function getAdminCutoff(period) {
  const now = new Date();
  switch (period) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    case '7d': return now.getTime() - 7 * 86400000;
    case '30d': return now.getTime() - 30 * 86400000;
    case '60d': return now.getTime() - 60 * 86400000;
    case 'mtd': return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case 'all': return 0;
    default: return now.getTime() - 30 * 86400000;
  }
}

function DashboardTab() {
  const [allSignals, setAllSignals] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/results?period=monthly`).then(r => r.json()),
      fetch(`${API}/api/signals`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/admin/users`).then(r => r.json()).catch(() => [])
    ]).then(([res, sigs, u]) => {
      setAllSignals(res.results || sigs || []);
      setUserCount(Array.isArray(u) ? u.length : 0);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const cutoff = getAdminCutoff(period);
    return allSignals.filter(s => new Date(s.created_at).getTime() >= cutoff);
  }, [allSignals, period]);

  const stats = useMemo(() => {
    const resolved = filtered.filter(s => s.result !== 'pending');
    const wins = resolved.filter(s => s.result === 'win').length;
    const losses = resolved.filter(s => s.result === 'loss').length;
    const totalTrades = resolved.length;
    const strikeRate = totalTrades > 0 ? (wins / totalTrades * 100).toFixed(1) : '0.0';
    const oddsArr = resolved.map(s => s.betOdds || s.odds).filter(o => o && !isNaN(o));
    const avgOdds = oddsArr.length > 0 ? oddsArr.reduce((a, b) => a + Number(b), 0) / oddsArr.length : 1.68;
    const totalPnL = wins * (DEFAULT_STAKE * (avgOdds - 1)) - losses * DEFAULT_STAKE;
    const unitsProfit = totalTrades > 0 ? totalPnL / DEFAULT_STAKE : 0;
    const totalStaked = totalTrades * DEFAULT_STAKE;
    const roi = totalStaked > 0 ? (totalPnL / totalStaked * 100).toFixed(1) : '0.0';
    return { wins, losses, totalTrades, strikeRate, avgOdds, totalPnL, unitsProfit, roi };
  }, [filtered]);

  const chartData = useMemo(() => {
    const resolved = filtered.filter(s => s.result !== 'pending');
    if (resolved.length === 0) return [];
    const sorted = [...resolved].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const map = {};
    const oddsArr = resolved.map(s => s.betOdds || s.odds).filter(o => o && !isNaN(o));
    const avgOdds = oddsArr.length > 0 ? oddsArr.reduce((a, b) => a + Number(b), 0) / oddsArr.length : 1.68;
    sorted.forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!map[d]) map[d] = 0;
      if (s.result === 'win') map[d] += DEFAULT_STAKE * (avgOdds - 1);
      else if (s.result === 'loss') map[d] -= DEFAULT_STAKE;
    });
    let cum = 0;
    return Object.entries(map).map(([date, pnl]) => {
      cum += pnl;
      return { date, pnl: Math.round(pnl), cumulative: Math.round(cum) };
    });
  }, [filtered]);

  const recentTrades = useMemo(() => {
    return filtered.filter(s => s.result !== 'pending').slice(0, 6);
  }, [filtered]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Admin Dashboard 📊</h1>
        <p className="text-slate-500 text-sm mt-1">Platform-wide performance overview</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ADMIN_PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              period === p.key ? 'bg-blue-600 text-white' : 'bg-[#1a2744] text-slate-500 hover:text-white'
            }`}>{p.label}</button>
        ))}
      </div>

      {/* Row 1: Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered Users</span>
            <span className="text-slate-600">👥</span>
          </div>
          <div className="text-2xl font-black text-blue-400">{userCount}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Platform accounts</div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Trades</span>
            <span className="text-slate-600">📈</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.totalTrades}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium"><span className="text-emerald-400">{stats.wins}W</span> — <span className="text-red-400">{stats.losses}L</span></div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strike Rate</span>
            <span className="text-slate-600">%</span>
          </div>
          <div className={`text-2xl font-black ${Number(stats.strikeRate) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.strikeRate}%</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Win percentage</div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total P&L</span>
            <span className="text-slate-600">💰</span>
          </div>
          <div className={`text-2xl font-black ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.totalPnL >= 0 ? '+' : ''}{fmtN(stats.totalPnL)}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{stats.totalPnL >= 0 ? '↗ Net Profit' : '↘ Net Loss'}</div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Units Profit</span>
            <span className="text-slate-600">🎯</span>
          </div>
          <div className={`text-2xl font-black ${stats.unitsProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.totalTrades > 0 ? stats.unitsProfit.toFixed(1) : '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{stats.totalTrades > 0 ? `@ ${fmtN(DEFAULT_STAKE)} avg stake` : 'No trades yet'}</div>
        </div>
      </div>

      {/* Row 2: Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0b1222] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Avg Odds</div>
          <div className="text-xl font-black text-white">{stats.totalTrades > 0 ? stats.avgOdds.toFixed(2) : '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{fmtN(DEFAULT_STAKE)} avg stake</div>
        </div>
        <div className="bg-[#0b1222] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ROI</div>
          <div className={`text-xl font-black ${Number(stats.roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.totalTrades > 0 ? `${stats.roi}%` : '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">P&L ÷ total staked</div>
        </div>
        <div className="bg-[#0b1222] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ROC</div>
          <div className={`text-xl font-black ${Number(stats.roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.totalTrades > 0 ? `${stats.roi}%` : '—'}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">P&L ÷ peak capital at risk</div>
        </div>
      </div>

      {/* Row 3: Chart + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart */}
        <div className="lg:col-span-3 bg-[#0d1527] border border-white/5 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Cumulative Profit &amp; Loss</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Last {period === 'all' ? 'all time' : period.toUpperCase()} · performance tracking</p>
          </div>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ height: 200 }}>
              <div className="flex items-center justify-center gap-1 my-2 opacity-40">
                <svg width="120" height="24" viewBox="0 0 120 24">
                  <polyline points="0,12 30,12 38,4 42,20 46,8 50,16 54,12 120,12" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                    <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite"/>
                  </polyline>
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-semibold mt-2">No trades logged yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="adminPosFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<AdminChartTooltip />} />
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} fill="url(#adminPosFill)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Trades */}
        <div className="lg:col-span-2 bg-[#0d1527] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">📋 Recent Trades</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Last 6 logged positions</p>
          </div>
          {recentTrades.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="flex items-center justify-center gap-1 my-2 opacity-40">
                <svg width="120" height="24" viewBox="0 0 120 24">
                  <polyline points="0,12 30,12 38,4 42,20 46,8 50,16 54,12 120,12" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                    <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite"/>
                  </polyline>
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-semibold mt-2">No trades logged yet.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-0 divide-y divide-white/5">
              {recentTrades.map(r => {
                const isWin = r.result === 'win';
                const odds = r.betOdds || r.odds || 1.68;
                const pnl = isWin ? DEFAULT_STAKE * (Number(odds) - 1) : -DEFAULT_STAKE;
                return (
                  <div key={r.id} className="flex items-center gap-3 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isWin ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>{isWin ? '✓' : '✕'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-bold truncate">{r.home} vs {r.away} · {r.betType}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {r.minute}' · {r.confidence} confidence
                      </div>
                    </div>
                    <div className={`text-xs font-black shrink-0 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}{fmtN(pnl)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Blog Manager Tab ────────────────────────────────────────────────────────
function BlogManagerTab() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await fetch(`${API}/api/blog`);
      if (res.ok) setPosts(await res.json());
    } catch {}
  };

  useEffect(() => { loadPosts(); }, []);

  const savePost = async () => {
    if (!title || !content) return;
    setLoading(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API}/api/admin/blog/${editing.id}` : `${API}/api/admin/blog`;
    try {
      await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      setTitle(''); setContent(''); setEditing(null);
      loadPosts();
    } catch {}
    setLoading(false);
  };

  const deletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await fetch(`${API}/api/admin/blog/${id}`, { method: 'DELETE' });
    loadPosts();
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">Blog Manager</h2>
      
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase">{editing ? 'Edit Post' : 'Create New Post'}</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post Title" className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
        <textarea value={content} onChange={e => setContent(e.target.value)} rows="8" placeholder="Post Content (HTML allowed)" className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none font-mono text-xs"></textarea>
        <div className="flex gap-2">
          <button onClick={savePost} disabled={loading || !title || !content} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all">
            {loading ? 'Saving...' : (editing ? 'Update Post' : 'Publish Post')}
          </button>
          {editing && <button onClick={() => { setEditing(null); setTitle(''); setContent(''); }} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase">Published Posts ({posts.length})</h3>
        {posts.map(p => (
          <div key={p.id} className="bg-[#0d1527] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">{p.title}</div>
              <div className="text-xs text-slate-500 mt-1">{new Date(p.created_at).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(p); setTitle(p.title); setContent(p.content); window.scrollTo(0, 0); }} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600/30">Edit</button>
              <button onClick={() => deletePost(p.id)} className="text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600/30">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);    // user detail / dashboard modal
  const [editing, setEditing] = useState(null);       // edit modal
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const loadUsers = async () => {
    try { const r = await fetch(`${API}/api/admin/users`); if (r.ok) setUsers(await r.json()); } catch {}
  };
  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    if (statusFilter !== 'all' && (u.status || 'active') !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const setStatus = async (userId, status) => {
    setActionMsg('');
    const res = await fetch(`${API}/api/admin/users/${userId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) { setActionMsg(`✅ User ${status}`); loadUsers(); }
    else setActionMsg('❌ Failed to update status');
  };

  const deleteUser = async (userId) => {
    const res = await fetch(`${API}/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) { setActionMsg('✅ User deleted'); setConfirmDelete(null); loadUsers(); }
    else setActionMsg('❌ Failed to delete user');
  };

  const saveEdit = async () => {
    setEditMsg('');
    const res = await fetch(`${API}/api/admin/users/${editing.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, email: editEmail })
    });
    if (res.ok) { setEditMsg('✅ Saved'); loadUsers(); setTimeout(() => setEditing(null), 800); }
    else { const d = await res.json(); setEditMsg(`❌ ${d.error || 'Failed'}`); }
  };

  const statusBadge = (s) => {
    const status = s || 'active';
    const map = {
      active: 'bg-emerald-500/15 text-emerald-400',
      suspended: 'bg-amber-500/15 text-amber-400',
      banned: 'bg-red-500/15 text-red-400',
    };
    return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${map[status] || map.active}`}>{status}</span>;
  };

  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const bannedCount = users.filter(u => u.status === 'banned').length;

  return (
    <div className="p-6 space-y-5">
      {/* Header Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">User Management</h2>
        <div className="flex gap-2">
          <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">{activeCount} Active</span>
          <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full">{suspendedCount} Suspended</span>
          <span className="text-[11px] font-bold bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full">{bannedCount} Banned</span>
          <span className="text-[11px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">{users.length} Total</span>
        </div>
      </div>

      {actionMsg && <div className="text-sm font-bold text-slate-300 bg-[#0d1527] border border-white/5 rounded-xl px-4 py-2">{actionMsg}</div>}

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] bg-[#0d1527] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
        <div className="flex gap-1">
          {[['all', 'All'], ['active', 'Active'], ['suspended', 'Suspended'], ['banned', 'Banned']].map(([k, l]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === k ? 'bg-blue-600 text-white' : 'bg-[#0d1527] text-slate-500 hover:text-white border border-white/5'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-600">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">{statusBadge(u.status)}</td>
                  <td className="p-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setSelected(u)} className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg font-bold hover:bg-blue-600/30 transition-all">View</button>
                      <button onClick={() => { setEditing(u); setEditName(u.name); setEditEmail(u.email); setEditMsg(''); }} className="text-[10px] bg-slate-600/20 text-slate-300 px-2 py-1 rounded-lg font-bold hover:bg-slate-600/30 transition-all">Edit</button>
                      {(u.status || 'active') === 'active' && (
                        <button onClick={() => setStatus(u.id, 'suspended')} className="text-[10px] bg-amber-600/20 text-amber-400 px-2 py-1 rounded-lg font-bold hover:bg-amber-600/30 transition-all">Suspend</button>
                      )}
                      {(u.status || 'active') === 'active' && (
                        <button onClick={() => setStatus(u.id, 'banned')} className="text-[10px] bg-red-600/20 text-red-400 px-2 py-1 rounded-lg font-bold hover:bg-red-600/30 transition-all">Ban</button>
                      )}
                      {(u.status === 'suspended' || u.status === 'banned') && (
                        <button onClick={() => setStatus(u.id, 'active')} className="text-[10px] bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-lg font-bold hover:bg-emerald-600/30 transition-all">Activate</button>
                      )}
                      <button onClick={() => setConfirmDelete(u)} className="text-[10px] bg-red-600/20 text-red-400 px-2 py-1 rounded-lg font-bold hover:bg-red-600/30 transition-all">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View User Dashboard Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0d1527] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">User Dashboard</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {selected.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-white font-bold text-lg">{selected.name}</div>
                <div className="text-slate-400 text-sm">{selected.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Account Status</div>
                <div className="text-sm font-bold">{statusBadge(selected.status)}</div>
              </div>
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Member Since</div>
                <div className="text-sm font-bold text-white">{new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">User ID</div>
                <div className="text-sm font-mono text-slate-400">{selected.id}</div>
              </div>
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Notifications</div>
                <div className="text-sm font-bold text-white">{selected.notifications ? '🔔 Enabled' : '🔕 Disabled'}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setEditing(selected); setEditName(selected.name); setEditEmail(selected.email); setEditMsg(''); setSelected(null); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all">Edit User</button>
              {(selected.status || 'active') === 'active' && (
                <button onClick={() => { setStatus(selected.id, 'suspended'); setSelected(null); }} className="bg-amber-600/20 text-amber-400 font-bold py-2 px-4 rounded-xl text-sm border border-amber-500/20 hover:bg-amber-600/30 transition-all">Suspend</button>
              )}
              {(selected.status || 'active') === 'active' && (
                <button onClick={() => { setStatus(selected.id, 'banned'); setSelected(null); }} className="bg-red-600/20 text-red-400 font-bold py-2 px-4 rounded-xl text-sm border border-red-500/20 hover:bg-red-600/30 transition-all">Ban</button>
              )}
              {(selected.status === 'suspended' || selected.status === 'banned') && (
                <button onClick={() => { setStatus(selected.id, 'active'); setSelected(null); }} className="bg-emerald-600/20 text-emerald-400 font-bold py-2 px-4 rounded-xl text-sm border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">Activate</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0d1527] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Edit User</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
            {editMsg && <div className="text-sm font-bold text-slate-300">{editMsg}</div>}
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">Save Changes</button>
              <button onClick={() => setEditing(null)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0d1527] border border-red-500/20 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-black text-white mb-2">Delete User Account?</h3>
              <p className="text-slate-400 text-sm">Are you sure you want to permanently delete <strong className="text-white">{confirmDelete.name}</strong>'s account? This action cannot be undone.</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => deleteUser(confirmDelete.id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">Yes, Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
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
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('ss_admin'));
  const [tab, setTab] = useState('dashboard');

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
      {/* Admin sidebar */}
      <aside className="w-56 bg-[#0d1527] border-r border-white/5 flex flex-col shrink-0">
        <div className="flex flex-col items-center justify-center py-6 border-b border-white/5">
          <img 
            src="/logo.png" 
            alt="SS Admin" 
            className="w-[100px] h-auto mb-1"
            style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
          />
          <div className="text-[#3b82f6] text-[10px] font-medium tracking-wide">Admin Panel</div>
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
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'blog' && <BlogManagerTab />}
        {tab === 'chats' && <ChatsTab />}
        {tab === 'ai-chat' && <AiChatTab />}
        {tab === 'contacts' && <ContactsTab />}
        {tab === 'broadcast' && <BroadcastTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
