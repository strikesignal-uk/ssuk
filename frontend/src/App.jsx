import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Opportunities from './components/Opportunities.jsx';
import Results from './components/Results.jsx';
import Admin from './components/Admin.jsx';

const API_URL = import.meta.env.VITE_API_URL;

function MainApp() {
  const [tab, setTab] = useState('opportunities');
  const [liveMatches, setLiveMatches] = useState([]);
  const [signals, setSignals] = useState([]);
  const [results, setResults] = useState([]);
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
      } catch (e) { /* ignore */ }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchResults() {
    try {
      const res = await fetch(`${API_URL}/api/results`);
      const data = await res.json();
      setResults(data.results);
      setStats(data.stats);
    } catch (e) { /* ignore */ }
  }

  // Fetch results on mount, every 30s, and whenever the results tab is opened
  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 'results') fetchResults();
  }, [tab]);

  return (
    <div className="min-h-screen bg-blue-50">
      <Header tab={tab} setTab={setTab} liveCount={liveMatches.length} />
      <main className="max-w-4xl mx-auto px-2 py-6">
        {tab === 'opportunities' && (
          <Opportunities signals={signals} liveMatches={liveMatches} />
        )}
        {tab === 'results' && (
          <Results results={results} stats={stats} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
