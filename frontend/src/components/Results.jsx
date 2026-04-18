import React, { useState } from 'react';

const PERIODS = [
  { key: 'daily', label: 'Today', icon: '📅' },
  { key: 'weekly', label: 'This Week', icon: '📆' },
  { key: 'monthly', label: 'This Month', icon: '🗓️' },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

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

export default function Results({ results, stats, period, onPeriodChange }) {
  return (
    <div className="space-y-5">
      {/* Period tabs */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => onPeriodChange(p.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
              period === p.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 text-center">
          <div className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Wins</div>
          <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 text-center">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Losses</div>
          <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 text-center">
          <div className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">Strike Rate</div>
          <div className="text-2xl font-bold text-amber-600">{stats.strikeRate}%</div>
        </div>
      </div>

      {/* Strike rate progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Win Rate</span>
          <span className="text-sm font-bold text-blue-900">{stats.strikeRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-green-400"
            style={{ width: `${stats.strikeRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          <span>{stats.wins}W - {stats.losses}L{stats.pending > 0 ? ` - ${stats.pending}P` : ''}</span>
          <span>{stats.total} signals</span>
        </div>
      </div>

      {/* Date-grouped results */}
      {results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-400 font-medium">No signals for this period</div>
          <div className="text-gray-300 text-sm mt-1">Signals will appear here when matches are live</div>
        </div>
      ) : (
        groupByDate(results).map(([date, items]) => (
          <div key={date} className="space-y-2">
            {/* Date header */}
            <div className="flex items-center gap-3 px-1">
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">{date}</div>
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-xs text-gray-400">{items.length} signal{items.length > 1 ? 's' : ''}</div>
            </div>

            {/* Signal cards for this date */}
            <div className="space-y-2">
              {items.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {/* Result badge */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      r.result === 'win' ? 'bg-green-50 text-green-600' :
                      r.result === 'loss' ? 'bg-red-50 text-red-500' :
                      'bg-amber-50 text-amber-500'
                    }`}>
                      {r.result === 'win' ? '✅' : r.result === 'loss' ? '❌' : '⏳'}
                    </div>

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900 text-sm truncate">{r.home} vs {r.away}</span>
                        <span className="text-xs text-gray-400">{r.score?.home ?? 0} - {r.score?.away ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{r.league}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{formatTime(r.created_at)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{r.minute}'</span>
                      </div>
                    </div>

                    {/* Bet type + confidence */}
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        {r.betType}
                      </span>
                      <div className="mt-1">
                        <span className={`text-xs font-semibold ${
                          r.confidence === 'high' ? 'text-green-500' :
                          r.confidence === 'medium' ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                          {r.confidence === 'high' ? '🔥 High' : r.confidence === 'medium' ? '⚡ Med' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
