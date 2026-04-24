import React from 'react';

export default function Dashboard({ liveMatches, signals, stats, onTabChange }) {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📡', value: liveMatches.length, label: 'Live Matches',   color: 'text-blue-400',   bg: 'from-blue-500/10 to-blue-600/5',    border: 'border-blue-500/20' },
          { icon: '⚡', value: signals.length,      label: 'Active Signals', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20' },
          { icon: '📈', value: `${stats.strikeRate}%`, label: 'Strike Rate (30d)', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20' },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 text-center`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
            <div className="text-slate-500 text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Signal alert */}
      {signals.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-blue-300 font-bold text-sm">⚡ {signals.length} betting signal{signals.length > 1 ? 's' : ''} detected</p>
            <p className="text-slate-500 text-xs mt-0.5">High-confidence opportunities are available now</p>
          </div>
          <button
            onClick={() => onTabChange('opportunities')}
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
          >
            View →
          </button>
        </div>
      )}

      {/* Live matches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Matches
          </h3>
          <span className="text-slate-600 text-xs">{liveMatches.length} active</span>
        </div>

        {liveMatches.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-slate-700 text-2xl mb-2">📡</div>
            <div className="text-slate-600 text-sm">No live matches right now</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {liveMatches.map(m => {
              const hasSignal = signals.some(s => s.fixtureId === m.fixtureId);
              return (
                <li
                  key={m.fixtureId}
                  onClick={() => onTabChange('opportunities')}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                    hasSignal ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/60'
                  }`}
                >
                  {hasSignal && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{m.home}</span>
                      <span className="text-slate-600 text-xs">vs</span>
                      <span className="font-bold text-white text-sm">{m.away}</span>
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{m.league} · {m.minute}'</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-white font-bold font-mono">{m.score.home}-{m.score.away}</span>
                    <span className="text-blue-400 text-xs font-semibold">xG {m.xG.total.toFixed(2)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

