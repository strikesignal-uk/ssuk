import React from 'react';

const PERIODS = [
  { key: 'daily',   label: 'Today',      icon: '📅' },
  { key: 'weekly',  label: 'This Week',  icon: '📆' },
  { key: 'monthly', label: 'This Month', icon: '🗓️' },
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(results) {
  const groups = {};
  for (const r of results) {
    const key = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return Object.entries(groups);
}

const RESULT_CONFIG = {
  win:     { icon: '✓', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'WIN' },
  loss:    { icon: '✕', bg: 'bg-red-500/10 border-red-500/30',         text: 'text-red-400',     label: 'LOSS' },
  pending: { icon: '⏳', bg: 'bg-amber-500/10 border-amber-500/30',     text: 'text-amber-400',   label: 'PENDING' },
};

export default function Results({ results, stats, period, onPeriodChange }) {
  return (
    <div className="space-y-5">
      {/* Period tabs */}
      <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => onPeriodChange(p.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${
              period === p.key
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: 'text-white' },
          { label: 'Wins',        value: stats.wins,        color: 'text-emerald-400' },
          { label: 'Losses',      value: stats.losses,      color: 'text-red-400' },
          { label: 'Strike Rate', value: `${stats.strikeRate}%`, color: 'text-blue-400' },
        ].map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Win Rate</span>
          <span className="text-sm font-bold text-white">{stats.strikeRate}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${stats.strikeRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          <span>{stats.wins}W · {stats.losses}L{stats.pending > 0 ? ` · ${stats.pending}P` : ''}</span>
          <span>{stats.total} signals</span>
        </div>
      </div>

      {/* Date-grouped results */}
      {results.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-4">📭</div>
          <div className="text-white font-semibold">No signals for this period</div>
          <div className="text-slate-500 text-sm mt-1">Signals appear here after live matches</div>
        </div>
      ) : (
        groupByDate(results).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-3 px-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{date}</div>
              <div className="flex-1 h-px bg-slate-800" />
              <div className="text-xs text-slate-600">{items.length} signal{items.length > 1 ? 's' : ''}</div>
            </div>

            <div className="space-y-2">
              {items.map(r => {
                const rc = RESULT_CONFIG[r.result] || RESULT_CONFIG.pending;
                return (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      {/* Result badge */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${rc.bg} ${rc.text}`}>
                        {rc.icon}
                      </div>

                      {/* Match info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{r.home} vs {r.away}</span>
                          <span className="text-slate-600 text-xs font-mono">{r.score?.home ?? 0}-{r.score?.away ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                          <span>{r.league}</span>
                          <span>·</span>
                          <span>{formatTime(r.created_at)}</span>
                          <span>·</span>
                          <span>{r.minute}'</span>
                        </div>
                      </div>

                      {/* Bet type + result label + Bet link */}
                      <div className="flex-shrink-0 flex items-center gap-4 text-right">
                        <div>
                          <div className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700">{r.betType}</div>
                          <div className={`text-xs font-bold mt-1 ${rc.text}`}>{rc.label}</div>
                        </div>

                        {/* Booking Codes Column */}
                        <div className="flex flex-col items-end gap-1 border-l border-slate-800 pl-4 ml-2">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Book Bet</div>
                          {r.$market_bet_link ? (
                            <button
                              onClick={() => window.open(r.$market_bet_link, '_blank')}
                              className="flex items-center gap-1 bg-[#16a34a] hover:bg-green-600 text-white px-2 py-1 rounded-md text-[10px] font-bold transition-colors"
                              title={`$market code: ${r.$market_share_code}`}
                            >
                              ⚽ <span>$market</span>
                            </button>
                          ) : null}
                          {r.$market_code ? (
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(r.$market_code).catch(() => {});
                                window.open(`https://web.$market.com/Sport/Coupon/${r.$market_code}`, '_blank');
                              }}
                              className="flex items-center gap-1 bg-[#007b5e] hover:bg-emerald-700 text-white px-2 py-1 rounded-md text-[10px] font-bold transition-colors"
                              title={`$market code: ${r.$market_code}`}
                            >
                              🎯 <span>$market</span>
                            </button>
                          ) : null}
                          {!r.$market_bet_link && !r.$market_code && (
                            <span className="text-slate-600 font-bold text-sm">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}



