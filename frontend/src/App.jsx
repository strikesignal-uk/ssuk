import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/Header.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import LivePage from './components/LivePage.jsx';
import TradeLog from './components/TradeLog.jsx';
import Schedule from './components/Schedule.jsx';
import Results from './components/Results.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import Profile from './components/Profile.jsx';
import SportybetPage from './components/SportybetPage.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import LandingPage from './components/LandingPage.jsx';
import ChatBox from './components/ChatBox.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Blog from './pages/Blog.jsx';

const API_URL = import.meta.env.VITE_API_URL;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white font-bold text-xl mb-2">Something went wrong</h2>
          <p className="text-red-400 text-sm font-mono break-all">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold">Reload</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Sidebar App Shell ──────────────────────────────────────────────────────────
function AppShell({ user, onLogout, onUserUpdate }) {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [liveMatches, setLiveMatches] = useState([]);
  const [signals, setSignals] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, strikeRate: 0, total: 0, pending: 0 });
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    async function fetchLive() {
      try {
        const [mr, sr] = await Promise.all([
          fetch(`${API_URL}/api/matches/live`),
          fetch(`${API_URL}/api/signals/live`),
        ]);
        setLiveMatches(await mr.json());
        setSignals(await sr.json());
      } catch { /* silent */ }
    }
    fetchLive();
    const id = setInterval(fetchLive, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchResults() {
      try {
        const r = await fetch(`${API_URL}/api/results?period=${period}`);
        const d = await r.json();
        setResults(d.results || []);
        setStats(d.stats || { wins: 0, losses: 0, strikeRate: 0, total: 0, pending: 0 });
      } catch { /* silent */ }
    }
    fetchResults();
    const id = setInterval(fetchResults, 30000);
    return () => clearInterval(id);
  }, [period]);

  // Collapse sidebar on mobile when page changes
  const nav = p => { setPage(p); if (window.innerWidth < 768) setCollapsed(true); };

  const isMobile = window.innerWidth < 768;
  const mainStyle = { marginLeft: isMobile ? '0' : (collapsed ? '4rem' : '14rem'), transition: 'margin-left 300ms' };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      <Sidebar page={page} setPage={nav} user={user} onLogout={onLogout}
        liveCount={liveMatches.length} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 min-w-0 flex flex-col" style={mainStyle}>
        <TopBar page={page} user={user} onLogout={onLogout}
          liveCount={liveMatches.length} sidebarCollapsed={collapsed} setSidebarCollapsed={setCollapsed} />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-6xl w-full mx-auto">
          {page === 'dashboard' && <DashboardPage user={user} />}
          {page === 'live' && <LivePage signals={signals} liveMatches={liveMatches} onRefresh={() => window.location.reload()} />}
          {page === 'tradelog' && <TradeLog />}
          {page === 'schedule' && <Schedule />}
          {page === 'sportybet' && <SportybetPage />}
          {page === 'results' && (
            <Results results={results} stats={stats} period={period} onPeriodChange={setPeriod} />
          )}
          {page === 'settings' && <SettingsPage user={user} onUserUpdate={onUserUpdate} />}
          {page === 'profile' && <Profile user={user} onUserUpdate={onUserUpdate} />}
          {page === 'blog' && <Blog />}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0d1527] border-t border-white/5 z-40 flex items-center justify-around pb-safe">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'live',      icon: '⚡', label: 'Live' },
            { key: 'tradelog',  icon: '🕐', label: 'Trade Log' },
            { key: 'schedule',  icon: '📅', label: 'Schedule' },
            { key: 'settings',  icon: '⚙️',  label: 'Settings' },
            { key: 'blog',      icon: '📝', label: 'Blog' },
            { key: 'sportybet', icon: '⚽', label: 'Sportybet' },
          ].map(n => (
            <button key={n.key} onClick={() => nav(n.key)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all ${
                page === n.key ? 'text-blue-400' : 'text-slate-500 hover:text-white'
              }`}>
              <span className="text-xl leading-none">{n.icon}</span>
              <span className="text-[10px] font-bold">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem('ss_user'); return u ? JSON.parse(u) : null; }
    catch { localStorage.removeItem('ss_user'); localStorage.removeItem('ss_token'); return null; }
  });

  function handleAuth(t, u) {
    localStorage.setItem('ss_token', t);
    localStorage.setItem('ss_user', JSON.stringify(u));
    setToken(t); setUser(u);
  }
  function handleLogout() {
    localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user');
    setToken(null); setUser(null);
  }
  function handleUserUpdate(u) {
    localStorage.setItem('ss_user', JSON.stringify(u)); setUser(u);
  }

  const loggedIn = !!token && !!user;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={loggedIn ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={loggedIn ? <Navigate to="/dashboard" /> : <Login onAuth={handleAuth} />} />
          <Route path="/signup" element={loggedIn ? <Navigate to="/dashboard" /> : <Signup onAuth={handleAuth} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={loggedIn ? <AppShell user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} /> : <Navigate to="/login" />} />
          <Route path="*" element={loggedIn ? <AppShell user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} /> : <Navigate to="/" />} />
        </Routes>
        {/* ChatBox floats on all pages */}
        <ChatBox />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
