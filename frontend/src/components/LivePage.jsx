import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://strikesignal-api-production.up.railway.app';

const CONF = {
  high:   { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'HIGH' },
  medium: { dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     label: 'MED' },
  low:    { dot: 'bg-slate-400',   badge: 'bg-slate-700/40 text-slate-400 border-slate-600/20',     label: 'LOW' },
};

function SignalCard({ signal, onRetryConvert }) {
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const c = CONF[signal.confidence] || CONF.low;

  const handleRetry = async (e) => {
    e.stopPropagation();
    if (!signal.id || retrying) return;
    setRetrying(true);
    try {
      await onRetryConvert(signal.id);
    } catch {}
    setRetrying(false);
  };

  return (
    <div className="bg-[#0d1527] border border-white/5 hover:border-blue-500/20 rounded-2xl overflow-hidden transition-all">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">{signal.home}</span>
              <span className="text-slate-600 text-xs">vs</span>
              <span className="font-bold text-white">{signal.away}</span>
              <span className="bg-[#0a0f1e] text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-white/5">{signal.minute}'</span>
            </div>
            <div className="text-slate-500 text-xs mt-0.5 truncate">{signal.league}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-center">
            <div className="text-white font-black font-mono">{signal.score?.home ?? 0} - {signal.score?.away ?? 0}</div>
            <div className="text-slate-600 text-[10px]">Score</div>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${c.badge}`}>{c.label}</span>
          <span className={`text-slate-600 text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Bet banner */}
      <div className="mx-4 mb-3 bg-gradient-to-r from-blue-600/10 to-violet-600/10 border border-blue-500/10 rounded-xl p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{signal.aiEnhanced ? '🤖' : '⚡'}</span>
          <div>
            <div className="text-white font-bold text-sm">{signal.betType}</div>
            <div className="text-slate-500 text-[11px]">{signal.aiEnhanced ? 'AI-Enhanced' : 'Rule-Based'}</div>
          </div>
        </div>
        {signal.betOdds && <div className="text-emerald-400 font-black text-xl">{signal.betOdds.toFixed(2)}</div>}
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex gap-2 flex-wrap">
        {[['xG', signal.xG?.total?.toFixed(2) ?? '—', true], ['Home xG', signal.xG?.home?.toFixed(2) ?? '—', false], ['Away xG', signal.xG?.away?.toFixed(2) ?? '—', false], ['Shots', signal.shots ?? '—', false], ['Danger', signal.dangerAttacks ?? '—', false]].map(([l, v, hi]) => (
          <div key={l} className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs ${hi ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#0a0f1e] border-white/5'}`}>
            <span className={`font-bold text-sm ${hi ? 'text-blue-300' : 'text-white'}`}>{v}</span>
            <span className="text-slate-500">{l}</span>
          </div>
        ))}
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-white/5 px-4 py-4 space-y-3">
          {signal.reason && <div className="bg-[#0a0f1e] rounded-xl p-3"><div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Analysis</div><p className="text-slate-300 text-sm">{signal.reason}</p></div>}
          {signal.aiInsight && <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3"><div className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-1">🤖 AI Insight</div><p className="text-slate-300 text-sm">{signal.aiInsight}</p></div>}
          <div className="flex gap-2 text-xs text-slate-500"><span>Expected: <span className="text-white font-medium">{signal.expectedScore}</span></span><span>·</span><span>xG Gap: <span className="text-white font-medium">{signal.xGGap?.toFixed(2)}</span></span></div>
        </div>
      )}

      {/* Booking codes / Bet Now section */}
      {(signal.sportybet && signal.sportybet.betLink) ? (
        /* ── Has Sportybet link — show Bet Now ────────────────────────────────── */
        <div className="border-t border-white/5 bg-[#0a0f1e]/60 px-4 py-3">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Book This Bet</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={e => { e.stopPropagation(); window.open(signal.sportybet.betLink, '_blank'); }}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all"
              style={{ backgroundColor: '#16a34a', height: '44px', borderRadius: '8px' }}
            >
              ⚽ Bet Now on Sportybet
              {signal.sportybet.shareCode && <span className="bg-green-800/60 px-1.5 py-0.5 rounded font-mono text-[10px]">{signal.sportybet.shareCode}</span>}
            </button>
            {signal.bookingCodes?.bet9ja && (
              <button
                onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(signal.bookingCodes.bet9ja).catch(()=>{}); window.open(`https://web.bet9ja.com/Sport/Coupon/${signal.bookingCodes.bet9ja}`, '_blank'); }}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-[#007b5e] hover:brightness-110 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all"
              >
                🎯 Bet9ja <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono text-[10px]">{signal.bookingCodes.bet9ja}</span>
              </button>
            )}
          </div>
          <div className="text-[10px] text-slate-700 mt-1.5 text-center">
            Share code: {signal.sportybet.shareCode}
            {signal.sportybet.totalOdds ? ` · Odds: ${signal.sportybet.totalOdds}` : ''}
            {signal.sportybet.market ? ` · ${signal.sportybet.market}` : ''}
          </div>
        </div>
      ) : (
        /* ── No Sportybet link — show getting code / retry ────────────────────── */
        <div className="border-t border-white/5 bg-[#0a0f1e]/60 px-4 py-3">
          <div className="flex flex-col gap-2 items-center">
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 px-3 rounded-xl cursor-not-allowed"
              style={{ backgroundColor: '#374151', color: '#9ca3af', height: '44px', borderRadius: '8px' }}
            >
              🔄 Getting Sportybet code...
            </button>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              {retrying ? '⏳ Retrying...' : '🔄 Retry conversion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LivePage({ signals, liveMatches, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [localSignals, setLocalSignals] = useState(null);

  const displaySignals = localSignals || signals;
  const filtered = filter === 'all' ? displaySignals : displaySignals.filter(s => s.confidence === filter);

  const handleRetryConvert = async (signalId) => {
    try {
      const res = await fetch(`${API}/api/signals/${signalId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.signal) {
        // Update the local copy so the UI refreshes immediately
        setLocalSignals(prev => {
          const base = prev || signals;
          return base.map(s => s.id === signalId ? { ...s, sportybet: data.signal.sportybet, bookingCodes: data.signal.bookingCodes } : s);
        });
      }
    } catch (err) {
      console.error('Retry convert failed:', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Live Signals</h1>
          <p className="text-slate-500 text-sm">{signals.length} signals · {liveMatches.length} matches monitored</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-[#0d1527] border border-white/5 rounded-xl p-1">
            {['all','high','medium','low'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={onRefresh} className="flex items-center gap-1.5 bg-[#0d1527] border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all">
            🔄 Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">💡</div>
          <h3 className="text-white font-bold mb-1">No {filter !== 'all' ? filter + ' confidence ' : ''}signals</h3>
          <p className="text-slate-500 text-sm">Signals fire when live matches meet our xG criteria</p>
        </div>
      ) : (
        <div className="space-y-3">{filtered.map(s => <SignalCard key={s.id || s.fixtureId} signal={s} onRetryConvert={handleRetryConvert} />)}</div>
      )}
    </div>
  );
}
