import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function Signup({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#06080F] flex text-white relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        .glass-panel { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>
      
      {/* Background orbs */}
      <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <div className="relative glass-panel rounded-[2rem] p-12 shadow-2xl overflow-hidden max-w-md w-full border border-white/5">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
          <div className="flex flex-col items-start mb-10">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="StrikeSignal" 
                className="w-[160px] h-auto mb-4 hover:opacity-90 transition-opacity"
              />
            </Link>
            <h2 className="text-3xl font-black tracking-tight mb-2">UK Market Intelligence.</h2>
            <p className="text-slate-400 text-sm">Join the platform redefining live football betting.</p>
          </div>

          <div className="space-y-6">
            {[
              { icon: '🎯', label: 'Real-time detection', desc: 'Instant live xG and attack alerts' },
              { icon: '🤖', label: 'AI-powered', desc: 'Gemini AI validates every opportunity' },
              { icon: '📊', label: 'Full tracking', desc: 'Monitor your strike rate and profits' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg border border-white/5">{f.icon}</div>
                <div>
                  <p className="text-white text-sm font-bold">{f.label}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center justify-center mb-10 text-center">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="StrikeSignal" 
                className="w-[150px] h-auto mb-3"
              />
            </Link>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">UK Market Edition</p>
          </div>

          <div className="bg-[#0A0D18]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create account</h2>
            <p className="text-slate-400 text-sm mb-8 font-medium">Free forever — no credit card required</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 font-semibold">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg"
              >
                {loading ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-8 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-bold hover:text-emerald-400 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
