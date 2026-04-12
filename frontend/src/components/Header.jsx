import React from 'react';

const tabs = [
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'results', label: 'Results' }
];

export default function Header({ tab, setTab, liveCount }) {
  return (
    <header className="w-full bg-gradient-to-r from-blue-900 to-blue-500 pb-2">
      <div className="flex justify-between items-center px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">⚡</span>
          <span className="font-bold text-white text-2xl tracking-tight">StrikeSignal</span>
          <span className="ml-2 text-blue-100 text-sm font-medium">Live Goal Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-white font-semibold text-sm">LIVE</span>
          <span className="ml-1 text-white text-lg font-mono">{liveCount}</span>
        </div>
      </div>
      <nav className="flex gap-2 mt-6 px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              (tab === t.key
                ? 'bg-white text-blue-900 rounded-t-lg shadow font-bold'
                : 'bg-transparent text-blue-100 hover:text-white') +
              ' px-4 py-2 transition-colors duration-150 text-base outline-none'
            }
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
