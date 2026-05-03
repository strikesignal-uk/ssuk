import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

function getTimeSince(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " mins ago";
  const hrs = Math.floor(mins / 60);
  return hrs + " hrs ago";
}

const StatCard = ({ icon, label, value, sub, colorClass = "text-white", onClick = null }) => (
  <div 
    className={`bg-[#0d1527] border border-white/5 rounded-2xl p-5 w-full ${onClick ? 'cursor-pointer hover:border-blue-500/30 transition-all' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xl text-slate-400">{icon}</span>
    </div>
    <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
    {sub && <div className="text-xs text-slate-600 mt-1 font-medium">{sub}</div>}
  </div>
);

export default function $marketAccount({ status, onNavigate }) {
  const [bankroll, setBankroll] = useState(null);
  
  // Real Balance State
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceFormatted, setBalanceFormatted] = useState("£0.00");
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/$market/balance`, { headers: hdrs() });
      const data = await res.json();
      setBalance(data.balance || 0);
      setBalanceFormatted(data.balanceFormatted || "£0.00");
      setLastSync(data.lastBalanceSync);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetch(`${API}/api/$market/status`, { headers: hdrs() })
      .then(r => r.json())
      .then(data => {
        setConnected(data.connected);
        if (data.connected) {
          fetchBalance();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSetBankroll = () => {
    const val = prompt("Enter new bankroll amount (£):", bankroll || "");
    if (val && !isNaN(val)) setBankroll(Number(val));
  };

  const handleSetStakeLimit = () => {
    prompt("Enter new max stake limit (£):", "50000");
  };

  return (
    <div className="space-y-6">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* CUSTOM AVAILABLE BALANCE CARD */}
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-5 w-full relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Balance</span>
            <div className="flex items-center gap-2">
              {connected && (
                <button 
                  onClick={fetchBalance} 
                  disabled={refreshing}
                  className={`text-slate-400 hover:text-white transition-colors ${refreshing ? 'animate-spin opacity-50' : ''}`}
                >
                  🔄
                </button>
              )}
              <span className="text-xl text-slate-400">💼</span>
            </div>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700/50 rounded w-32 mb-2"></div>
              <div className="h-3 bg-slate-700/50 rounded w-24"></div>
            </div>
          ) : !connected ? (
            <div>
              <div className="text-2xl font-black text-slate-500">—</div>
              <button 
                onClick={() => onNavigate && onNavigate('integration')} 
                className="text-xs text-amber-500 hover:text-amber-400 font-medium mt-1 underline"
              >
                Connect $market
              </button>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-black text-emerald-400">
                {balanceFormatted}
              </div>
              {balance > 0 ? (
                <>
                  <div className="text-xs text-emerald-500 mt-1 font-medium flex items-center gap-1">
                    <span>↗</span> Ready to bet
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    🔄 Synced {getTimeSince(lastSync)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className={refreshing ? 'animate-spin' : ''}>🔄</span> Syncing...
                </div>
              )}
            </div>
          )}
        </div>

        <StatCard 
          label="Active Bets" 
          value="0" 
          colorClass="text-red-400"
          sub="↘ Currently running" 
          icon="📈" 
        />
        <StatCard 
          label="Stake Limit" 
          value="£50,000.00" 
          colorClass="text-white"
          sub="Max per signal" 
          icon="🛡️" 
          onClick={handleSetStakeLimit}
        />
        <StatCard 
          label="SS Bankroll" 
          value={bankroll ? `£${bankroll.toLocaleString('en-NG')}` : "Not set"} 
          colorClass="text-slate-400"
          sub="✏️ Use $market balance" 
          icon="✨" 
          onClick={handleSetBankroll}
        />
      </div>

      <div className="text-center text-sm font-semibold text-slate-500 bg-[#0d1527] border border-white/5 py-3 rounded-xl">
        Open bets: 0 <span className="mx-2 text-white/10">|</span> Matched: £0.00
      </div>

      {/* OPEN BETSLIPS */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Open Betslips</h2>
            <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">0</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Active bets placed through StrikeSignal</p>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px] text-center py-12">
            <p className="text-slate-500 text-sm font-medium">No open betslips found.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
