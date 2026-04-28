import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, ReferenceLine } from 'recharts';

const API = import.meta.env.VITE_API_URL;
const fmt = n => '₦' + Math.abs(Number(n)).toLocaleString('en-NG');
const DEFAULT_STAKE = 2000;

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const IconPercent = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
);
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="18" cy="15" r="1"/></svg>
);
const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);

// ── Period helpers ───────────────────────────────────────────────────────────
function getCutoff(period, customRange) {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.getTime();
    }
    case '7d': return now.getTime() - 7 * 86400000;
    case '30d': return now.getTime() - 30 * 86400000;
    case '60d': return now.getTime() - 60 * 86400000;
    case 'mtd': return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case 'all': return 0;
    case 'custom': {
      if (customRange?.from) return new Date(customRange.from).getTime();
      return 0;
    }
    default: return now.getTime() - 30 * 86400000;
  }
}

function getCustomEnd(customRange) {
  if (customRange?.to) {
    const d = new Date(customRange.to);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }
  return Date.now();
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, sub2, color = 'text-white', slim }) {
  return (
    <div className={`bg-[#0d1527] border border-white/5 rounded-2xl ${slim ? 'p-3' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`${slim ? 'text-[9px]' : 'text-[10px]'} font-black text-slate-500 uppercase tracking-widest`}>{label}</span>
        <span className="text-slate-600">{icon}</span>
      </div>
      <div className={`${slim ? 'text-xl' : 'text-2xl'} font-black ${color}`}>{value}</div>
      {sub && <div className={`${slim ? 'text-[10px]' : 'text-xs'} text-slate-500 mt-1 font-medium`}>{sub}</div>}
      {sub2 && <div className="text-[9px] text-slate-600 mt-0.5">{sub2}</div>}
    </div>
  );
}

// ── Small Stat Card (row 2) ─────────────────────────────────────────────────
function SmallStatCard({ label, value, sub, color = 'text-white', slim }) {
  return (
    <div className={`bg-[#0b1222] border border-white/5 rounded-2xl ${slim ? 'p-2.5' : 'p-4'}`}>
      <div className={`${slim ? 'text-[9px]' : 'text-[10px]'} font-black text-slate-500 uppercase tracking-widest mb-1.5`}>{label}</div>
      <div className={`${slim ? 'text-lg' : 'text-xl'} font-black ${color}`}>{value}</div>
      {sub && <div className={`${slim ? 'text-[10px]' : 'text-xs'} text-slate-500 mt-1 font-medium`}>{sub}</div>}
    </div>
  );
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-[#0d1527] border border-white/10 rounded-xl px-4 py-2 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`font-black text-sm ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{v >= 0 ? '+' : ''}{fmt(v)}</p>
    </div>
  );
};

// ── Flatline animation for empty states ─────────────────────────────────────
function FlatlinePulse() {
  return (
    <div className="flex items-center justify-center gap-1 my-2 opacity-40">
      <svg width="120" height="24" viewBox="0 0 120 24">
        <polyline points="0,12 30,12 38,4 42,20 46,8 50,16 54,12 120,12" fill="none" stroke="#3b82f6" strokeWidth="1.5">
          <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite"/>
        </polyline>
      </svg>
    </div>
  );
}

// ── Period tabs config ──────────────────────────────────────────────────────
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '60d', label: '60D' },
  { key: 'mtd', label: 'MTD' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

// ── Top-right header buttons ────────────────────────────────────────────────
const HEADER_BTNS = [
  { label: '📺 SS TV', action: () => window.open('https://youtube.com/@strikesignal', '_blank'), highlight: false },
  { label: '💬 Community', action: () => window.open('https://t.me/strikesignal', '_blank'), highlight: true },
  { label: '📖 Guides', action: () => {}, highlight: false },
  { label: '✉️ Contact', action: () => {}, highlight: false },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardPage({ user }) {
  const [period, setPeriod] = useState('30d');
  const [allSignals, setAllSignals] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slim, setSlim] = useState(() => localStorage.getItem('ss_slim_mode') === 'true');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const token = localStorage.getItem('ss_token');

  // Toggle slim mode
  const toggleSlim = () => {
    setSlim(v => {
      localStorage.setItem('ss_slim_mode', !v ? 'true' : 'false');
      return !v;
    });
  };

  // Fetch all signals + trades
  useEffect(() => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/results?period=monthly`).then(r => r.json()),
      fetch(`${API}/api/trades`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/signals`).then(r => r.json()).catch(() => []),
    ]).then(([res, tr, sigs]) => {
      setAllSignals(res.results || sigs || []);
      setTrades(Array.isArray(tr) ? tr : []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Filtered signals based on period ────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = getCutoff(period, customRange);
    const end = period === 'custom' ? getCustomEnd(customRange) : Date.now();
    const sourceData = user?.email === 'kodedmag@gmail.com' ? allSignals : trades;
    return sourceData.filter(s => {
      const t = new Date(s.created_at || s.date).getTime();
      return t >= cutoff && t <= end;
    });
  }, [allSignals, trades, period, customRange, user?.email]);

  // ── Calculated stats ────────────────────────────────────────────────────
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
    const roc = roi;

    return { wins, losses, totalTrades, strikeRate, avgOdds, totalPnL, unitsProfit, roi, roc };
  }, [filtered]);

  // ── Chart data (cumulative P&L by date) ─────────────────────────────────
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

  // ── Recent trades for right panel ───────────────────────────────────────
  const recentTrades = useMemo(() => {
    const count = slim ? 4 : 6;
    const resolved = filtered.filter(s => s.result !== 'pending');
    return resolved.slice(0, count);
  }, [filtered, slim]);

  // ── Greeting ────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ═══ HEADER TOP RIGHT BUTTONS ═══ */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-black text-white">Good {greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-1">Here's your performance overview</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {HEADER_BTNS.map(b => (
              <button key={b.label} onClick={b.action}
                style={{ height: 28, borderRadius: 999, fontSize: 12, padding: '4px 12px' }}
                className={`font-bold whitespace-nowrap transition-all ${
                  b.highlight
                    ? 'bg-[#1d4ed8] text-white hover:bg-blue-600'
                    : 'bg-[#1a2744] text-white/80 hover:bg-[#243354]'
                }`}>{b.label}</button>
            ))}
          </div>
        </div>

        {/* Sub-row: Live + Slim toggle */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.hash = '#live'}
              style={{ height: 26, borderRadius: 999, fontSize: 11, padding: '3px 10px' }}
              className="bg-[#1d4ed8] text-white font-bold flex items-center gap-1.5 hover:bg-blue-600 transition-all">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
            </button>
            <button onClick={toggleSlim}
              style={{ height: 26, borderRadius: 999, fontSize: 11, padding: '3px 10px' }}
              className={`font-bold transition-all ${slim ? 'bg-blue-600 text-white' : 'bg-[#1a2744] text-slate-400 hover:text-white'}`}>
              △ Slim
            </button>
          </div>
        </div>
      </div>

      {/* ═══ PERIOD FILTER TABS ═══ */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              period === p.key ? 'bg-blue-600 text-white' : 'bg-[#1a2744] text-slate-500 hover:text-white'
            }`}>{p.label}</button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={customRange.from} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))}
            className="bg-[#0d1527] border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none" />
          <span className="text-slate-600 text-xs font-bold">to</span>
          <input type="date" value={customRange.to} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))}
            className="bg-[#0d1527] border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none" />
        </div>
      )}

      {/* ═══ STAT CARDS — ROW 1 ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard slim={slim}
          icon={<IconActivity />}
          label="Total Trades"
          value={stats.totalTrades}
          sub={<span><span className="text-emerald-400">{stats.wins}W</span> — <span className="text-red-400">{stats.losses}L</span></span>}
        />
        <StatCard slim={slim}
          icon={<IconPercent />}
          label="Strike Rate"
          value={`${stats.strikeRate}%`}
          color={Number(stats.strikeRate) >= 50 ? 'text-emerald-400' : 'text-red-400'}
          sub="Win percentage"
        />
        <StatCard slim={slim}
          icon={<IconWallet />}
          label="Total P&L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}${fmt(stats.totalPnL)}`}
          color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub={stats.totalPnL >= 0 ? '↗ Net Profit' : '↘ Net Loss'}
          sub2="Attributed to entry date · real trades only"
        />
        <StatCard slim={slim}
          icon={<IconTarget />}
          label="Units Profit"
          value={stats.totalTrades > 0 ? stats.unitsProfit.toFixed(1) : '—'}
          color={stats.unitsProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub={stats.totalTrades > 0 ? `@ ${fmt(DEFAULT_STAKE)} avg stake · ${stats.avgOdds.toFixed(2)} avg odds` : 'No trades yet'}
        />
      </div>

      {/* ═══ STAT CARDS — ROW 2 ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <SmallStatCard slim={slim}
          label="Avg Odds"
          value={stats.totalTrades > 0 ? stats.avgOdds.toFixed(2) : '—'}
          sub={`${fmt(DEFAULT_STAKE)} avg stake`}
        />
        <SmallStatCard slim={slim}
          label="ROI"
          value={stats.totalTrades > 0 ? `${stats.roi}%` : '—'}
          color={Number(stats.roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub="P&L ÷ total staked"
        />
        <SmallStatCard slim={slim}
          label="ROC"
          value={stats.totalTrades > 0 ? `${stats.roc}%` : '—'}
          color={Number(stats.roc) >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub="P&L ÷ peak capital at risk"
        />
      </div>

      {/* ═══ PERFORMANCE SECTION — Two panels ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT: Chart (60%) */}
        <div className={`lg:col-span-3 bg-[#0d1527] border border-white/5 rounded-2xl ${slim ? 'p-4' : 'p-6'}`}>
          <div className="mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Cumulative Profit &amp; Loss</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Last {period === 'all' ? 'all time' : period.toUpperCase()} · performance tracking</p>
          </div>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ height: slim ? 140 : 200 }}>
              <FlatlinePulse />
              <p className="text-slate-600 text-sm font-semibold mt-2">No trades logged yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={slim ? 140 : 200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="posFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} fill="url(#posFill)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RIGHT: Recent Trades (40%) */}
        <div className={`lg:col-span-2 bg-[#0d1527] border border-white/5 rounded-2xl ${slim ? 'p-4' : 'p-6'} flex flex-col`}>
          <div className="mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">📋 Recent Trades</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Last {slim ? 4 : 6} logged positions</p>
          </div>
          {recentTrades.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <FlatlinePulse />
              <p className="text-slate-600 text-sm font-semibold mt-2">No trades logged yet.</p>
              <p className="text-slate-700 text-xs mt-1">Head to Live to start.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-0 divide-y divide-white/5">
              {recentTrades.map(r => {
                const isWin = r.result === 'win';
                const odds = r.betOdds || r.odds || 1.68;
                const pnl = isWin ? DEFAULT_STAKE * (Number(odds) - 1) : -DEFAULT_STAKE;
                return (
                  <div key={r.id} className={`flex items-center gap-3 ${slim ? 'py-2' : 'py-3'}`}>
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
                      {pnl >= 0 ? '+' : ''}{fmt(pnl)}
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
