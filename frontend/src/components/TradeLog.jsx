import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;
const fmt = n => '£' + Math.abs(Number(n)).toLocaleString('en-NG');
const token = () => localStorage.getItem('ss_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

const EMPTY_FORM = { match: '', market: '', odds: '', stake: '', result: 'pending', date: new Date().toISOString().slice(0, 10) };

export default function TradeLog() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/trades`, { headers: hdrs() })
      .then(r => r.json()).then(d => setTrades(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.match || !form.market || !form.odds || !form.stake) return setErr('Fill all required fields');
    setSaving(true); setErr('');
    const res = await fetch(`${API}/api/trades`, { method: 'POST', headers: hdrs(), body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || 'Error'); setSaving(false); return; }
    setTrades(prev => [d, ...prev]);
    setForm(EMPTY_FORM); setShowForm(false); setSaving(false);
  };

  const patch = async (id, result) => {
    const res = await fetch(`${API}/api/trades/${id}`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ result }) });
    const d = await res.json();
    if (res.ok) setTrades(prev => prev.map(t => t.id === id ? d : t));
  };

  const del = async id => {
    if (!confirm('Delete this trade?')) return;
    await fetch(`${API}/api/trades/${id}`, { method: 'DELETE', headers: hdrs() });
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = trades.filter(t => t.result === 'win').length;
  const losses = trades.filter(t => t.result === 'loss').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Trade Log</h1>
          <p className="text-slate-500 text-sm">{trades.length} trades recorded</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
          + Log Trade
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['P&L', `${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)}`, totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'],
          ['Trades', trades.length, 'text-white'],
          ['Wins', wins, 'text-emerald-400'],
          ['Losses', losses, 'text-red-400'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-[#0d1527] border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{l}</div>
            <div className={`text-xl font-black ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Add trade form */}
      {showForm && (
        <div className="bg-[#0d1527] border border-blue-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">New Trade</h2>
          {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-xl">⚠ {err}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { k: 'match', ph: 'e.g. Arsenal vs Chelsea', label: 'Match *' },
              { k: 'market', ph: 'e.g. Over 2.5 Goals', label: 'Market *' },
              { k: 'odds', ph: '1.85', label: 'Odds *', type: 'number' },
              { k: 'stake', ph: '5000', label: 'Stake (£) *', type: 'number' },
              { k: 'date', ph: '', label: 'Date', type: 'date' },
            ].map(({ k, ph, label, type = 'text' }) => (
              <div key={k}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} placeholder={ph}
                  className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-700 outline-none transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Result</label>
              <select value={form.result} onChange={set('result')}
                className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors">
                <option value="pending">Pending</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              {saving ? 'Saving…' : 'Save Trade'}
            </button>
            <button onClick={() => { setShowForm(false); setErr(''); setForm(EMPTY_FORM); }}
              className="bg-white/5 hover:bg-white/10 text-slate-400 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trades.length === 0 ? (
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-white font-bold mb-1">No trades yet</h3>
          <p className="text-slate-500 text-sm mb-4">Click "Log Trade" to record your first bet</p>
        </div>
      ) : (
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Date', 'Match', 'Market', 'Odds', 'Stake', 'P&L', 'Result', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(t.date || t.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap max-w-[160px] truncate">{t.match}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{t.market}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{t.odds}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(t.stake)}</td>
                    <td className={`px-4 py-3 font-black ${t.pnl > 0 ? 'text-emerald-400' : t.pnl < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {t.pnl !== 0 ? `${t.pnl > 0 ? '+' : ''}${fmt(t.pnl)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select value={t.result} onChange={e => patch(t.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer bg-transparent ${
                          t.result === 'win' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                          : t.result === 'loss' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                          : 'text-amber-400 border-amber-500/30 bg-amber-500/5'}`}>
                        <option value="pending">PENDING</option>
                        <option value="win">WIN</option>
                        <option value="loss">LOSS</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => del(t.id)} className="text-slate-700 hover:text-red-400 transition-colors text-lg">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
