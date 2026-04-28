import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link — no token found.');
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 text-center">
          <img 
            src="/logo.png" 
            alt="StrikeSignal" 
            className="w-[140px] md:w-[180px] h-auto mb-2"
          />
          <p className="text-[#3b82f6] text-xs font-medium mt-0.5">Live Goal Intelligence</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {success ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
              <h2 className="text-xl font-bold text-white mb-2">Password updated!</h2>
              <p className="text-slate-400 text-sm mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-sm text-center transition-all shadow-lg shadow-blue-500/20"
              >
                Sign In →
              </Link>
            </div>
          ) : (
            /* ── RESET FORM ── */
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-5">🔑</div>
              <h2 className="text-2xl font-bold text-white mb-1">Set new password</h2>
              <p className="text-slate-500 text-sm mb-6">Choose a strong password for your account.</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5">
                  <span>⚠</span> {error}
                </div>
              )}

              {!token ? (
                <div className="text-center">
                  <p className="text-slate-500 text-sm mb-4">This reset link is invalid or has expired.</p>
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-semibold">← Back to Sign In</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        id="reset-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 pr-12 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 ${strengthColor[strength].replace('bg-', 'text-')}`}>{strengthLabel[strength]}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      id="reset-confirm"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        confirm && confirm !== password
                          ? 'border-red-500/50 focus:ring-red-500'
                          : confirm && confirm === password
                          ? 'border-emerald-500/50 focus:ring-emerald-500'
                          : 'border-slate-700 focus:ring-amber-500'
                      }`}
                      placeholder="Repeat your password"
                    />
                    {confirm && confirm === password && (
                      <p className="text-emerald-400 text-xs mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="reset-submit"
                    disabled={loading || !token}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                  >
                    {loading ? 'Updating…' : 'Update Password →'}
                  </button>

                  <p className="text-center text-xs text-slate-600">
                    Remember your password?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign In</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
