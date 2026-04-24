import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function ApiKeyCard({ title, icon, inputValue, onChange, masked, onSave, saveKey, savedKey, linkHref, linkLabel, extraNote }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">API Key</label>
          <input
            type="password"
            value={inputValue}
            onChange={e => onChange(e.target.value)}
            placeholder={masked || `Enter your ${title} key`}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {linkHref && (
            <p className="text-xs text-slate-600 mt-1.5">
              Get from{' '}
              <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {linkLabel}
              </a>
              {extraNote ? ` — ${extraNote}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSave(saveKey)}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/10"
          >
            Save
          </button>
          {savedKey === saveKey && <span className="text-emerald-400 text-sm font-medium">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [maskedGemini, setMaskedGemini] = useState('');
  const [resendKey, setResendKey] = useState('');
  const [maskedResend, setMaskedResend] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [saved, setSaved] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        const data = await res.json();
        setMaskedKey(data.sportmonksApiKey || '');
        setMaskedGemini(data.geminiApiKey || '');
        setMaskedResend(data.resendApiKey || '');
        setEmailFrom(data.emailFrom || '');
      } catch {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(field) {
    setSaved('');
    setError('');
    const body = {};
    if (field === 'sportmonks' && apiKey) body.sportmonksApiKey = apiKey;
    else if (field === 'gemini' && geminiKey) body.geminiApiKey = geminiKey;
    else if (field === 'resend' && resendKey) body.resendApiKey = resendKey;
    else if (field === 'emailFrom') body.emailFrom = emailFrom;
    else return;
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      if (field === 'sportmonks') { setMaskedKey('••••••••' + apiKey.slice(-4)); setApiKey(''); }
      else if (field === 'gemini') { setMaskedGemini('••••••••' + geminiKey.slice(-4)); setGeminiKey(''); }
      else if (field === 'resend') { setMaskedResend('••••••••' + resendKey.slice(-4)); setResendKey(''); }
      setSaved(field);
      setTimeout(() => setSaved(''), 3000);
    } catch {
      setError('Failed to save settings');
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-slate-500 text-sm">Loading settings…</div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white">Admin Settings</h2>
        <p className="text-slate-500 text-sm mt-0.5">Configure API keys and notification settings</p>
      </div>

      <ApiKeyCard
        title="SportMonks API"
        icon="⚙️"
        inputValue={apiKey}
        onChange={setApiKey}
        masked={maskedKey}
        onSave={handleSave}
        saveKey="sportmonks"
        savedKey={saved}
        linkHref="https://www.sportmonks.com"
        linkLabel="sportmonks.com"
        extraNote="live football data"
      />

      <ApiKeyCard
        title="Gemini AI"
        icon="🤖"
        inputValue={geminiKey}
        onChange={setGeminiKey}
        masked={maskedGemini}
        onSave={handleSave}
        saveKey="gemini"
        savedKey={saved}
        linkHref="https://aistudio.google.com/apikey"
        linkLabel="Google AI Studio"
        extraNote="powers AI-enhanced predictions"
      />

      {/* Resend Email */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2"><span>📧</span> Resend Email</h3>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">API Key</label>
          <input
            type="password"
            value={resendKey}
            onChange={e => setResendKey(e.target.value)}
            placeholder={maskedResend || 'Enter your Resend API key'}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-600 mt-1.5">
            Get from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">resend.com</a> — email notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave('resend')} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl font-semibold text-sm">Save</button>
          {saved === 'resend' && <span className="text-emerald-400 text-sm font-medium">✓ Saved</span>}
        </div>

        <div className="border-t border-slate-800 pt-4">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">From Address</label>
          <input
            type="text"
            value={emailFrom}
            onChange={e => setEmailFrom(e.target.value)}
            placeholder="StrikeSignal <noreply@yourdomain.com>"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-600 mt-1.5">Sender address for notifications</p>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => handleSave('emailFrom')} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl font-semibold text-sm">Save</button>
            {saved === 'emailFrom' && <span className="text-emerald-400 text-sm font-medium">✓ Saved</span>}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Send Test Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="Enter test recipient email"
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={async () => {
                if (!testEmail) return;
                setTestStatus('');
                setTestLoading(true);
                try {
                  const res = await fetch(`${API_URL}/api/settings/test-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: testEmail }),
                  });
                  const data = await res.json();
                  if (!res.ok) setTestStatus(`fail:${data.error}`);
                  else setTestStatus(`ok:Sent! Check inbox (ID: ${data.emailId || 'ok'})`);
                } catch {
                  setTestStatus('fail:Failed to send');
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {testLoading ? 'Sending…' : 'Send Test'}
            </button>
          </div>
          {testStatus && (
            <p className={`text-sm mt-2 font-medium ${testStatus.startsWith('ok:') ? 'text-emerald-400' : 'text-red-400'}`}>
              {testStatus.startsWith('ok:') ? '✓ ' : '⚠ '}{testStatus.slice(3)}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}
