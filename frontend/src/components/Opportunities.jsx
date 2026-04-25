import React, { useState } from 'react';

const CONFIDENCE_CONFIG = {
  high:   { label: 'High',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     dot: 'bg-amber-400' },
  low:    { label: 'Low',    color: 'text-slate-400',   bg: 'bg-slate-700/40 border-slate-600/30',     dot: 'bg-slate-400' },
};

function StatChip({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs ${highlight ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
      <span className={`font-bold text-sm ${highlight ? 'text-blue-300' : 'text-slate-200'}`}>{value}</span>
      <span className="text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

export default function Opportunities({ signals, liveMatches }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Betting Signals</h2>
          <p className="text-slate-500 text-sm mt-0.5">{signals.length} active · {liveMatches.length} live matches monitored</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4">💡</div>
          <h3 className="text-white font-semibold mb-1">No active signals</h3>
          <p className="text-slate-500 text-sm">Signals appear here when live matches meet our criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map(signal => {
            const conf = CONFIDENCE_CONFIG[signal.confidence] || CONFIDENCE_CONFIG.low;
            const isOpen = expanded === signal.id;
            return (
              <div
                key={signal.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all"
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : signal.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Confidence dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${conf.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{signal.home}</span>
                        <span className="text-slate-600 text-xs">vs</span>
                        <span className="font-bold text-white text-base">{signal.away}</span>
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">{signal.minute}'</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate">{signal.league}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    {/* Live score */}
                    <div className="text-center">
                      <div className="text-white font-bold text-xl font-mono leading-none">{signal.score?.home ?? 0} - {signal.score?.away ?? 0}</div>
                      <div className="text-slate-600 text-xs mt-0.5">Score</div>
                    </div>
                    {/* Confidence badge */}
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold ${conf.bg} ${conf.color}`}>
                      {conf.label}
                    </div>
                    {/* Expand arrow */}
                    <svg className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Bet Banner */}
                <div className="mx-4 mb-4 bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-blue-400 text-lg flex-shrink-0">{signal.aiEnhanced ? '🤖' : '⚡'}</span>
                    <div>
                      <div className="text-white font-bold text-sm">{signal.betType}</div>
                      <div className="text-slate-400 text-xs">{signal.aiEnhanced ? 'AI-Enhanced Prediction' : 'Rule-Based Signal'}</div>
                    </div>
                  </div>
                  {signal.betOdds && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-emerald-400 font-bold text-xl">{signal.betOdds.toFixed(2)}</div>
                      <div className="text-slate-500 text-xs">odds</div>
                    </div>
                  )}
                </div>

                {/* Stats chips */}
                <div className="px-4 pb-4 flex gap-2 flex-wrap">
                  <StatChip label="xG Total" value={signal.xG?.total?.toFixed(2) ?? '—'} highlight />
                  <StatChip label="xG Home" value={signal.xG?.home?.toFixed(2) ?? '—'} />
                  <StatChip label="xG Away" value={signal.xG?.away?.toFixed(2) ?? '—'} />
                  <StatChip label="Shots" value={signal.shots ?? '—'} />
                  <StatChip label="Dng Attacks" value={signal.dangerAttacks ?? '—'} />
                  <StatChip label="Pressure" value={signal.pressure ?? '—'} />
                </div>

                {/* Expanded: reason + AI insight */}
                {isOpen && (
                  <div className="border-t border-slate-800 px-4 py-4 space-y-3">
                    {signal.reason && (
                      <div className="bg-slate-800/60 rounded-xl p-3">
                        <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Analysis</div>
                        <p className="text-slate-300 text-sm leading-relaxed">{signal.reason}</p>
                      </div>
                    )}
                    {signal.aiInsight && (
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                        <div className="text-violet-400 text-xs font-semibold uppercase tracking-wide mb-1">🤖 AI Insight</div>
                        <p className="text-slate-300 text-sm leading-relaxed">{signal.aiInsight}</p>
                      </div>
                    )}
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>Expected: <span className="text-slate-300 font-medium">{signal.expectedScore}</span></span>
                      <span>·</span>
                      <span>xG Gap: <span className="text-slate-300 font-medium">{signal.xGGap?.toFixed(2) ?? '—'}</span></span>
                    </div>
                  </div>
                )}

                {/* Booking Codes Section */}
                {(signal.sportybet?.betLink || signal.bookingCodes?.bet9ja || signal.sportybet?.shareCode) ? (
                  <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Book This Bet</div>
                    <div className="flex gap-2 flex-wrap">
                      {/* SportyBet */}
                      {signal.sportybet?.betLink && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(signal.sportybet.betLink, '_blank'); }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-[#16a34a] hover:bg-green-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-colors"
                          title={`SportyBet code: ${signal.sportybet.shareCode}`}
                        >
                          <span>⚽</span>
                          <span>SportyBet</span>
                          {signal.sportybet.shareCode && (
                            <span className="bg-green-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono">{signal.sportybet.shareCode}</span>
                          )}
                        </button>
                      )}
                      {/* Bet9ja */}
                      {(signal.bookingCodes?.bet9ja) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(signal.bookingCodes.bet9ja).catch(() => {});
                            window.open(`https://web.bet9ja.com/Sport/Coupon/${signal.bookingCodes.bet9ja}`, '_blank');
                          }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-[#007b5e] hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-colors"
                          title={`Bet9ja code: ${signal.bookingCodes.bet9ja}`}
                        >
                          <span>🎯</span>
                          <span>Bet9ja</span>
                          <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded text-[10px] font-mono">{signal.bookingCodes.bet9ja}</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1.5 text-center">
                      {signal.sportybet?.market && `Market: ${signal.sportybet.market}`} · Click to open betslip
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 px-3 rounded-xl cursor-not-allowed"
                        style={{ backgroundColor: '#374151', color: '#9ca3af', height: '44px', borderRadius: '8px' }}
                      >
                        🔄 Getting Sportybet code...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

