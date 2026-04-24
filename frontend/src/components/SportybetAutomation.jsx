import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function SportybetAutomation({ status }) {
  const [bots, setBots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showNewBot, setShowNewBot] = useState(false);
  const [form, setForm] = useState({ name: '', market: 'Over 1.5', stakePercent: '2', minConfidence: 'High only', minuteFrom: '65', minuteTo: '85', maxBets: '5' });

  const loadData = async () => {
    try {
      const [bRes, lRes] = await Promise.all([
        fetch(`${API}/api/sportybet/bots`, { headers: hdrs() }),
        fetch(`${API}/api/sportybet/execution-log`, { headers: hdrs() })
      ]);
      if (bRes.ok) setBots(await bRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const toggleBot = async (id, active) => {
    await fetch(`${API}/api/sportybet/bots/${id}/toggle`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ active }) });
    setBots(bots.map(b => b.id === id ? { ...b, active } : b));
  };

  const saveBot = async () => {
    const res = await fetch(`${API}/api/sportybet/bots`, { method: 'POST', headers: hdrs(), body: JSON.stringify(form) });
    if (res.ok) {
      setBots([...bots, await res.json()]);
      setShowNewBot(false);
    }
  };

  const activeBots = bots.filter(b => b.active).length;
  const totalBets = logs.filter(l => l.type === 'SUCCESS').length;
  // Mock P&L logic just for display
  const totalPnl = totalBets * 500;

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">ACTIVE BOTS</div>
          <div className="text-lg sm:text-2xl font-black text-white">{activeBots} <span className="text-[10px] sm:text-xs text-slate-600 font-medium ml-1">of {bots.length} total</span></div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">TOTAL BETS</div>
          <div className="text-lg sm:text-2xl font-black text-white">{totalBets} <span className="text-[10px] sm:text-xs text-slate-600 font-medium ml-1">all time</span></div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">TOTAL P&L</div>
          <div className={`text-lg sm:text-2xl font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}₦{totalPnl.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-600 font-medium ml-1 text-slate-600">estimated</span>
          </div>
        </div>
      </div>

      {/* RECOMMENDED */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">⭐ StrikeSignal Recommended</h2>
          <p className="text-slate-500 text-xs sm:text-sm">One-click bot setups based on our best-performing signal configs — review the stake, then activate</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-[#0d1527] border-l-4 border-l-emerald-500 border-y border-r border-y-white/5 border-r-white/5 rounded-r-2xl rounded-l-md p-5 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500/10 to-transparent w-32 h-full" />
            <div className="relative z-10 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-black text-white text-sm">SS EARLY EDGE (O1.5)</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">RECOMMENDED</span>
              </div>
              <div className="mb-3">
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">EARLY EDGE</span>
              </div>
              <div className="text-xs font-bold text-slate-400 mb-3 tracking-wide">2% bankroll · Over 1.5 · all leagues</div>
              <p className="text-slate-300 text-xs mb-1.5">Early-window signals expecting 2+ goals between 55'-70'.</p>
              <p className="text-slate-300 text-xs mb-4">2% bankroll on Over 1.5, riding high xG-gap signals with one-click Sportybet placement.</p>
            </div>
            <button className="relative z-10 w-full bg-[#16a34a] hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              + Use this preset
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0d1527] border-l-4 border-l-amber-500 border-y border-r border-y-white/5 border-r-white/5 rounded-r-2xl rounded-l-md p-5 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/10 to-transparent w-32 h-full" />
            <div className="relative z-10 flex-1">
              <h3 className="font-black text-white text-sm mb-2">SS STRIKESIGNAL ORIGINAL (O1.5)</h3>
              <div className="mb-3">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SS ORIGINAL</span>
              </div>
              <div className="text-xs font-bold text-slate-400 mb-3 tracking-wide">2% bankroll · Over 1.5 · all leagues</div>
              <p className="text-slate-300 text-xs mb-1.5">Late-window config — minute 65-85 high confidence entries only.</p>
              <p className="text-slate-300 text-xs mb-4">2% bankroll on Over 1.5, single high-confidence signals only. Full bet held to full time.</p>
            </div>
            <button className="relative z-10 w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20">
              + Use this preset
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 italic">Starting points based on live data — not financial advice. Review stake and leagues before activating.</p>
      </div>

      {/* BOTS LIST */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">🤖 Automation Bots</h2>
            <p className="text-xs text-slate-500 mt-1">Auto-bets when a live signal fires — each bot fires once per match per signal angle</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">📥 Import</button>
            <button onClick={() => setShowNewBot(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20">+ New Bot</button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {bots.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No automation bots configured yet.</div>
          ) : (
            bots.map(b => (
              <div key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-white">{b.name}</span>
                    <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-500/30">CUSTOM</span>
                  </div>
                  <div className="text-xs font-medium text-slate-400 mb-1.5">{b.stakePercent}% of bank · Back Goals · {b.market} · 1 per game</div>
                  <div className="text-[10px] text-slate-600">No settled trades yet</div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="flex gap-2">
                    <button className="text-slate-500 hover:text-white p-1">🔗</button>
                    <button className="text-slate-500 hover:text-blue-400 p-1">✏️</button>
                    <button className="text-slate-500 hover:text-red-400 p-1">🗑️</button>
                  </div>
                  <button onClick={() => toggleBot(b.id, !b.active)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                      b.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${b.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {b.active ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NEW BOT MODAL */}
      {showNewBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1527] border border-blue-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-black text-white">Create New Bot</h3>
              <button onClick={() => setShowNewBot(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bot Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Market</label>
                  <select value={form.market} onChange={e => setForm({...form, market: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="Over 1.5">Over 1.5</option><option value="Over 2.5">Over 2.5</option><option value="GG">GG</option><option value="All">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stake %</label>
                  <select value={form.stakePercent} onChange={e => setForm({...form, stakePercent: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="1">1%</option><option value="2">2%</option><option value="3">3%</option><option value="5">5%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Confidence</label>
                  <select value={form.minConfidence} onChange={e => setForm({...form, minConfidence: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="High only">High only</option><option value="High+Med">High+Med</option><option value="All">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Bets / Day</label>
                  <input type="number" value={form.maxBets} onChange={e => setForm({...form, maxBets: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Minute From</label><input type="number" value={form.minuteFrom} onChange={e => setForm({...form, minuteFrom: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Minute To</label><input type="number" value={form.minuteTo} onChange={e => setForm({...form, minuteTo: e.target.value})} className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-3 py-2 text-sm outline-none" /></div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <button onClick={saveBot} disabled={!form.name} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all">Save Bot</button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTION LOG */}
      <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Execution Log</h2>
            <p className="text-xs text-slate-500 mt-1">Every auto-bet placed or attempted by your bots</p>
          </div>
          <button onClick={loadData} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">🔄 Refresh</button>
        </div>
        <div className="divide-y divide-white/5">
          {logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse mb-3"><div className="w-3 h-3 rounded-full bg-blue-400" /></div>
              <p className="text-slate-500 text-sm">No bot executions yet — activate a bot to start.</p>
            </div>
          ) : (
            logs.map((l, i) => (
              <div key={l.id || i} className="p-4 hover:bg-white/2 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{l.type === 'SUCCESS' ? '✅' : '⊗'}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${l.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{l.type}</span>
                    <span className="font-bold text-white text-sm truncate">{l.match}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono shrink-0">{l.time}</span>
                </div>
                <div className="ml-8">
                  <div className="text-xs text-slate-500 mb-1">{l.botName}</div>
                  <div className={`text-xs font-medium ${l.type === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>{l.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
