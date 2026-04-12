import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [liveMatches, setLiveMatches] = useState([]);
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, strikeRate: 0, total: 0 });

  useEffect(() => {
    async function fetchLive() {
      try {
        const [matchRes, sigRes] = await Promise.all([
          fetch(`${API_URL}/api/matches/live`),
          fetch(`${API_URL}/api/signals/live`)
        ]);
        setLiveMatches(await matchRes.json());
        setSignals(await sigRes.json());
      } catch { /* ignore */ }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`${API_URL}/api/results`);
        const data = await res.json();
        setStats(data.stats);
      } catch { /* ignore */ }
    }
    fetchResults();
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full bg-gradient-to-r from-gray-900 to-gray-700 pb-2">
        <div className="flex justify-between items-center px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            <span className="font-bold text-white text-2xl tracking-tight">StrikeSignal</span>
            <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <a href="/" className="text-gray-300 hover:text-white text-sm">← Back to App</a>
        </div>
        <nav className="flex gap-2 mt-6 px-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                (tab === t.key
                  ? 'bg-white text-gray-900 rounded-t-lg shadow font-bold'
                  : 'bg-transparent text-gray-300 hover:text-white') +
                ' px-4 py-2 transition-colors duration-150 text-base outline-none'
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-2 py-6">
        {tab === 'dashboard' && (
          <Dashboard
            liveMatches={liveMatches}
            signals={signals}
            stats={stats}
            onTabChange={() => {}}
          />
        )}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
