import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

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
    if (field === 'sportmonks' && apiKey) {
      body.sportmonksApiKey = apiKey;
    } else if (field === 'gemini' && geminiKey) {
      body.geminiApiKey = geminiKey;
    } else if (field === 'resend' && resendKey) {
      body.resendApiKey = resendKey;
    } else if (field === 'emailFrom') {
      body.emailFrom = emailFrom;
    } else return;

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      if (field === 'sportmonks') {
        setMaskedKey('••••••••' + apiKey.slice(-4));
        setApiKey('');
      } else if (field === 'gemini') {
        setMaskedGemini('••••••••' + geminiKey.slice(-4));
        setGeminiKey('');
      } else if (field === 'resend') {
        setMaskedResend('••••••••' + resendKey.slice(-4));
        setResendKey('');
      }
      setSaved(field);
      setTimeout(() => setSaved(''), 3000);
    } catch {
      setError('Failed to save settings');
    }
  }

  if (loading) return <div className="text-gray-400 text-center py-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      {/* SportMonks API Key */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">⚙️ SportMonks API</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={maskedKey || 'Enter your SportMonks API key'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your API key from{' '}
              <a href="https://www.sportmonks.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                sportmonks.com
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('sportmonks')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold text-sm"
            >
              Save
            </button>
            {saved === 'sportmonks' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Gemini AI API Key */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">🤖 Gemini AI</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder={maskedGemini || 'Enter your Gemini API key'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your API key from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Google AI Studio
              </a>
              {' '}— powers AI-enhanced predictions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('gemini')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 font-semibold text-sm"
            >
              Save
            </button>
            {saved === 'gemini' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Resend Email */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">📧 Resend Email</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={resendKey}
              onChange={e => setResendKey(e.target.value)}
              placeholder={maskedResend || 'Enter your Resend API key'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your API key from{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                resend.com
              </a>
              {' '}— powers email notifications to users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('resend')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-semibold text-sm"
            >
              Save
            </button>
            {saved === 'resend' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Address
            </label>
            <input
              type="text"
              value={emailFrom}
              onChange={e => setEmailFrom(e.target.value)}
              placeholder="StrikeSignal <noreply@yourdomain.com>"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sender address for notifications (default: onboarding@resend.dev)
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => handleSave('emailFrom')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 font-semibold text-sm"
              >
                Save
              </button>
              {saved === 'emailFrom' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📨 Send Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Enter email to test"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
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
                    if (!res.ok) setTestStatus(`❌ ${data.error}`);
                    else setTestStatus(`✅ Test email sent (ID: ${data.emailId || 'ok'}). Check your inbox & spam folder.`);
                  } catch {
                    setTestStatus('❌ Failed to send test email');
                  } finally {
                    setTestLoading(false);
                  }
                }}
                disabled={testLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-semibold text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {testLoading ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testStatus && <p className={`text-sm mt-2 font-medium ${testStatus.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{testStatus}</p>}
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</div>}
    </div>
  );
}
