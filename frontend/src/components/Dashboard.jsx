import React from 'react';

export default function Dashboard({ liveMatches, signals, stats, onTabChange }) {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
          <span className="text-blue-700 text-3xl mb-2">📡</span>
          <span className="text-2xl font-bold text-blue-700">{liveMatches.length}</span>
          <span className="text-gray-500 mt-1">Live Matches</span>
        </div>
        <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
          <span className="text-green-600 text-3xl mb-2">🎯</span>
          <span className="text-2xl font-bold text-green-600">{signals.length}</span>
          <span className="text-gray-500 mt-1">Betting Opportunities</span>
        </div>
        <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
          <span className="text-amber-500 text-3xl mb-2">📈</span>
          <span className="text-2xl font-bold text-amber-500">{stats.strikeRate}%</span>
          <span className="text-gray-500 mt-1">Strike Rate (30d)</span>
        </div>
      </div>
      {/* Alert Banner */}
      {signals.length > 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-900 px-4 py-3 rounded flex items-center justify-between">
          <span className="font-semibold">{signals.length} Betting Opportunities Detected</span>
          <button
            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
            onClick={() => onTabChange('opportunities')}
          >
            View All →
          </button>
        </div>
      )}
      {/* Live Matches List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Live Matches</h2>
        {liveMatches.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No live matches</div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {liveMatches.map((m, i) => (
              <li
                key={m.fixtureId}
                className={
                  'flex items-center justify-between py-3 px-2 cursor-pointer rounded ' +
                  (signals.some(s => s.fixtureId === m.fixtureId)
                    ? 'bg-green-50'
                    : 'hover:bg-blue-50')
                }
                onClick={() => onTabChange('opportunities')}
              >
                <div>
                  <span className="font-bold text-blue-900">{m.home}</span>
                  <span className="mx-1 text-gray-400">vs</span>
                  <span className="font-bold text-blue-900">{m.away}</span>
                  <span className="ml-2 text-xs text-gray-500">{m.league} • {m.minute}'</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-mono text-blue-700">{m.score.home}-{m.score.away}</span>
                  <span className="text-blue-500 font-semibold text-sm">xG: {m.xG.total.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
