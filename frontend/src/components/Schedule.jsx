import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

function StateChip({ stateId, state, startingAt }) {
  if (stateId === 1) {
    const t = new Date(startingAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return <span className="text-xs font-bold text-blue-400">{t}</span>;
  }
  if (stateId === 5) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">FT</span>;
  if (stateId === 3) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">HT</span>;
  return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      {state || 'LIVE'}
    </span>
  );
}

function MatchCard({ m }) {
  const dt = new Date(m.startingAt);
  const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-[#0d1527] border border-white/5 hover:border-blue-500/15 rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{m.league || 'Football'}</span>
        <div className="flex items-center gap-2">
          <StateChip stateId={m.stateId} state={m.state} startingAt={m.startingAt} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            {m.homeLogo && <img src={m.homeLogo} alt="" className="w-5 h-5 rounded-sm" />}
            <span className="font-bold text-white text-sm leading-tight">{m.home || 'TBD'}</span>
          </div>
        </div>
        <div className="bg-[#0a0f1e] border border-white/5 rounded-xl px-4 py-1.5 text-center shrink-0">
          {m.stateId && m.stateId !== 1 ? (
            <div className="text-white font-black font-mono text-sm">
              {m.score?.home ?? 0} - {m.score?.away ?? 0}
            </div>
          ) : (
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">vs</div>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm leading-tight">{m.away || 'TBD'}</span>
            {m.awayLogo && <img src={m.awayLogo} alt="" className="w-5 h-5 rounded-sm" />}
          </div>
        </div>
      </div>
      {/* Kickoff time for NS matches */}
      {m.stateId === 1 && (
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-500 font-medium">🕐 {timeStr} · {dateStr}</span>
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/api/matches/today`)
      .then(r => r.json())
      .then(d => setFixtures(Array.isArray(d) ? d : []))
      .catch(() => setFixtures([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search ? fixtures.filter(m => {
    const names = [m.home, m.away, m.league].filter(Boolean).join(' ').toLowerCase();
    return names.includes(search.toLowerCase());
  }) : fixtures;

  // Group by league
  const grouped = filtered.reduce((acc, m) => {
    const key = m.league || 'Other';
    if (!acc[key]) acc[key] = { logo: m.leagueLogo, matches: [] };
    acc[key].matches.push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Today's Schedule</h1>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {fixtures.length} matches
          </p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or league…"
          className="bg-[#0d1527] border border-white/5 focus:border-blue-500/30 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-700 outline-none transition-colors w-full sm:w-56" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-white font-bold mb-1">{search ? 'No matches found' : 'No matches scheduled'}</h3>
          <p className="text-slate-500 text-sm">{search ? 'Try a different search' : 'Check back later for today\'s fixtures'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([league, { logo, matches }]) => (
            <div key={league}>
              <div className="flex items-center gap-3 mb-3">
                {logo && <img src={logo} alt="" className="w-5 h-5 rounded-sm" />}
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">🏆 {league}</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-slate-600">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {matches.map(m => <MatchCard key={m.fixtureId} m={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
