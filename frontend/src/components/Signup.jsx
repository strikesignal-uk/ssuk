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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <img src="/logo.png" alt="StrikeSignal" className="h-12 w-auto" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Start betting<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">smarter today</span>
          </h1>
          <p className="text-slate-400 text-lg">Join thousands using AI-powered signals to gain an edge on live football markets.</p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            { icon: '🎯', val: 'Real-time', label: 'Signal detection' },
            { icon: '🤖', val: 'AI-powered', label: 'Predictions' },
            { icon: '📧', val: 'Instant', label: 'Email alerts' },
            { icon: '📊', val: 'Full', label: 'History tracking' },
          ].map(f => (
            <div key={f.val} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-white text-sm font-bold">{f.val}</div>
              <div className="text-slate-500 text-xs">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-8">
            <img src="/logo.png" alt="StrikeSignal" className="h-10 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-8">Free forever — no credit card required</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

