import React from 'react';

export default function Results({ results, stats }) {
  return (
    <div className="space-y-6">
      {/* Top card: stats */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-500 rounded-lg shadow p-6 flex flex-col items-center">
        <div className="flex gap-8 mb-2">
          <div className="flex flex-col items-center">
            <span className="text-white text-lg font-bold">Wins</span>
            <span className="text-green-400 text-2xl font-mono font-bold">{stats.wins}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white text-lg font-bold">Losses</span>
            <span className="text-red-400 text-2xl font-mono font-bold">{stats.losses}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white text-lg font-bold">Strike Rate</span>
            <span className="text-amber-300 text-2xl font-mono font-bold">{stats.strikeRate}%</span>
          </div>
        </div>
        {/* Animated progress bar */}
        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-700"
            style={{ width: `${stats.strikeRate}%` }}
          ></div>
        </div>
      </div>
      {/* Results table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Signal History (Last 30 Days)</h2>
        {results.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No signals yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-blue-900">
                <th className="py-2">Result</th>
                <th className="py-2">Fixture</th>
                <th className="py-2">League</th>
                <th className="py-2">Market</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-t border-blue-50">
                  <td className="py-2">
                    {r.result === 'win' && <span className="text-green-600 text-lg">✅</span>}
                    {r.result === 'loss' && <span className="text-red-500 text-lg">❌</span>}
                    {r.result === 'pending' && <span className="text-amber-500 text-lg">⏳</span>}
                  </td>
                  <td className="py-2 font-semibold text-blue-900">{r.home} vs {r.away}</td>
                  <td className="py-2 text-gray-500">{r.league}</td>
                  <td className="py-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold text-xs">
                      {r.betType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
