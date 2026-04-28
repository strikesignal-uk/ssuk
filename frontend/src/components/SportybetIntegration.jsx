import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function SportybetIntegration({ status, onUpdate, isPro }) {
  const [connected, setConnected] = useState(false);
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [balanceFormatted, setBalanceFormatted] = useState("₦0.00");
  const [sessionKey, setSessionKey] = useState("");
  const [connectedAt, setConnectedAt] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/sportybet/status`, { headers: hdrs() })
      .then(r => r.json())
      .then(data => {
        setConnected(data.connected);
        if (data.connected) {
          setMaskedPhone(data.phone);
          setBalance(data.balance);
          setBalanceFormatted(data.balanceFormatted);
          setSessionKey(data.sessionKey);
          setConnectedAt(data.connectedAt);
        }
      })
      .catch(() => {});
  }, []);

  async function handleConnect() {
    if (!phone || !password) {
      setError("Please enter both phone and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/sportybet/connect`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();

      if (data.success) {
        setConnected(true);
        setMaskedPhone(data.phone);
        setBalance(data.balance);
        setBalanceFormatted(data.balanceFormatted);
        setSessionKey(data.sessionKey);
        setPassword("");
        setPhone("");
      } else {
        setError(data.error || "Connection failed");
      }
    } catch (err) {
      setError("Network error connecting to server");
    }

    setLoading(false);
  }

  async function handleDisconnect() {
    const confirmed = window.confirm("Are you sure? Disconnecting will stop all active bots.");
    if (!confirmed) return;

    try {
      await fetch(`${API}/api/sportybet/disconnect`, { method: "POST", headers: hdrs() });
      setConnected(false);
      setBalance(0);
      setBalanceFormatted("₦0.00");
      setMaskedPhone("");
      setSessionKey("");
    } catch (err) {
      alert("Failed to disconnect properly.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          🔗 SPORTYBET ACCOUNT CONNECTION
        </h2>
        <p className="text-sm text-slate-400">
          Connect your Sportybet account to enable one-click betting and automation bots.
        </p>
      </div>
      
      {!isPro ? (
        <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">💎</div>
          <h3 className="text-xl font-black text-white">Upgrade to Pro</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Sportybet integration and automated betting is exclusively available for Pro subscribers.
          </p>
          <a href="/pricing" className="inline-block bg-gradient-to-r from-blue-600 to-blue-400 text-white font-black px-6 py-3 rounded-xl mt-4">
            View Pro Plans
          </a>
        </div>
      ) : !connected ? (
        <div className="space-y-6">
          <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-2xl p-6 shadow-xl">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PHONE NUMBER</label>
                <input 
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f59e0b] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PASSWORD</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f59e0b] transition-colors pr-12"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold px-2 py-1"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 rounded-r-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <button 
                onClick={handleConnect}
                disabled={loading}
                className="w-full bg-[#16a34a] hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Connecting...
                  </>
                ) : (
                  "🔗 Connect Sportybet"
                )}
              </button>

              {loading && (
                <div className="text-center mt-2 animate-pulse">
                  <p className="text-sm font-bold text-blue-400">🔄 Logging into Sportybet...</p>
                  <p className="text-xs text-slate-500 italic mt-1">This may take 15-30 seconds depending on Cloudflare.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0f1729] border-l-4 border-[#f59e0b] p-4 rounded-r-lg">
            <p className="text-sm font-medium text-amber-500 flex gap-2">
              <span>🔒</span> Your credentials are encrypted and never exposed to other users.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-600/15 border border-[#16a34a] p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-2xl shrink-0">
              ✅
            </div>
            <div>
              <h3 className="text-green-400 font-black text-lg">Connected</h3>
              <p className="text-green-500/80 text-sm font-medium">Sportybet account: {maskedPhone}</p>
            </div>
          </div>

          <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase mb-4">What's connected</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-green-500">✅</span> Account session active
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-green-500">✅</span> Balance tracking enabled
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-green-500">✅</span> One-click bet placement ready
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-green-500">✅</span> Automation bot execution ready
              </li>
            </ul>
          </div>

          <div className="bg-[#0f1729] border-l-4 border-[#f59e0b] p-4 rounded-r-lg">
            <p className="text-sm font-medium text-amber-500 flex gap-2">
              <span>🔒</span> Your credentials are encrypted and never exposed to other users.
            </p>
          </div>

          <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span className="text-green-500">✅</span> Sportybet Session Key <span className="text-slate-400">✓ Saved</span>
              </div>
              <div className="font-mono text-slate-300 text-sm bg-[#0f1729] px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                {sessionKey}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleDisconnect}
              className="border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              🔌 Disconnect Sportybet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
