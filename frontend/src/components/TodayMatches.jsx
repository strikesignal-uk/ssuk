import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function stateStyle(stateId) {
  // 1=NS, 2=1H, 3=HT, 22=2H, 5=FT
  if (stateId === 5) return 'bg-gray-200 text-gray-600';
  if ([2, 22].includes(stateId)) return 'bg-green-100 text-green-700 animate-pulse';
  if (stateId === 3) return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
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

  // Group matches by league
  const grouped = {};
  for (const m of matches) {
    const key = m.league || 'Other';
    if (!grouped[key]) grouped[key] = { logo: m.leagueLogo, matches: [] };
    grouped[key].matches.push(m);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-400">
        <span className="text-4xl mb-2 animate-spin">⚽</span>
        <span className="text-lg">Loading today&apos;s matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-16 text-red-400">
        <span className="text-4xl mb-2">⚠️</span>
        <span className="text-lg">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-blue-900">
          ⚽ Today&apos;s Matches
          <span className="ml-2 text-base font-normal text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{matches.length} matches</span>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 text-sm"
            onClick={() => { setLoading(true); fetchMatches(); }}
          >
            Refresh
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <span className="text-5xl mb-2">📅</span>
          <span className="text-lg">No matches scheduled for today</span>
        </div>
      ) : (
        Object.entries(grouped).map(([league, { logo, matches: leagueMatches }]) => (
          <div key={league} className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
            {/* League header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-2 flex items-center gap-2">
              {logo && <img src={logo} alt="" className="w-5 h-5 rounded-full bg-white" />}
              <span className="font-semibold text-white text-sm">{league}</span>
              <span className="text-blue-200 text-xs ml-auto">{leagueMatches.length} match{leagueMatches.length > 1 ? 'es' : ''}</span>
            </div>
            {/* Match rows */}
            <div className="divide-y divide-gray-100">
              {leagueMatches.map(m => (
                <div key={m.fixtureId} className="px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors">
                  {/* Time / State */}
                  <div className="w-16 text-center flex-shrink-0">
                    {m.stateId === 1 ? (
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(m.startingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stateStyle(m.stateId)}`}>
                        {m.state}
                      </span>
                    )}
                  </div>
                  {/* Teams */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {m.homeLogo && <img src={m.homeLogo} alt="" className="w-5 h-5" />}
                      <span className="text-sm font-medium text-gray-900 truncate">{m.home}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {m.awayLogo && <img src={m.awayLogo} alt="" className="w-5 h-5" />}
                      <span className="text-sm font-medium text-gray-900 truncate">{m.away}</span>
                    </div>
                  </div>
                  {/* Score */}
                  {m.stateId !== 1 && (
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-lg font-bold font-mono ${m.stateId === 5 ? 'text-gray-500' : 'text-blue-900'}`}>
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
