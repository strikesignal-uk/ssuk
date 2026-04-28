import React, { useState, useEffect, useRef } from 'react';
import CreateBotModal from './CreateBotModal';

const API = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function SportybetAutomation({ status, isPro }) {
  const [bots, setBots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({ success: 0, error: 0, total: 0 });
  const [botStats, setBotStats] = useState({});
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [logFlash, setLogFlash] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const prevLogCount = useRef(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState(null);

  const loadBots = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API}/api/sportybet/bots`, { headers: hdrs() }),
        fetch(`${API}/api/sportybet/bots/stats`, { headers: hdrs() })
      ]);
      if (bRes.ok) setBots(await bRes.json());
      if (sRes.ok) setBotStats(await sRes.json());
    } catch {}
  };

  const fetchExecutionLog = async () => {
    try {
      const res = await fetch(`${API}/api/sportybet/execution-log`, { headers: hdrs() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setLogStats({ success: data.successCount, error: data.errorCount, total: data.total });
        if (data.total > prevLogCount.current && prevLogCount.current > 0) {
          setLogFlash(true);
          setTimeout(() => setLogFlash(false), 1500);
        }
        prevLogCount.current = data.total;
      }
    } catch (err) {
      console.error("fetchExecutionLog error:", err);
    }
  };

  const clearLogs = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    
    try {
      await fetch(`${API}/api/sportybet/execution-log`, { method: 'DELETE', headers: hdrs() });
      setLogs([]);
      setLogStats({ success: 0, error: 0, total: 0 });
      prevLogCount.current = 0;
      setConfirmClear(false);
    } catch (err) {
      console.error("clearLogs error:", err);
    }
  };

  useEffect(() => {
    loadBots();
    fetchExecutionLog();
    const interval = setInterval(fetchExecutionLog, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleBot = async (id, active) => {
    await fetch(`${API}/api/sportybet/bots/${id}/toggle`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ active }) });
    setBots(bots.map(b => b.id === id ? { ...b, active } : b));
  };

  const deleteBot = async (id) => {
    if (window.confirm("Delete this bot? This cannot be undone.")) {
      const res = await fetch(`${API}/api/sportybet/bots/${id}`, { method: 'DELETE', headers: hdrs() });
      if (res.ok) setBots(bots.filter(b => b.id !== id));
    }
  };

  const saveBot = async (formData) => {
    if (editingBot && editingBot.id) {
      const res = await fetch(`${API}/api/sportybet/bots/${editingBot.id}`, { method: 'PUT', headers: hdrs(), body: JSON.stringify(formData) });
      if (res.ok) {
        const updated = await res.json();
        setBots(bots.map(b => b.id === updated.id ? updated : b));
      }
    } else {
      const res = await fetch(`${API}/api/sportybet/bots`, { method: 'POST', headers: hdrs(), body: JSON.stringify(formData) });
      if (res.ok) setBots([...bots, await res.json()]);
    }
    setShowModal(false);
    setEditingBot(null);
  };

  const openNewBot = () => { setEditingBot(null); setShowModal(true); };
  const openEarlyEdgePreset = () => {
    setEditingBot({
      name: "SS Early Edge (O1.5)", exitStrategy: "early_edge", stakingMethod: "percent", stakeValue: '2',
      oversLine: "over_1.5", leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'],
      oneEntryPerGame: true, onlyLateOneGoal: false, onlyEarlyTwoGoals: true, maxConcurrentBets: '5',
      simulationMode: false, scheduleEnabled: false,
    });
    setShowModal(true);
  };
  const openOriginalPreset = () => {
    setEditingBot({
      name: "SS StrikeSignal Original (O1.5)", exitStrategy: "original", stakingMethod: "percent", stakeValue: '2',
      oversLine: "over_1.5", leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'],
      oneEntryPerGame: true, onlyLateOneGoal: true, onlyEarlyTwoGoals: false, maxConcurrentBets: '5',
      simulationMode: false, scheduleEnabled: false,
    });
    setShowModal(true);
  };
  const openEdit = (bot) => { setEditingBot(bot); setShowModal(true); };

  const activeBots = bots.filter(b => b.active).length;

  const getLogBorderColor = (type, sim) => {
    if (sim) return 'border-l-slate-500';
    if (type === 'SUCCESS') return 'border-l-emerald-500';
    if (type === 'ERROR') return 'border-l-red-500';
    if (type === 'ENTRY') return 'border-l-blue-500';
    return 'border-l-slate-500';
  };

  const getLogBadge = (type, sim) => {
    if (sim) return { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', label: '📊 SIM' };
    if (type === 'SUCCESS') return { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: '✅ SUCCESS' };
    if (type === 'ERROR') return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: '❌ ERROR' };
    if (type === 'ENTRY') return { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', label: '📋 ENTRY' };
    return { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', label: type };
  };

  const getStatusColor = (type, sim) => {
    if (sim) return 'text-slate-400';
    if (type === 'SUCCESS') return 'text-emerald-400';
    if (type === 'ERROR') return 'text-amber-500';
    if (type === 'ENTRY') return 'text-blue-400';
    return 'text-slate-400';
  };

  const displayedLogs = showAllLogs ? logs : logs.slice(0, 10);

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
          <div className="text-lg sm:text-2xl font-black text-white">{logStats.success} <span className="text-[10px] sm:text-xs text-slate-600 font-medium ml-1">successful</span></div>
        </div>
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">TOTAL ENTRIES</div>
          <div className="text-lg sm:text-2xl font-black text-white">{logStats.total} <span className="text-[10px] sm:text-xs text-slate-600 font-medium ml-1">all time</span></div>
        </div>
      </div>

      {/* RECOMMENDED & BOTS */}
      {!isPro ? (
        <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">💎</div>
          <h3 className="text-xl font-black text-white">Upgrade to Pro</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Automated bot execution is a Pro-only feature. Upgrade your subscription to start creating and running bots.
          </p>
          <a href="/pricing" className="inline-block bg-gradient-to-r from-blue-600 to-blue-400 text-white font-black px-6 py-3 rounded-xl mt-4">
            View Pro Plans
          </a>
        </div>
      ) : (
        <>
          {/* RECOMMENDED */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">⭐ StrikeSignal Recommended</h2>
              <p className="text-slate-500 text-xs sm:text-sm">One-click bot setups based on our best-performing signal configs</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0d1527] border-l-4 border-l-emerald-500 border-y border-r border-y-white/5 border-r-white/5 rounded-r-2xl rounded-l-md p-5 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500/10 to-transparent w-32 h-full" />
                <div className="relative z-10 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-black text-white text-sm">SS EARLY EDGE (O1.5)</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">RECOMMENDED</span>
                  </div>
                  <div className="mb-3"><span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">EARLY EDGE</span></div>
                  <div className="text-xs font-bold text-slate-400 mb-3 tracking-wide">2% bankroll · Over 1.5 · all leagues</div>
                  <p className="text-slate-300 text-xs mb-4">Early-window signals expecting 2+ goals between 55'-70'. AI-powered placement via Gemini 2.5 Pro.</p>
                </div>
                <button onClick={openEarlyEdgePreset} className="relative z-10 w-full bg-[#16a34a] hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">+ Use this preset</button>
              </div>
              <div className="bg-[#0d1527] border-l-4 border-l-amber-500 border-y border-r border-y-white/5 border-r-white/5 rounded-r-2xl rounded-l-md p-5 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/10 to-transparent w-32 h-full" />
                <div className="relative z-10 flex-1">
                  <h3 className="font-black text-white text-sm mb-2">SS STRIKESIGNAL ORIGINAL (O1.5)</h3>
                  <div className="mb-3"><span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SS ORIGINAL</span></div>
                  <div className="text-xs font-bold text-slate-400 mb-3 tracking-wide">2% bankroll · Over 1.5 · all leagues</div>
                  <p className="text-slate-300 text-xs mb-4">Late-window config — minute 65-85 high confidence entries. Full bet held to full time.</p>
                </div>
                <button onClick={openOriginalPreset} className="relative z-10 w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20">+ Use this preset</button>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 italic">Starting points based on live data — not financial advice.</p>
          </div>

          {/* BOTS LIST */}
          <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">🤖 Automation Bots</h2>
                <p className="text-xs text-slate-500 mt-1">AI-powered bots fire when signals match — Gemini 2.5 Pro handles popups and places bets</p>
              </div>
              <div className="flex gap-2">
                <button onClick={openNewBot} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20">+ New Bot</button>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {bots.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No automation bots configured yet.</div>
              ) : (
            bots.map(b => {
              const stakeDisplay = b.stakingMethod?.includes('percent') ? `${b.stakeValue}% of bank` : `₦${b.stakeValue}`;
              const oversLabel = b.oversLine === 'over_0.5' ? 'O0.5' : b.oversLine === 'over_2.5' ? 'O2.5' : 'O1.5';
              let tagText = 'CUSTOM';
              if (b.exitStrategy === 'early_edge') tagText = 'SS EARLY EDGE';
              else if (b.exitStrategy === 'original') tagText = 'SS ORIGINAL';

              const stats = botStats[b.id] || {};

              return (
                <div key={b.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${b.active ? 'hover:bg-white/5' : 'opacity-60 hover:bg-white/5'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-white">{b.name}</span>
                      <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-500/30 uppercase">{tagText}</span>
                      {b.simulationMode && <span className="bg-slate-500/20 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-500/30">SIM</span>}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mb-1">
                      {stakeDisplay} · {oversLabel} · {b.oneEntryPerGame ? '1 per game' : 'Multiple entries'}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {stats.totalBets > 0 
                        ? `${stats.totalBets} bets · ${stats.successBets || 0} successful · ${stats.failedBets || 0} failed`
                        : 'No bets yet'
                      }
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-slate-500 hover:text-blue-400 p-1 transition-colors" title="Edit Bot">✏️</button>
                      <button onClick={() => deleteBot(b.id)} className="text-slate-500 hover:text-red-400 p-1 transition-colors" title="Delete Bot">🗑️</button>
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
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <CreateBotModal onClose={() => setShowModal(false)} onSave={saveBot} initialData={editingBot} />
      )}

      {/* EXECUTION LOG */}
      <div className={`bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden transition-all ${logFlash ? 'ring-2 ring-emerald-500/40' : ''}`}>
        <div className="p-4 sm:p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Execution Log</h2>
              <p className="text-xs text-slate-500 mt-1">Every auto-bet placed or attempted by your bots</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchExecutionLog} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">🔄 Refresh</button>
              {logStats.total > 0 && (
                <button onClick={clearLogs} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${confirmClear ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-slate-800 hover:bg-red-900/50 text-red-400'}`}>
                  {confirmClear ? '⚠️ Sure?' : '🗑️ Clear'}
                </button>
              )}
            </div>
          </div>
          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full">✅ {logStats.success} successful</span>
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full">❌ {logStats.error} failed</span>
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full">📊 {logStats.total} total</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse mb-3"><div className="w-3 h-3 rounded-full bg-blue-400" /></div>
              <p className="text-slate-500 text-sm">No bot executions yet — activate a bot to start.</p>
            </div>
          ) : (
            <>
              {displayedLogs.map((l, i) => {
                const badge = getLogBadge(l.type, l.simulation);
                return (
                  <div key={l.id || i} className={`p-4 border-l-4 ${getLogBorderColor(l.type, l.simulation)} hover:bg-white/[0.02] transition-colors`}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        <span className="font-bold text-white text-sm truncate">{l.match}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono shrink-0">{l.time}</span>
                    </div>
                    <div className="ml-0 sm:ml-2">
                      <div className="text-xs text-slate-500 mb-1">{l.botName}</div>
                      <div className={`text-xs font-medium ${getStatusColor(l.type, l.simulation)}`}>{l.status}</div>
                      {l.aiSteps && <div className="text-[10px] text-slate-600 mt-1">🤖 AI steps: {l.aiSteps}</div>}
                    </div>
                  </div>
                );
              })}
              {logs.length > 10 && !showAllLogs && (
                <div className="p-4 text-center">
                  <button onClick={() => setShowAllLogs(true)} className="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors">
                    Load more ({logs.length - 10} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
