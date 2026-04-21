import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Opportunities from './components/Opportunities.jsx';
import Results from './components/Results.jsx';
import Admin from './components/Admin.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import TodayMatches from './components/TodayMatches.jsx';

const API_URL = import.meta.env.VITE_API_URL;

function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState('opportunities');
  const [liveMatches, setLiveMatches] = useState([]);
  const [signals, setSignals] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, strikeRate: 0, total: 0, pending: 0 });
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    async function fetchLive() {
      try {
        const [matchRes, sigRes] = await Promise.all([
          fetch(`${API_URL}/api/matches/live`),
          fetch(`${API_URL}/api/signals/live`)
        ]);
        setLiveMatches(await matchRes.json());
        setSignals(await sigRes.json());
      } catch (e) { /* ignore */ }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchResults() {
    try {
      const res = await fetch(`${API_URL}/api/results?period=${period}`);
      const data = await res.json();
      setResults(data.results);
      setStats(data.stats);
    } catch (e) { /* ignore */ }
  }

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, [period]);

  useEffect(() => {
    if (tab === 'results') fetchResults();
  }, [tab]);

  return (
    <div className="min-h-screen bg-blue-50">
      <Header tab={tab} setTab={setTab} liveCount={liveMatches.length} user={user} onLogout={onLogout} />
      <main className="max-w-4xl mx-auto px-2 py-6">
        {tab === 'opportunities' && (
          <Opportunities signals={signals} liveMatches={liveMatches} />
        )}
        {tab === 'matches' && (
          <TodayMatches />
        )}
        {tab === 'results' && (
          <Results results={results} stats={stats} period={period} onPeriodChange={setPeriod} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('ss_user');
    return u ? JSON.parse(u) : null;
  });

  function handleAuth(newToken, newUser) {
    localStorage.setItem('ss_token', newToken);
    localStorage.setItem('ss_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setToken(null);
    setUser(null);
  }

  const isLoggedIn = !!token && !!user;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login onAuth={handleAuth} />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/" /> : <Signup onAuth={handleAuth} />} />
        <Route path="/admin" element={isLoggedIn ? <Admin /> : <Navigate to="/login" />} />
        <Route path="*" element={isLoggedIn ? <MainApp user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
