import React from 'react';

function confidenceColor(level) {
  if (level === 'high') return 'bg-green-600';
  if (level === 'medium') return 'bg-amber-600';
  return 'bg-gray-400';
}

export default function Opportunities({ signals, liveMatches }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-blue-900">🎯 Betting Opportunities</h2>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
      {signals.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <span className="text-5xl mb-2">💡</span>
          <span className="text-lg">No opportunities found</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {signals.map(signal => (
            <div
              key={signal.id}
              className="rounded-lg shadow border border-blue-200 overflow-hidden bg-white"
            >
              {/* Top: Blue gradient header */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-500 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xl">{signal.home} vs {signal.away}</span>
                  <span className="ml-2 text-blue-100 text-xs">{signal.league} • {signal.minute}'</span>
                </div>
                <span className="text-2xl font-mono text-white">{signal.score.home}-{signal.score.away}</span>
              </div>
              {/* Middle: Bet type & expected score */}
              <div className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-2 border-b border-blue-100">
                <div>
                  <div className="text-xs text-gray-500">Bet Type</div>
                  <div className="font-semibold text-blue-900">{signal.betType}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Expected Score</div>
                  <div className="font-semibold text-blue-900">{signal.expectedScore}</div>
                </div>
              </div>
              {/* Stats row */}
              <div className="flex gap-2 px-4 py-2 bg-blue-50 flex-wrap">
                {signal.betOdds && (
                  <span className="bg-green-200 text-green-900 rounded-full px-3 py-1 text-xs font-semibold">Odds: {signal.betOdds.toFixed(2)}</span>
                )}
                <span className="bg-blue-200 text-blue-900 rounded-full px-3 py-1 text-xs font-semibold">xG: {signal.xG.total.toFixed(2)}</span>
                <span className="bg-blue-200 text-blue-900 rounded-full px-3 py-1 text-xs font-semibold">Pressure: {signal.pressure}</span>
                <span className="bg-blue-200 text-blue-900 rounded-full px-3 py-1 text-xs font-semibold">Danger Attacks: {signal.dangerAttacks}</span>
                <span className="bg-blue-200 text-blue-900 rounded-full px-3 py-1 text-xs font-semibold">Shots: {signal.shots}</span>
              </div>
              {/* Bottom: Reason & confidence */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-green-700 text-sm font-medium flex items-center gap-1">
                  {signal.aiEnhanced ? '🤖 AI-Enhanced Prediction' : '✅ System indicates high probability of a goal'}
                </span>
                <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${confidenceColor(signal.confidence)}`}>
                  {signal.confidence.charAt(0).toUpperCase() + signal.confidence.slice(1)}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
