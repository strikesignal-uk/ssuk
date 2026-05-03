import React, { useState } from 'react';

export default function TopBar({ page, user, onLogout, liveCount, sidebarCollapsed, setSidebarCollapsed }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const labels = { dashboard:'Dashboard', live:'Live Signals', tradelog:'Trade Log', schedule:'Schedule', results:'Results', $market: '$market', settings:'Settings', profile:'Profile' };
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0a0f1e]/90 backdrop-blur border-b border-white/5 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarCollapsed(c => !c)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <span className="text-white font-bold text-sm">{labels[page] || 'StrikeSignal'}</span>
      </div>
      <div className="flex items-center gap-2">
        {liveCount > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold">{liveCount} LIVE</span>
          </div>
        )}
        {user && (
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-1.5 border border-white/5 transition-all">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-slate-300 text-xs font-medium">{user.name}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#0d1527] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
