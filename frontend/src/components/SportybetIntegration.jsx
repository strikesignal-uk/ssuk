import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function SportybetIntegration({ status, onUpdate }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stakePct, setStakePct] = useState('2');
  const [minOdds, setMinOdds] = useState('1.50');

  const connect = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/sportybet/connect`, { method: 'POST', headers: hdrs(), body: JSON.stringify({ phone, password }) });
    if (res.ok) onUpdate();
    setLoading(false);
  };

  const disconnect = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/sportybet/disconnect`, { method: 'POST', headers: hdrs() });
    if (res.ok) onUpdate();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* CONNECTION CARD */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">⚽ Sportybet Account Connection</h2>
          <p className="text-xs text-slate-500 mt-1">Connect your Sportybet account to enable one-click betting and automation bots</p>
        </div>
        <div className="p-5">
          {status.connected ? (
            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Connected
              </div>
              <div className="text-sm text-slate-300">Sportybet account: <span className="font-mono">{status.phone}</span></div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">What's connected</div>
                <div className="text-sm text-slate-300 flex items-center gap-2">✅ Account session active</div>
                <div className="text-sm text-slate-300 flex items-center gap-2">✅ Auto-bet placement enabled</div>
                <div className="text-sm text-slate-300 flex items-center gap-2">✅ Bet history tracking</div>
                <div className="text-sm text-slate-300 flex items-center gap-2">✅ Automation bot order execution</div>
              </div>
              <div className="bg-amber-500/10 border-l-4 border-l-amber-500 p-3 rounded-r-xl">
                <p className="text-xs text-amber-500/80 font-medium">Your credentials are encrypted and never exposed to other users.</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0a0f1e] border border-emerald-500/10 rounded-xl">
                <div className="text-sm text-emerald-400 font-medium">Sportybet Session Key ✓ Saved</div>
                <div className="font-mono text-slate-400 text-sm">sprt_••••••</div>
              </div>
              <button onClick={disconnect} disabled={loading} className="w-full sm:w-auto bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold py-2.5 px-6 rounded-xl transition-all text-sm">
                🔌 Disconnect Sportybet
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080XXXXXXXX" className="w-full bg-[#0a0f1e] border border-white/5 focus:border-emerald-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full bg-[#0a0f1e] border border-white/5 focus:border-emerald-500/40 text-white rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-all" />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-sm">{showPwd ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <button onClick={connect} disabled={loading || !phone || !password} className="w-full bg-[#16a34a] hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                🔗 Connect Sportybet
              </button>
              <div className="bg-amber-500/10 border-l-4 border-l-amber-500 p-3 rounded-r-xl mt-4">
                <p className="text-xs text-amber-500/80 font-medium">Your credentials are encrypted and never exposed to other users.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONVERTER API */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden p-5">
        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">🔗 Bet Code Converter</h2>
        <p className="text-xs text-slate-500 mb-4">StrikeSignal converts signals to Sportybet share links automatically via the converter API</p>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-slate-300 font-bold">Converter API Connected</span>
        </div>
        <div className="max-w-sm space-y-4">
          <input disabled value="https://backend-production-2d71.../convert" className="w-full bg-[#0a0f1e] border border-white/5 text-slate-500 rounded-xl px-4 py-2 text-sm outline-none cursor-not-allowed font-mono" />
          <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl transition-all text-xs">Test Connection</button>
        </div>
      </div>

      {/* STAKE SETTINGS */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden p-5">
        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">Global Stake Settings</h2>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">% Stake per signal</label>
            <select value={stakePct} onChange={e => setStakePct(e.target.value)} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none mb-2">
              <option value="1">1%</option><option value="2">2% — Recommended</option><option value="3">3%</option><option value="5">5%</option><option value="custom">Custom</option>
            </select>
            <div className="text-[10px] text-slate-500">Currently applied: {stakePct}%</div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Minimum odds to bet</label>
            <input type="number" step="0.01" value={minOdds} onChange={e => setMinOdds(e.target.value)} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>
        </div>
        <button className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20">Save Settings</button>
      </div>
    </div>
  );
}
