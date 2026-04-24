import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function StateChip({ stateId, state, startingAt }) {
  if (stateId === 1) {
    const t = new Date(startingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return <span className="text-sm font-semibold text-slate-300">{t}</span>;
  }
  if (stateId === 5) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">FT</span>;
  if (stateId === 3) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">HT</span>;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      {state}
    </span>
  );
}

export default function TodayMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchMatches() {
    try {
      const res = await fetch(`${API_URL}/api/matches/today`);
      const data = await res.json();
      setMatches(data);
      setError('');
    } catch {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  const grouped = {};
  for (const m of matches) {
    const key = m.league || 'Other';
    if (!grouped[key]) grouped[key] = { logo: m.leagueLogo, matches: [] };
    grouped[key].matches.push(m);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24 text-slate-600">
        <span className="text-4xl mb-3 animate-spin">⚽</span>
        <span>Loading today's matches…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Today's Matches</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {matches.length} matches
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchMatches(); }}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-4">📅</div>
          <div className="text-white font-semibold">No matches today</div>
          <div className="text-slate-500 text-sm mt-1">Check back later</div>
        </div>
      ) : (
        Object.entries(grouped).map(([league, { logo, matches: lm }]) => (
          <div key={league} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* League header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-slate-800">
              {logo && <img src={logo} alt="" className="w-5 h-5 rounded-sm" />}
              <span className="font-semibold text-slate-200 text-sm">{league}</span>
              <span className="ml-auto text-slate-600 text-xs">{lm.length} match{lm.length > 1 ? 'es' : ''}</span>
            </div>
            {/* Match rows */}
            <div className="divide-y divide-slate-800">
              {lm.map(m => (
                <div key={m.fixtureId} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-800/40 transition-colors">
                  {/* Time / State */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <StateChip stateId={m.stateId} state={m.state} startingAt={m.startingAt} />
                  </div>

                  {/* Teams */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {m.homeLogo && <img src={m.homeLogo} alt="" className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-sm font-semibold text-slate-200 truncate">{m.home}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.awayLogo && <img src={m.awayLogo} alt="" className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-sm font-semibold text-slate-200 truncate">{m.away}</span>
                    </div>
                  </div>

                  {/* Score */}
                  {m.stateId !== 1 && m.score && (
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-lg font-bold font-mono ${m.stateId === 5 ? 'text-slate-500' : 'text-white'}`}>
                        {m.score.home} - {m.score.away}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}



