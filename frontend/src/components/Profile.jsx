import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile({ user, onUserUpdate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  const token = localStorage.getItem('ss_token');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setNotifications(data.notifications ?? true);
      } catch {
        setProfileError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    if (newPassword && newPassword.length < 6) { setProfileError('Password must be at least 6 characters'); return; }
    if (newPassword && newPassword !== confirmPassword) { setProfileError('Passwords do not match'); return; }
    const body = {};
    if (name.trim()) body.name = name.trim();
    if (email.trim()) body.email = email.trim();
    if (newPassword) body.password = newPassword;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data.error || 'Failed to save profile'); return; }
      setName(data.name || name);
      setEmail(data.email || email);
      setNewPassword('');
      setConfirmPassword('');
      setProfileMsg('Profile saved successfully');
      setTimeout(() => setProfileMsg(''), 3000);
      if (onUserUpdate) onUserUpdate({ ...user, name: data.name, email: data.email });
      const stored = localStorage.getItem('ss_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('ss_user', JSON.stringify({ ...u, name: data.name, email: data.email }));
      }
    } catch {
      setProfileError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotifications() {
    setNotifMsg('');
    const next = !notifications;
    setNotifSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error();
      setNotifications(next);
      setNotifMsg(next ? 'Email notifications enabled' : 'Email notifications disabled');
      setTimeout(() => setNotifMsg(''), 3000);
    } catch {
      setNotifMsg('Failed to update notification setting');
    } finally {
      setNotifSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-slate-500 text-sm">Loading profile…</div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Avatar + name */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-blue-500/20 flex-shrink-0">
          {name.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <div className="text-white font-bold text-lg">{name}</div>
          <div className="text-slate-500 text-sm">{email}</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-blue-400">✎</span> Edit Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-sm font-medium text-slate-400 mb-3">Change Password <span className="text-slate-600 font-normal">(leave blank to keep current)</span></p>
            <div className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {profileError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
              <span>⚠</span> {profileError}
            </div>
          )}
          {profileMsg && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl">
              <span>✓</span> {profileMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span className="text-violet-400">🔔</span> Email Notifications
        </h2>
        <p className="text-slate-500 text-sm mb-5">Receive email alerts when new betting signals are detected.</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Signal alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {notifications ? 'Emails are enabled' : 'Notifications are off'}
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={notifSaving}
            className={`relative inline-flex h-7 w-13 w-[52px] items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
              notifications ? 'bg-gradient-to-r from-blue-600 to-violet-600' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={notifications}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${notifications ? 'translate-x-[28px]' : 'translate-x-1'}`} />
          </button>
        </div>

        {notifMsg && (
          <p className={`text-sm mt-3 ${notifMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
            {notifMsg}
          </p>
        )}
      </div>
    </div>
  );
}


