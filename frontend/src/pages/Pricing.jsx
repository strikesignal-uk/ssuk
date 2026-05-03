import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Pricing({ user }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
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

  const freeFeatures = [
    { text: 'Live signals (Medium confidence)', included: true },
    { text: 'Basic dashboard', included: true },
    { text: 'Results history', included: true },
    { text: 'Match schedule', included: true },
    { text: '5 major leagues', included: true },
    { text: 'Telegram channel access', included: true },
    { text: 'HIGH confidence signals', included: false },
    { text: 'Automation bot', included: false },
    { text: '$market auto-bet', included: false },
    { text: 'All international leagues', included: false },
  ];

  const proFeatures = [
    { text: 'Everything in Free, plus:', included: true, header: true },
    { text: 'HIGH confidence signals', included: true, highlight: true },
    { text: 'All international leagues', included: true },
    { text: 'Exclusive Telegram signals', included: true },
    { text: 'Full analytics dashboard', included: true },
    { text: 'Automation bot', included: true },
    { text: '$market auto-bet', included: true },
    { text: 'Training & support', included: true },
    { text: 'Cancel anytime', included: true },
    ...(billing === 'annual' ? [{ text: 'Priority VIP support', included: true, highlight: true }] : []),
  ];

  const faqs = [
    { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your Pro subscription anytime with no penalties or hidden fees.' },
    { q: 'What payment methods are accepted?', a: 'We accept card payments and bank transfers via Stripe.' },
    { q: 'How do HIGH confidence signals work?', a: 'Our AI analyzes live xG data, danger attacks, and match pressure to identify the highest probability opportunities. These premium signals have the best historical strike rate.' },
    { q: 'Is my money safe?', a: 'All payments are processed securely through Stripe with bank-level encryption. We never store your card details.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e]" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="StrikeSignal" className="w-[120px] md:w-[140px] h-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }} />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">Login</Link>
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-16 pb-8 md:pt-24 md:pb-12">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-5">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-bold tracking-wide uppercase">Trusted by 500+ British Bettors</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Simple pricing,<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-violet-400 bg-clip-text text-transparent">powerful signals</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
            Start free with live signals. Upgrade to Pro to unlock HIGH confidence alerts, automation, and all leagues.
          </p>
        </div>
      </section>

      {/* ── Billing Toggle ── */}
      <div className="flex justify-center mb-8 md:mb-12 px-5">
        <div className="flex bg-[#0d1527] border border-white/5 p-1.5 rounded-2xl">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              billing === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}>
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative ${
              billing === 'annual'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}>
            Annual
            <span className="absolute -top-2.5 -right-3 bg-emerald-500 text-[9px] text-white font-black px-1.5 py-0.5 rounded-full">
              -25%
            </span>
          </button>
        </div>
      </div>

      {/* ── Pricing Cards ── */}
      <section className="max-w-5xl mx-auto px-5 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">

          {/* ── FREE CARD ── */}
          <div className="bg-[#0d1527] border border-white/5 rounded-3xl p-7 md:p-9 flex flex-col relative group hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">⚡</div>
              <div>
                <span className="text-xs font-black text-slate-500 tracking-widest uppercase">Free</span>
                <p className="text-slate-600 text-[11px]">No card required</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black text-white">£0</span>
                <span className="text-slate-500 font-medium text-sm">/forever</span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

            <ul className="flex-1 space-y-3 mb-8">
              {freeFeatures.map((f, i) => (
                <li key={i} className={`flex items-start gap-3 text-sm ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span className={`mt-0.5 text-xs flex-shrink-0 ${f.included ? 'text-emerald-400' : 'text-slate-700'}`}>
                    {f.included ? '✓' : '✕'}
                  </span>
                  <span className={f.included ? '' : 'line-through'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-300">
              Get Started Free
            </button>
          </div>

          {/* ── PRO CARD ── */}
          <div className="relative flex flex-col">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20 whitespace-nowrap">
                ⚡ Most Popular
              </span>
            </div>

            <div className="rounded-3xl p-7 md:p-9 flex flex-col relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-[#0f1d3a] via-[#132044] to-[#0d1527]">
              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="relative z-10 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">🔥</div>
                  <div>
                    <span className="text-xs font-black text-blue-400 tracking-widest uppercase">Pro</span>
                    <p className="text-blue-400/60 text-[11px]">Full access</p>
                  </div>
                </div>

                <div className="mb-6">
                  {billing === 'annual' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-500 text-lg line-through font-bold">£600</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">SAVE £150</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-black text-white">
                      {billing === 'annual' ? '£450' : '£50'}
                    </span>
                    <span className="text-blue-300/60 font-medium text-sm">
                      {billing === 'annual' ? '/year' : '/month'}
                    </span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-emerald-400/80 text-xs mt-1.5 font-medium">That's only £37.50/month</p>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent mb-6" />

                <ul className="flex-1 space-y-3 mb-8">
                  {proFeatures.map((f, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm ${f.header ? 'text-slate-400 font-medium' : 'text-white/90'}`}>
                      <span className={`mt-0.5 text-xs flex-shrink-0 ${f.highlight ? 'text-amber-400' : 'text-blue-400'}`}>
                        {f.header ? '→' : '✓'}
                      </span>
                      <span className={f.highlight ? 'text-amber-300 font-bold' : ''}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-3.5 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Subscribe to Pro <span className="text-lg">→</span></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 mt-5">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secure payment
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Cancel anytime
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Feature Comparison ── */}
      <section className="max-w-4xl mx-auto px-5 pb-16 md:pb-24">
        <h2 className="text-xl md:text-2xl font-black text-white text-center mb-8 md:mb-12">Compare Plans</h2>
        <div className="bg-[#0d1527] border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-5 md:px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                <th className="text-center py-4 px-3 md:px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Free</th>
                <th className="text-center py-4 px-3 md:px-6 text-xs font-bold text-blue-400 uppercase tracking-wider">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Live signal detection', free: true, pro: true },
                { feature: 'Medium confidence signals', free: true, pro: true },
                { feature: 'HIGH confidence signals', free: false, pro: true },
                { feature: 'Results & history', free: true, pro: true },
                { feature: 'League coverage', free: '5', pro: 'All' },
                { feature: 'Email alerts', free: true, pro: true },
                { feature: 'Telegram channel', free: true, pro: true },
                { feature: 'Automation bot', free: false, pro: true },
                { feature: '$market auto-bet', free: false, pro: true },
                { feature: 'Priority support', free: false, pro: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5 md:px-6 text-slate-300 text-xs md:text-sm">{row.feature}</td>
                  <td className="py-3.5 px-3 md:px-6 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <span className="text-emerald-400 text-sm">✓</span> : <span className="text-slate-700 text-sm">✕</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">{row.free}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 md:px-6 text-center">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? <span className="text-blue-400 text-sm">✓</span> : <span className="text-slate-700 text-sm">✕</span>
                    ) : (
                      <span className="text-blue-400 text-xs font-bold">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="max-w-5xl mx-auto px-5 pb-16 md:pb-24">
        <h2 className="text-xl md:text-2xl font-black text-white text-center mb-3">What our users say</h2>
        <p className="text-slate-500 text-sm text-center mb-8 md:mb-12">Real feedback from real bettors</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { name: 'Chinedu O.', text: 'StrikeSignal changed my betting game. The HIGH confidence signals hit more than any tipster I\'ve used.', tag: 'Pro User' },
            { name: 'Aisha M.', text: 'The automation bot is insane. I set it up once and it places bets for me. No more missing signals!', tag: 'Pro User' },
            { name: 'Tunde K.', text: 'Started free, upgraded to Pro in 2 weeks. The strike rate speaks for itself. Best investment.', tag: 'Pro User' },
          ].map((t, i) => (
            <div key={i} className="bg-[#0d1527] border border-white/5 rounded-2xl p-5 md:p-6 hover:border-white/10 transition-all duration-300">
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-black text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{t.name}</p>
                  <p className="text-blue-400 text-[10px] font-medium">{t.tag}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-5 pb-16 md:pb-24">
        <h2 className="text-xl md:text-2xl font-black text-white text-center mb-3">Frequently Asked Questions</h2>
        <p className="text-slate-500 text-sm text-center mb-8 md:mb-12">Got questions? We have answers.</p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-[#0d1527] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
              <summary className="flex items-center justify-between px-5 md:px-6 py-4 cursor-pointer text-white font-bold text-sm select-none">
                {faq.q}
                <span className="text-slate-600 group-open:rotate-45 transition-transform duration-200 text-lg ml-3 flex-shrink-0">+</span>
              </summary>
              <div className="px-5 md:px-6 pb-4">
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-5xl mx-auto px-5 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-800/10 to-violet-600/10 border border-blue-500/20 p-8 md:p-14 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to win smarter?</h2>
            <p className="text-slate-400 text-sm md:text-base mb-8 max-w-lg mx-auto">Join hundreds of British bettors who trust StrikeSignal for data-driven betting intelligence.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-3.5 px-8 rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                {loading ? 'Processing...' : 'Get Pro Access →'}
              </button>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="text-slate-400 hover:text-white font-bold py-3.5 px-8 rounded-2xl text-sm transition-all border border-white/10 hover:border-white/20">
                Start Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="StrikeSignal" className="w-[100px] h-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }} />
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors">Terms</Link>
            <Link to="/privacy" className="text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors">Privacy</Link>
            <Link to="/contact" className="text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors">Contact</Link>
            <Link to="/about" className="text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors">About</Link>
          </div>
          <p className="text-slate-700 text-xs">© {new Date().getFullYear()} StrikeSignal</p>
        </div>
      </footer>
    </div>
  );
}
