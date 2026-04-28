import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Pricing({ user }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/subscription/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: billing,
          userId: user.id,
          email: user.email,
          name: user.name || user.email
        })
      });

      const data = await res.json();
      if (data.success && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        alert(data.error || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error initiating payment');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-white mb-4">Choose Your StrikeSignal Plan</h1>
        <p className="text-xl text-slate-400">Start free. Upgrade when ready.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch">
        
        {/* FREE CARD */}
        <div className="bg-[#1a2744] border border-[#1e3a8a] rounded-3xl p-8 lg:w-1/3 flex flex-col relative">
          <div className="mb-8">
            <span className="text-sm font-bold text-blue-400 tracking-widest uppercase">FREE</span>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-5xl font-black">₦0</span>
            </div>
            <p className="mt-2 text-slate-400">Forever free</p>
          </div>

          <ul className="flex-1 space-y-4 mb-8 text-sm text-slate-300">
            <li className="flex items-center">✅ <span className="ml-3">Live signals (Medium & Low only)</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Basic dashboard</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Results history</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Schedule page</span></li>
            <li className="flex items-center">✅ <span className="ml-3">5 leagues covered</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Telegram channel access</span></li>
            <li className="flex items-center opacity-50">🔒 <span className="ml-3">High confidence signals (Pro)</span></li>
            <li className="flex items-center opacity-50">🔒 <span className="ml-3">Automation bot (Pro)</span></li>
            <li className="flex items-center opacity-50">🔒 <span className="ml-3">Sportybet auto-bet (Pro)</span></li>
            <li className="flex items-center opacity-50">🔒 <span className="ml-3">All leagues (Pro)</span></li>
          </ul>

          <button 
            onClick={() => navigate(user ? '/' : '/signup')}
            className="w-full bg-[#0d1527] border border-[#1e3a8a] text-white hover:bg-[#1a2744] transition-colors py-4 rounded-xl font-bold text-lg">
            Get Started Free
          </button>
        </div>

        {/* PRO CARD */}
        <div className="rounded-3xl p-8 lg:w-[45%] flex flex-col relative shadow-2xl border-2 border-[#3b82f6]" style={{ background: 'linear-gradient(to bottom, #1e3a8a, #1d4ed8)' }}>
          <div className="absolute top-0 right-8 transform -translate-y-1/2">
            <span className="bg-amber-500 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Most Popular
            </span>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-200 tracking-widest uppercase">PRO</span>
            
            <div className="flex bg-[#0d1527] p-1 rounded-xl">
              <button 
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${billing === 'monthly' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:text-white'}`}>
                Monthly
              </button>
              <button 
                onClick={() => setBilling('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${billing === 'annual' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:text-white'}`}>
                Annual
              </button>
            </div>
          </div>

          <div className="mb-8 text-white relative">
            {billing === 'annual' && (
              <div className="absolute -top-6 left-0 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                Save ₦15,000
              </div>
            )}
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-black">{billing === 'annual' ? '₦45,000' : '₦5,000'}</span>
              <span className="text-blue-200 font-medium ml-2">{billing === 'annual' ? '/year' : '/month'}</span>
            </div>
          </div>

          <ul className="flex-1 space-y-4 mb-8 text-sm text-blue-50 font-medium">
            <li className="flex items-center">✅ <span className="ml-3">Everything in Free PLUS:</span></li>
            <li className="flex items-center">✅ <span className="ml-3 font-bold text-amber-300">HIGH confidence signals unlocked 🔥</span></li>
            <li className="flex items-center">✅ <span className="ml-3">All international leagues</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Exclusive Telegram signals</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Full dashboard & tracking</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Automation bot</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Sportybet auto-bet</span></li>
            <li className="flex items-center">✅ <span className="ml-3">Training & support</span></li>
            {billing === 'annual' && <li className="flex items-center">✅ <span className="ml-3 text-emerald-300 font-bold">Priority support</span></li>}
            <li className="flex items-center">✅ <span className="ml-3">Cancel anytime</span></li>
          </ul>

          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-white text-[#1d4ed8] hover:bg-blue-50 transition-colors py-4 rounded-xl font-black text-lg h-[60px] flex items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Subscribe to Pro →'
            )}
          </button>
          
          <div className="mt-6 text-center text-xs text-blue-200/80 space-y-1">
            <p>Secure payment via Flutterwave</p>
            <p>No contracts • Cancel anytime</p>
          </div>
        </div>

      </div>
    </div>
  );
}
