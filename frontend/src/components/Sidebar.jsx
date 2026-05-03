import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'live',      icon: '⚡', label: 'Live Signals' },
  { key: 'tradelog',  icon: '📋', label: 'Trade Log' },
  { key: 'schedule',  icon: '📅', label: 'Schedule' },
  { key: 'results',   icon: '🏆', label: 'Results' },
  { key: '$market', icon: '⚽', label: 'Automation' },
  { key: 'blog',      icon: '📝', label: 'Blog' },
  { key: 'settings',  icon: '⚙️',  label: 'Settings' },
];

export default function Sidebar({ page, setPage, user, onLogout, liveCount, collapsed, setCollapsed }) {
  const [sub, setSub] = useState({ plan: 'free', active: false });

  useEffect(() => {
    if (user?.id) {
      fetch(`${API}/api/subscription/status?userId=${user.id}&email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => setSub(data))
        .catch(console.error);
    }
  }, [user]);

  return (
    <>
      {/* Overlay on mobile when expanded */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setCollapsed(true)} />
      )}

      <aside className={`hidden md:flex fixed top-0 left-0 h-full z-30 flex-col bg-[#0d1527] border-r border-white/5 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-56'}`}>

        {/* Logo */}
        <div className={`flex flex-col items-center justify-center py-6 border-b border-white/5 shrink-0 ${collapsed ? 'px-2' : 'px-4'}`}>
          {!collapsed ? (
            <>
              <img 
                src="/logo.png" 
                alt="StrikeSignal" 
                className="w-[120px] h-auto mb-1"
                style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
              />
              <div className="text-[#3b82f6] text-[10px] font-medium tracking-wide">Live Goal Intelligence</div>
            </>
          ) : (
            <img 
              src="/logo.png" 
              alt="SS" 
              className="w-12 h-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
            />
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


          {collapsed && (
            <button onClick={() => setPage('$market')} title="$market"
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
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="truncate">{user?.name || 'Profile'}</span>
                  {sub.plan === 'pro' && sub.active ? (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Pro</span>
                  ) : (
                    <span className="bg-slate-500/20 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Free</span>
                  )}
                </div>
                {sub.plan === 'pro' && sub.active && sub.expiresAt && (
                  <div className="text-[9px] text-slate-600 mt-0.5">Expires: {new Date(sub.expiresAt).toLocaleDateString()}</div>
                )}
              </div>
            )}
          </button>

          {!collapsed && sub.plan !== 'pro' && (
            <div className="px-2 pb-1">
              <a href="/pricing" className="block w-full text-center text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest mt-1 mb-2">
                Upgrade to Pro →
              </a>
            </div>
          )}

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
