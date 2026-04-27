import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'live',      icon: '⚡', label: 'Live Signals' },
  { key: 'tradelog',  icon: '📋', label: 'Trade Log' },
  { key: 'schedule',  icon: '📅', label: 'Schedule' },
  { key: 'results',   icon: '🏆', label: 'Results' },
  { key: 'sportybet', icon: '⚽', label: 'Sportybet' },
  { key: 'blog',      icon: '📝', label: 'Blog & News' },
  { key: 'settings',  icon: '⚙️',  label: 'Settings' },
];

export default function Sidebar({ page, setPage, user, onLogout, liveCount, collapsed, setCollapsed }) {
  const [sbConnected, setSbConnected] = useState(false);
  const [sbBalance, setSbBalance] = useState("₦0.00");

  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) return;
    fetch(`${API}/api/sportybet/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setSbConnected(d.connected);
          setSbBalance(d.balanceFormatted || "₦0.00");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sbConnected) return;
    const interval = setInterval(() => {
      const token = localStorage.getItem('ss_token');
      if (!token) return;
      fetch(`${API}/api/sportybet/balance`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.balanceFormatted) setSbBalance(data.balanceFormatted);
        })
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sbConnected]);

  return (
    <>
      {/* Overlay on mobile when expanded */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setCollapsed(true)} />
      )}

      <aside className={`hidden md:flex fixed top-0 left-0 h-full z-30 flex-col bg-[#0d1527] border-r border-white/5 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-56'}`}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
          {!collapsed ? (
            <img src="/logo.png" alt="StrikeSignal" className="h-8 w-auto" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-black shrink-0 mx-auto">⚡</div>
          )}
        </div>

        {/* Live badge */}
        {!collapsed && liveCount > 0 && (
          <div className="mx-3 mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-emerald-400 text-xs font-bold">{liveCount} Live Matches</span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)}
              title={collapsed ? n.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group
                ${page === n.key
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <span className="text-lg shrink-0">{n.icon}</span>
              {!collapsed && <span className="truncate">{n.label}</span>}
              {!collapsed && n.key === 'live' && liveCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">{liveCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Bottom section ── */}
        <div className="border-t border-white/5 p-2 space-y-1.5 shrink-0">

          {/* Sportybet balance widget */}
          {!collapsed && (
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl px-3 py-2.5 mb-1">
              <div className="text-[9px] font-black text-teal-500 uppercase tracking-widest mb-1.5">⚽ SPORTYBET</div>
              {sbConnected ? (
                <div className="space-y-0.5">
                  <div className="text-[11px] text-emerald-400 font-bold">● Available: {sbBalance}</div>
                  <div className="text-[11px] text-red-400 font-bold">↘ Exposure: ₦0.00</div>
                </div>
              ) : (
                <button onClick={() => setPage('sportybet')}
                  className="text-[11px] text-amber-500 hover:text-amber-400 font-bold transition-colors">
                  ⚽ Connect Sportybet
                </button>
              )}
            </div>
          )}
          {collapsed && (
            <button onClick={() => setPage('sportybet')} title="Sportybet"
              className="w-full flex items-center justify-center py-2 rounded-xl text-slate-600 hover:text-teal-400 transition-all">
              <span className="text-sm">💰</span>
            </button>
          )}

          {/* User profile */}
          <button onClick={() => setPage('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${page === 'profile' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            {!collapsed && <span className="truncate">{user?.name || 'Profile'}</span>}
          </button>

          {/* Sign Out */}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all">
            <span className="text-lg shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse */}
          <button onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 transition-all">
            <span className="text-base shrink-0">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Version */}
          {!collapsed && (
            <div className="text-center pt-1 pb-0.5">
              <span className="text-[9px] text-slate-700 font-medium">StrikeSignal v1.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
