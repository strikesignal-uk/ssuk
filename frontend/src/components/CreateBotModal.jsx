import React, { useState, useEffect, useRef } from 'react';

const ALL_LEAGUES = [
  'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
  'Championship', 'Eredivisie', 'Liga Portugal', 'Super Lig', '2. Bundesliga'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateBotModal({ onClose, onSave, initialData }) {
  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    exitStrategy: 'original',
    stakingMethod: 'percent',
    stakeValue: '2',
    oversLine: 'over_1.5',
    minConfidence: 'medium',
    leagues: [],
    minOdds: '',
    maxOdds: '',
    startMinute: '',
    stopMinute: '',
    oneEntryPerGame: true,
    onlyLateOneGoal: true,
    onlyEarlyTwoGoals: false,
    maxConcurrentBets: '5',
    simulationMode: false,
    scheduleEnabled: false,
    scheduleDays: [],
    scheduleStart: '',
    scheduleEnd: '',
  });

  const [errors, setErrors] = useState({});
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize from props
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Click outside listener for custom dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLeagueDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // --- Handlers ---
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const toggleLeague = (league) => {
    const current = formData.leagues;
    const isSelected = current.includes(league);
    handleChange('leagues', isSelected ? current.filter(l => l !== league) : [...current, league]);
  };

  const toggleDay = (day) => {
    const current = formData.scheduleDays;
    const isSelected = current.includes(day);
    handleChange('scheduleDays', isSelected ? current.filter(d => d !== day) : [...current, day]);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bot Name is required';
    if (formData.leagues.length === 0) newErrors.leagues = 'Select at least one league';
    
    const stake = parseFloat(formData.stakeValue);
    if (isNaN(stake) || stake <= 0) {
      newErrors.stakeValue = 'Enter a valid stake';
    } else {
      if (formData.stakingMethod === 'flat' && stake < 500) {
        newErrors.stakeValue = 'Minimum flat stake is £500';
      }
      if (formData.stakingMethod === 'percent' && (stake < 1 || stake > 10)) {
        newErrors.stakeValue = '% stake must be between 1% and 10%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  // --- Dynamic Stake Labels ---
  const getStakeLabel = () => {
    switch (formData.stakingMethod) {
      case 'flat': return 'Fixed Stake Amount (£)';
      case 'percent': return '% of $market Balance';
      case 'drip': return 'Total Stake to Split (£)';
      case 'percent_drip': return '% of Balance to Split';
      default: return 'Stake';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-[16px] w-full max-w-[620px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a2744] z-20 px-6 py-4 border-b border-[#1e3a8a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-bold text-white">Create Automation Bot</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 w-8 h-8 flex items-center justify-center rounded-full">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-8">
          
          {/* SECTION 1: BOT NAME */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">Bot Name</label>
            <input 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. SS Early Edge Strategy"
              className={`w-full bg-[#0f1729] border ${errors.name ? 'border-red-500' : 'border-[#1e3a8a]'} text-white rounded-xl px-4 py-3 outline-none focus:border-[#f59e0b] transition-colors`} 
            />
            {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
          </div>

          {/* SECTION 2: EXIT STRATEGY */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 group relative w-max">
              Exit Strategy <span className="text-white/40 cursor-help">ℹ️</span>
              <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Choose how your bot manages the bet after entry. Original holds to full time. Early Edge uses smart exit when 2 goals hit.
              </div>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original */}
              <div 
                onClick={() => handleChange('exitStrategy', 'original')}
                className={`bg-[#0f1729] p-3.5 rounded-[10px] cursor-pointer transition-all ${
                  formData.exitStrategy === 'original' ? 'border-2 border-[#f59e0b] bg-[#1a2744]' : 'border border-[#1e3a8a]'
                }`}
              >
                <div className="mb-2"><span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span></div>
                <h4 className="font-bold text-white mb-1 text-sm">StrikeSignal Original</h4>
                <p className="text-xs text-slate-400 leading-relaxed">The OG StrikeSignal config. Just bet the 1 goal needed to win outright. No cash out required.</p>
              </div>
              {/* Early Edge */}
              <div 
                onClick={() => handleChange('exitStrategy', 'early_edge')}
                className={`bg-[#0f1729] p-3.5 rounded-[10px] cursor-pointer transition-all ${
                  formData.exitStrategy === 'early_edge' ? 'border-2 border-[#f59e0b] bg-[#1a2744]' : 'border border-[#1e3a8a]'
                }`}
              >
                <div className="mb-2"><span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ADVANCED</span></div>
                <h4 className="font-bold text-white mb-1 text-sm">EARLY EDGE</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Signals triggering between 55th and 70th min where we expect 2+ goals.</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: STAKING METHOD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 group relative w-max">
              Staking Method <span className="text-white/40 cursor-help">ℹ️</span>
              <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Choose how your stake is calculated per bet. % of balance scales with your bankroll.
              </div>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'flat', label: 'Flat', badge: 'RECOMMENDED', badgeColor: 'bg-green-600', sub: 'Fixed £ per bet' },
                { id: 'percent', label: '%', badge: 'RECOMMENDED', badgeColor: 'bg-green-600', sub: '% of balance' },
                { id: 'drip', label: 'Drip', badge: 'ADVANCED', badgeColor: 'bg-blue-500', sub: 'Split £ across N bets' },
                { id: 'percent_drip', label: '% Drip', badge: 'ADVANCED', badgeColor: 'bg-blue-500', sub: 'Split % across N bets' }
              ].map(method => (
                <div 
                  key={method.id}
                  onClick={() => handleChange('stakingMethod', method.id)}
                  className={`bg-[#0f1729] p-3 rounded-[10px] cursor-pointer flex flex-col items-center text-center transition-all ${
                    formData.stakingMethod === method.id ? 'border-2 border-[#f59e0b] bg-[#1a2744]' : 'border border-[#1e3a8a]'
                  }`}
                >
                  <span className={`${method.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mb-1.5`}>{method.badge}</span>
                  <span className="font-bold text-white text-sm mb-1">{method.label}</span>
                  <span className="text-[10px] text-slate-400">{method.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: STAKE INPUT */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">{getStakeLabel()}</label>
            <input 
              type="number"
              step="0.01"
              value={formData.stakeValue} 
              onChange={e => handleChange('stakeValue', e.target.value)}
              className={`w-full bg-[#0f1729] border ${errors.stakeValue ? 'border-red-500' : 'border-[#1e3a8a]'} text-white rounded-xl px-4 py-3 outline-none focus:border-[#f59e0b] transition-colors`} 
            />
            {errors.stakeValue && <p className="text-red-400 text-xs mt-1.5">{errors.stakeValue}</p>}
            
            <div className="mt-3 space-y-1.5">
              {(formData.stakingMethod === 'percent' || formData.stakingMethod === 'percent_drip') && (
                <p className="text-xs text-yellow-400 font-medium flex items-start gap-1.5">
                  <span>💡</span> We recommend 2.5% of your bankroll — your stakes scale automatically as you grow.
                </p>
              )}
              <p className="text-xs text-slate-400 pl-5">
                e.g. 2 = {formData.stakingMethod.includes('percent') ? '2% of your available balance' : '£2'} at signal time
              </p>
              <p className="text-xs text-amber-500 flex items-start gap-1.5 pt-1">
                <span>⚠️</span> Bots cap at £50,000 per entry — if your % stake exceeds £50,000 at signal time, it will be reduced automatically.
              </p>
            </div>
          </div>

          {/* SECTION 5: OVERS LINES */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 group relative w-max">
              Overs Lines <span className="text-white/40 cursor-help">ℹ️</span>
              <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Select which market your bot will bet on.
              </div>
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {['all', 'over_0.5', 'over_1.5', 'over_2.5'].map(line => (
                <button
                  key={line}
                  onClick={() => handleChange('oversLine', line)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    formData.oversLine === line 
                      ? 'bg-[#f59e0b] text-[#0f1729] shadow-lg shadow-amber-500/20' 
                      : 'bg-[#0f1729] border border-[#1e3a8a] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {line === 'all' ? 'All Markets' : line.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
            {formData.oversLine === 'over_1.5' && (
              <p className="text-xs text-amber-500 font-medium">
                🔒 Locked to Over 1.5 — this is the only line the StrikeSignal Recommended preset is tuned for. Build a custom bot if you want to bet other lines.
              </p>
            )}
          </div>

          {/* SECTION 5.5: MINIMUM CONFIDENCE */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 group relative w-max">
              Minimum Confidence <span className="text-white/40 cursor-help">ℹ️</span>
              <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Only place bets on signals with this confidence level or higher.
              </div>
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {[
                { value: 'low', label: 'Low (All Signals)', color: 'border-slate-500' },
                { value: 'medium', label: 'Medium & High', color: 'border-blue-500' },
                { value: 'high', label: 'High Only', color: 'border-green-500' }
              ].map(conf => (
                <button
                  key={conf.value}
                  onClick={() => handleChange('minConfidence', conf.value)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    formData.minConfidence === conf.value 
                      ? 'bg-[#f59e0b] text-[#0f1729] shadow-lg shadow-amber-500/20' 
                      : `bg-[#0f1729] border ${conf.color} text-slate-300 hover:border-[#f59e0b]`
                  }`}
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 6: LEAGUES */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-bold text-white mb-2">Leagues to trade</label>
            <button 
              onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
              className={`w-full bg-[#0f1729] border ${errors.leagues ? 'border-red-500' : 'border-[#1e3a8a]'} text-left text-white rounded-xl px-4 py-3 outline-none flex items-center justify-between transition-colors`}
            >
              <span className="text-sm">Select Leagues</span>
              <span className="bg-[#f59e0b] text-[#0f1729] text-[10px] font-black px-2 py-0.5 rounded-full">
                {formData.leagues.length} selected
              </span>
            </button>
            {errors.leagues && <p className="text-red-400 text-xs mt-1.5">{errors.leagues}</p>}
            
            {showLeagueDropdown && (
              <div className="absolute top-full mt-2 w-full bg-[#0f1729] border border-[#1e3a8a] rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a8a] bg-[#1a2744]">
                  <button onClick={() => handleChange('leagues', [...ALL_LEAGUES])} className="text-xs text-blue-400 hover:text-white font-medium">Select All</button>
                  <button onClick={() => handleChange('leagues', [])} className="text-xs text-blue-400 hover:text-white font-medium">Deselect All</button>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 custom-scrollbar">
                  {ALL_LEAGUES.map(league => (
                    <label key={league} className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a2744] rounded-lg cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        formData.leagues.includes(league) ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-slate-500 bg-transparent'
                      }`}>
                        {formData.leagues.includes(league) && <span className="text-[#0f1729] text-xs font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-sm text-slate-200">{league}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7 & 8: ODDS & MINUTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-white group relative w-max">
                Odds Range <span className="text-white/40 cursor-help">ℹ️</span>
                <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Only enter bets within this odds range. Leave blank for no restriction.
                </div>
              </label>
              <div className="flex gap-3">
                <input type="number" step="0.01" placeholder="Min (e.g. 1.5)" value={formData.minOdds} onChange={e => handleChange('minOdds', e.target.value)} className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f59e0b]" />
                <input type="number" step="0.01" placeholder="Max (e.g. 6.0)" value={formData.maxOdds} onChange={e => handleChange('maxOdds', e.target.value)} className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f59e0b]" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-white group relative w-max">
                Minute Window <span className="text-white/40 cursor-help">ℹ️</span>
                <div className="absolute left-full ml-2 w-64 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Match-minute window applies to new entries only. Leave both blank to use the signal's default window.
                </div>
              </label>
              <div className="flex gap-3">
                <input type="number" min="1" max="89" placeholder="Start (e.g. 55)" value={formData.startMinute} onChange={e => handleChange('startMinute', e.target.value)} className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f59e0b]" />
                <input type="number" min="1" max="90" placeholder="Stop (e.g. 85)" value={formData.stopMinute} onChange={e => handleChange('stopMinute', e.target.value)} className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f59e0b]" />
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">Leave both blank to use the signal's default window.</p>
            </div>
          </div>

          {/* SECTION 9: BEHAVIOUR TOGGLES */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">Behaviour Toggles</label>
            <div className="space-y-2">
              
              <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-[10px] p-3.5 flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">One entry per game</h4>
                  <p className="text-xs text-slate-400">Skip a game if the bot has already entered any bet on it — even for a different signal.</p>
                </div>
                <button 
                  onClick={() => handleChange('oneEntryPerGame', !formData.oneEntryPerGame)}
                  className={`w-11 h-6 shrink-0 rounded-full transition-colors relative ${formData.oneEntryPerGame ? 'bg-[#f59e0b]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.oneEntryPerGame ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-[10px] p-3.5 flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Only enter bets that need 1 goal (late)</h4>
                  <p className="text-xs text-slate-400">Skip pre-55' signals that require 2 more goals. The bot will only enter when one more goal settles the market — no cash-out needed.</p>
                </div>
                <button 
                  onClick={() => handleChange('onlyLateOneGoal', !formData.onlyLateOneGoal)}
                  className={`w-11 h-6 shrink-0 rounded-full transition-colors relative ${formData.onlyLateOneGoal ? 'bg-[#f59e0b]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.onlyLateOneGoal ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-[10px] p-3.5 flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Only enter early signals that need 2 goals</h4>
                  <p className="text-xs text-slate-400">Inverse of the toggle above. Skip post-55' '1 goal needed' entries and only ride pre-55' setups expecting 2+ more goals.</p>
                </div>
                <button 
                  onClick={() => handleChange('onlyEarlyTwoGoals', !formData.onlyEarlyTwoGoals)}
                  className={`w-11 h-6 shrink-0 rounded-full transition-colors relative ${formData.onlyEarlyTwoGoals ? 'bg-[#f59e0b]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.onlyEarlyTwoGoals ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* SECTION 10: MAX CONCURRENT */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2 group relative w-max">
              Max Concurrent Bets <span className="text-white/40 cursor-help">ℹ️</span>
            </label>
            <input 
              type="number"
              min="1"
              value={formData.maxConcurrentBets} 
              onChange={e => {
                const val = e.target.value;
                if (val === '') {
                  handleChange('maxConcurrentBets', '');
                } else {
                  const num = parseInt(val);
                  handleChange('maxConcurrentBets', isNaN(num) || num < 1 ? '1' : val);
                }
              }}
              placeholder="e.g. 5"
              className="w-full bg-[#0f1729] border border-[#1e3a8a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f59e0b] transition-colors" 
            />
            <p className="text-xs text-slate-500 mt-2">
              Leave empty for no cap. Useful to throttle to 2-3 bets at a time and avoid over-exposure on busy fixture nights.
            </p>
          </div>

          {/* SECTION 11: SIMULATION MODE */}
          <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-[10px] p-4">
            <div 
              onClick={() => handleChange('simulationMode', !formData.simulationMode)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  formData.simulationMode ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-slate-500 bg-transparent'
                }`}>
                  {formData.simulationMode && <span className="text-white text-xs font-bold leading-none">✓</span>}
                </div>
                <span className="text-sm font-bold text-white">Simulation mode (paper trading)</span>
              </div>
              <span className={`text-xs font-black tracking-widest ${formData.simulationMode ? 'text-[#3b82f6]' : 'text-[#f59e0b]'}`}>
                {formData.simulationMode ? 'ON — PAPER TRADING' : 'OFF — REAL MONEY'}
              </span>
            </div>
            {formData.simulationMode && (
              <p className="text-xs text-blue-400 mt-2 ml-8">
                Bets will be simulated only. No real money will be placed. Use this to test your bot config before going live.
              </p>
            )}
          </div>

          {/* SECTION 12: SCHEDULE */}
          <div className="bg-[#0f1729] border border-[#1e3a8a] rounded-[10px] p-4">
            <div 
              onClick={() => handleChange('scheduleEnabled', !formData.scheduleEnabled)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  formData.scheduleEnabled ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-slate-500 bg-transparent'
                }`}>
                  {formData.scheduleEnabled && <span className="text-[#0f1729] text-xs font-bold leading-none">✓</span>}
                </div>
                <span className="text-sm font-bold text-white">Schedule (active days & hours)</span>
              </div>
              <span className={`text-xs font-medium ${formData.scheduleEnabled ? 'text-[#f59e0b]' : 'text-slate-500'}`}>
                {formData.scheduleEnabled ? 'Custom Schedule' : 'Off — runs 24/7'}
              </span>
            </div>
            
            {formData.scheduleEnabled && (
              <div className="mt-4 ml-8 space-y-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                          formData.scheduleDays.includes(day)
                            ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
                            : 'bg-[#1a2744] border border-[#1e3a8a] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">From</label>
                    <input type="time" value={formData.scheduleStart} onChange={e => handleChange('scheduleStart', e.target.value)} className="w-full bg-[#1a2744] border border-[#1e3a8a] text-white rounded-lg px-3 py-2 text-sm outline-none custom-time focus:border-[#f59e0b]" />
                  </div>
                  <span className="text-slate-500 mt-5">to</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">To</label>
                    <input type="time" value={formData.scheduleEnd} onChange={e => handleChange('scheduleEnd', e.target.value)} className="w-full bg-[#1a2744] border border-[#1e3a8a] text-white rounded-lg px-3 py-2 text-sm outline-none custom-time focus:border-[#f59e0b]" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Bot only fires during selected days and hours.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a2744] border-t border-[#1e3a8a] p-4 flex justify-end gap-3 z-20 rounded-b-[16px]">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-amber-400 text-[#0f1729] font-black transition-colors shadow-lg shadow-amber-500/20"
          >
            {initialData ? 'Update Bot' : 'Create Bot'}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.5); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(30, 58, 138, 0.8); }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}} />
    </div>
  );
}
