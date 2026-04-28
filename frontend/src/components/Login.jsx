import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot-password inline state
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <img 
            src="/logo.png" 
            alt="StrikeSignal" 
            className="w-[140px] md:w-[180px] h-auto mb-2"
          />
          <p className="text-[#3b82f6] text-sm font-medium">Live Goal Intelligence</p>
        </div>

        <div className="relative z-10 space-y-4 mt-8">
          {[
            { icon: '⚡', label: 'Live Signal Detection', desc: 'Instant alerts during matches' },
            { icon: '🤖', label: 'AI-Enhanced Predictions', desc: 'Powered by Gemini AI' },
            { icon: '📊', label: 'Performance Tracking', desc: 'Track your win rate over time' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-base border border-slate-700">{f.icon}</div>
              <div className="text-left">
                <p className="text-slate-200 text-sm font-semibold">{f.label}</p>
                <p className="text-slate-500 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center justify-center mb-8 text-center">
            <img 
              src="/logo.png" 
              alt="StrikeSignal" 
              className="w-[140px] h-auto mb-2"
            />
            <p className="text-[#3b82f6] text-xs font-medium mt-0.5">Live Goal Intelligence</p>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm mb-8">Sign in to your account</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-400">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setForgotEmail(email); setForgotSent(false); setForgotError(''); }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  id="login-submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-6">
                No account?{' '}
                <Link to="/signup" className="text-blue-400 font-semibold hover:text-blue-300">Create one free</Link>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD FORM ── */}
          {mode === 'forgot' && (
            <>
              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors"
              >
                ← Back to Sign In
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-5">🔑</div>
              <h2 className="text-2xl font-bold text-white mb-1">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

              {forgotSent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-3">📬</div>
                  <h3 className="text-emerald-400 font-bold mb-1">Check your inbox</h3>
                  <p className="text-slate-400 text-sm">
                    If <span className="text-white font-medium">{forgotEmail}</span> is registered, a reset link has been sent. It expires in 1 hour.
                  </p>
                  <button
                    onClick={() => setMode('login')}
                    className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {forgotError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5">
                      <span>⚠</span> {forgotError}
                    </div>
                  )}
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Email address</label>
                      <input
                        type="email"
                        id="forgot-email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                    <button
                      type="submit"
                      id="forgot-submit"
                      disabled={forgotLoading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? 'Sending…' : 'Send Reset Link →'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
