import React, { useState } from 'react';

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

export default function SportybetAccount({ status }) {
  const [bankroll, setBankroll] = useState(null);

  const handleSetBankroll = () => {
    const val = prompt("Enter new bankroll amount (₦):", bankroll || "");
    if (val && !isNaN(val)) setBankroll(Number(val));
  };

  const handleSetStakeLimit = () => {
    prompt("Enter new max stake limit (₦):", "50000");
  };

  return (
    <div className="space-y-6">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard 
          label="Available Balance" 
          value="₦0.00" 
          colorClass="text-emerald-400"
          sub="↗ Ready to bet" 
          icon="💼" 
        />
        <StatCard 
          label="Active Bets" 
          value="0" 
          colorClass="text-red-400"
          sub="↘ Currently running" 
          icon="📈" 
        />
        <StatCard 
          label="Stake Limit" 
          value="₦50,000.00" 
          colorClass="text-white"
          sub="Max per signal" 
          icon="🛡️" 
          onClick={handleSetStakeLimit}
        />
        <StatCard 
          label="SS Bankroll" 
          value={bankroll ? `₦${bankroll.toLocaleString('en-NG')}` : "Not set"} 
          colorClass="text-slate-400"
          sub="✏️ Use Sportybet balance" 
          icon="✨" 
          onClick={handleSetBankroll}
        />
      </div>

      <div className="text-center text-sm font-semibold text-slate-500 bg-[#0d1527] border border-white/5 py-3 rounded-xl">
        Open bets: 0 <span className="mx-2 text-white/10">|</span> Matched: ₦0.00
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
