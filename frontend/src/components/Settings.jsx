import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [maskedGemini, setMaskedGemini] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        const data = await res.json();
        setMaskedKey(data.sportmonksApiKey || '');
        setMaskedGemini(data.geminiApiKey || '');
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
      } else {
        setMaskedGemini('••••••••' + geminiKey.slice(-4));
        setGeminiKey('');
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

      {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</div>}
    </div>
  );
}
