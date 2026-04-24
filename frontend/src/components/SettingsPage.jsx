import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

function Section({ title, children }) {
  return (
    <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-black text-white uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, type = 'text', onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-700 outline-none transition-colors" />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage({ user, onUserUpdate }) {
  const token = localStorage.getItem('ss_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [profMsg, setProfMsg] = useState('');
  const [profErr, setProfErr] = useState('');
  const [profSaving, setProfSaving] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState(user?.notifications ?? true);



  const saveProfile = async () => {
    setProfSaving(true); setProfMsg(''); setProfErr('');
    const body = {};
    if (name !== user?.name) body.name = name;
    if (email !== user?.email) body.email = email;
    if (password) body.password = password;
    if (!Object.keys(body).length) { setProfSaving(false); return; }
    const res = await fetch(`${API}/api/auth/profile`, { method: 'PUT', headers, body: JSON.stringify(body) });
    const d = await res.json();
    if (res.ok) { setProfMsg('Profile updated'); onUserUpdate?.(d); setPassword(''); }
    else setProfErr(d.error || 'Error');
    setProfSaving(false);
  };

  const saveNotifs = async val => {
    setNotifs(val);
    await fetch(`${API}/api/auth/notifications`, { method: 'PUT', headers, body: JSON.stringify({ enabled: val }) });
  };



  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and integrations</p>
      </div>

      {/* Profile */}
      <Section title="My Profile">
        {profMsg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2 rounded-xl">✅ {profMsg}</div>}
        {profErr && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-xl">⚠ {profErr}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Display Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <Field label="Email" value={email} type="email" onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <Field label="New Password (leave blank to keep current)" value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
        <button onClick={saveProfile} disabled={profSaving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
          {profSaving ? 'Saving…' : 'Save Profile'}
        </button>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Toggle label="Email Alerts" desc="Get notified when new signals fire" checked={notifs} onChange={saveNotifs} />
      </Section>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
        <h2 className="text-sm font-black text-red-400 uppercase tracking-widest mb-3">Danger Zone</h2>
        <p className="text-slate-500 text-sm mb-4">Need help or want to delete your account? Contact support.</p>
        <button className="text-red-400 border border-red-500/20 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
}
