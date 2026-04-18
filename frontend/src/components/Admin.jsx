import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';

const API_URL = import.meta.env.VITE_API_URL;

const ADMIN_CODE = '4161';

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('ss_admin') === 'true');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [liveMatches, setLiveMatches] = useState([]);
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, strikeRate: 0, total: 0 });
  const [users, setUsers] = useState([]);

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

  useEffect(() => {
    if (tab === 'users') {
      fetch(`${API_URL}/api/admin/users`).then(r => r.json()).then(setUsers).catch(() => {});
    }
  }, [tab]);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'settings', label: 'Settings' },
    { key: 'users', label: 'Users' },
  ];

  function handleCodeSubmit(e) {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      setUnlocked(true);
      sessionStorage.setItem('ss_admin', 'true');
      setCodeError('');
    } else {
      setCodeError('Invalid admin code');
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Access</h2>
          <p className="text-gray-400 text-sm mb-6">Enter the admin code to continue</p>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(''); }}
              placeholder="Enter code"
              className="w-full text-center text-2xl tracking-[0.5em] border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {codeError && <p className="text-red-500 text-sm">{codeError}</p>}
            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Unlock
            </button>
          </form>
          <a href="/" className="inline-block mt-4 text-gray-400 hover:text-gray-600 text-sm">← Back to App</a>
        </div>
      </div>
    );
  }

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
        {tab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👥 Registered Users ({users.length})</h2>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">No users registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Email</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Notifications</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-900">{u.name}</td>
                        <td className="py-2 px-3 text-gray-600">{u.email}</td>
                        <td className="py-2 px-3">{u.notifications ? '✅ On' : '❌ Off'}</td>
                        <td className="py-2 px-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
