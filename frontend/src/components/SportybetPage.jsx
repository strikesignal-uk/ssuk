import React, { useEffect, useState } from 'react';
import SportybetAccount from './SportybetAccount.jsx';
import SportybetAutomation from './SportybetAutomation.jsx';
import SportybetIntegration from './SportybetIntegration.jsx';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('ss_token');

export default function SportybetPage() {
  const [tab, setTab] = useState('account');
  const [status, setStatus] = useState({ connected: false, phone: '' });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/api/sportybet/status`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        localStorage.setItem('ss_sportybet_connected', data.connected ? 'true' : 'false');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚽</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Sportybet</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Account, active bets, and automation bots</p>
        </div>
        <button onClick={fetchStatus}
          className="flex items-center justify-center gap-2 bg-[#0a0f1e] hover:bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all w-full sm:w-auto">
          <span>🔄</span> Sync
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-[#0d1527] border border-white/5 p-1 rounded-2xl w-full max-w-md">
        {[
          { id: 'account', label: 'Account' },
          { id: 'automation', label: 'Automation 🔢' },
          { id: 'integration', label: 'Integration ●' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-center py-2 text-sm font-bold rounded-xl transition-all ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'account' && <SportybetAccount status={status} />}
          {tab === 'automation' && <SportybetAutomation status={status} />}
          {tab === 'integration' && <SportybetIntegration status={status} onUpdate={fetchStatus} />}
        </>
      )}
    </div>
  );
}
