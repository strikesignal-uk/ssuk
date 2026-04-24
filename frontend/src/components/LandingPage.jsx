import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  { q: "How does StrikeSignal work?", a: "StrikeSignal monitors live football matches using real-time xG (expected goals) data, danger attacks, and AI analysis. When multiple indicators align, we generate a signal with a booking code you can use instantly." },
  { q: "Which bookmakers are supported?", a: "We currently support SportyBet Nigeria and Bet9ja — the two most popular bookmakers for Nigerian bettors. Booking codes work directly on their platforms." },
  { q: "How do I receive signals?", a: "Signals appear instantly on your dashboard. You can also enable email notifications to get alerted the moment a new signal fires." },
  { q: "What is xG and why does it matter?", a: "xG (expected goals) measures the quality of scoring chances created. A high xG with few actual goals often means a goal is overdue — that's the opportunity StrikeSignal targets." },
  { q: "Is there a mobile app?", a: "StrikeSignal is a fully responsive web app that works perfectly on mobile browsers. No app download needed." },
  { q: "Are booking codes available on Sportybet?", a: "Yes. Every signal includes a ready-to-use booking code for Sportybet Nigeria. Just tap the button, the betslip opens automatically." },
];

const FEATURES = [
  { icon: "⚡", title: "Real-Time xG Analysis", desc: "Live probability updates every second based on deep expected goals data from every match." },
  { icon: "🤖", title: "Gemini AI Validation", desc: "Every signal is cross-checked by our custom Gemini AI model to filter out noise." },
  { icon: "⚽", title: "SportyBet Codes", desc: "Ready-to-use booking codes generated specifically for SportyBet Nigeria every time." },
  { icon: "🎯", title: "Bet9ja Codes", desc: "Full Bet9ja support — every live signal comes with a Bet9ja booking code too." },
  { icon: "📊", title: "Performance Tracking", desc: "Complete transparency: view your full signal history, strike rate, and results." },
  { icon: "📧", title: "Email Alerts", desc: "Never miss a signal with instant email notifications sent the moment an opportunity fires." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [stake, setStake] = useState(5000);
  const [sigs, setSigs] = useState(3);

  const profit = Math.round(stake * sigs * 30 * (0.73 * 1.85 - 1));

  return (
    <div style={{ fontFamily: "'DM Sans', Inter, sans-serif", scrollBehavior: 'smooth' }} className="min-h-screen bg-[#0a0f1e] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        .float { animation: float 5s ease-in-out infinite; }
        @keyframes fadeup { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fadeup { animation: fadeup .7s ease both; }
        input[type=range]::-webkit-slider-thumb { background:#3b82f6; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="StrikeSignal" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <a href="#how-it-works" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors px-3">How It Works</a>
            <a href="#faq" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors px-3">FAQ</a>
            <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-3">Sign In</Link>
            <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.18) 0%, transparent 70%)'}} className="absolute inset-0" />
        </div>
        <div className="max-w-6xl mx-auto px-5 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block" /> Live AI Signals · SportyBet &amp; Bet9ja
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6 fadeup">
            Stop Guessing.<br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">Start Winning.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            StrikeSignal detects live goal opportunities using real-time xG data and AI — then sends you SportyBet and Bet9ja booking codes instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 transition-all hover:scale-105">
              Create Free Account →
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border border-slate-700 hover:bg-white/5 transition-all text-slate-300">
              See How It Works
            </a>
          </div>

          {/* Floating signal card mockup */}
          <div className="relative max-w-sm mx-auto float">
            <div className="absolute -inset-8 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative bg-[#0d1527] border border-blue-500/30 rounded-3xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">⚡ High Confidence</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />68'
                </div>
              </div>
              <div className="font-bold text-white mb-1">Arsenal vs Chelsea</div>
              <div className="text-blue-400 text-sm font-bold mb-4">Back Over 2.5 Goals · odds 1.85</div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                {[['xG', '2.34'], ['Attacks', '14'], ['Pressure', '8.4']].map(([l, v]) => (
                  <div key={l} className="bg-slate-800/60 rounded-xl py-2">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">{l}</div>
                    <div className="text-sm font-black text-white">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 text-center py-2 rounded-xl text-xs font-black">⚽ SportyBet: SB7X2K</div>
                <div className="flex-1 bg-teal-600/20 border border-teal-500/30 text-teal-400 text-center py-2 rounded-xl text-xs font-black">🎯 Bet9ja: B9-4421</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-8 max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
          {[['500+', 'Signals Generated'], ['73%', 'Avg Strike Rate'], ['< 60s', 'Signal Delivery'], ['2', 'Bookmakers Supported']].map(([v, l]) => (
            <div key={l} className="bg-[#0d1527] py-8 text-center">
              <div className="text-3xl font-black text-blue-400 mb-1">{v}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-3">How It Works</h2>
            <p className="text-slate-400">Three steps from match data to your betting slip.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, t: "We Monitor Live Matches", d: "Our system tracks xG, danger attacks, and pressure in real time across live football matches globally." },
              { n: 2, t: "AI Detects the Opportunity", d: "When data crosses our threshold, Gemini AI validates the signal and assigns a confidence level." },
              { n: 3, t: "You Get the Booking Code", d: "Instantly receive a SportyBet or Bet9ja booking code. Open the betslip and place your bet in seconds." },
            ].map(({ n, t, d }) => (
              <div key={n} className="relative bg-[#0d1527] border border-white/5 hover:border-blue-500/30 rounded-3xl p-8 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">{n}</div>
                <h3 className="font-bold text-lg mb-3">{t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE SIGNAL PREVIEW ── */}
      <section className="py-16 bg-[#0d1527]/40">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-black text-center mb-12">What a Signal Looks Like</h2>
          <div className="bg-[#0a0f1e] border border-blue-500/20 rounded-3xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />LIVE 68'
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20">HIGH CONFIDENCE</span>
                </div>
                <h3 className="text-2xl font-black mb-1">Arsenal vs Chelsea</h3>
                <p className="text-slate-500 text-sm mb-6">Premier League · Minute 68</p>
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 mb-5">
                  <div className="text-blue-400 font-black text-lg">Back Over 2.5 Goals</div>
                  <div className="text-slate-500 text-xs mt-1">AI Confidence: 91% · Odds: 1.85</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['xG Total', '2.34'], ['Danger Atk', '14'], ['Pressure', '8.4']].map(([l, v]) => (
                    <div key={l} className="bg-slate-900 rounded-2xl py-3">
                      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{l}</div>
                      <div className="text-lg font-black">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-56 flex flex-col justify-center gap-3">
                <button className="w-full bg-[#16a34a] hover:brightness-110 text-white font-black py-4 rounded-2xl text-sm tracking-wide transition-all">⚽ SportyBet<br /><span className="font-mono text-lg">SB7X2K</span></button>
                <button className="w-full bg-[#007b5e] hover:brightness-110 text-white font-black py-4 rounded-2xl text-sm tracking-wide transition-all">🎯 Bet9ja<br /><span className="font-mono text-lg">B9-4421</span></button>
                <p className="text-[9px] text-slate-600 text-center font-bold">Codes valid for Nigerian markets only.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFIT CALCULATOR ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Profit Calculator</h2>
            <p className="text-slate-400 text-sm">Estimate your monthly potential based on our verified track record.</p>
          </div>
          <div className="bg-[#0d1527] border border-white/5 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stake per Bet</span>
                    <span className="text-blue-400 font-black">₦{Number(stake).toLocaleString()}</span>
                  </div>
                  <input type="range" min="500" max="100000" step="500" value={stake} onChange={e => setStake(+e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-600 mt-1"><span>₦500</span><span>₦100k</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Signals per Day</span>
                    <span className="text-blue-400 font-black">{sigs}</span>
                  </div>
                  <input type="range" min="1" max="15" step="1" value={sigs} onChange={e => setSigs(+e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>15</span></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/10 border border-blue-500/20 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Est. Monthly Profit</div>
                <div className={`text-5xl font-black mb-2 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profit >= 0 ? '+' : ''}₦{Math.abs(profit).toLocaleString()}
                </div>
                <p className="text-slate-600 text-[10px] uppercase tracking-wider font-bold">Based on 73% strike rate · 1.85 avg odds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 bg-[#0d1527]/30">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-black text-center mb-12">Everything You Need to Win</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-[#0a0f1e] border border-white/5 hover:border-blue-500/25 rounded-3xl p-7 transition-all group">
                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACK RECORD ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-black mb-16">Our Track Record</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[['73%', 'Strike Rate'], ['500+', 'Total Signals'], ['2', 'Bookmakers']].map(([v, l]) => (
              <div key={l}>
                <div className="text-6xl font-black text-blue-400 mb-2">{v}</div>
                <div className="text-slate-500 text-xs font-black uppercase tracking-widest">{l}</div>
              </div>
            ))}
          </div>
          <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">Past performance does not guarantee future results. Please bet responsibly.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-[#0d1527]/30">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-4xl font-black text-center mb-14">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/3 transition-colors gap-4">
                  <span className="font-bold text-slate-200 text-sm">{faq.q}</span>
                  <span className={`text-blue-500 text-xs font-black shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-60' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/30">
            <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)'}} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Ready to Bet Smarter?</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                Join StrikeSignal and start receiving live goal signals for Nigerian football markets today.
              </p>
              <Link to="/signup"
                className="inline-block bg-white text-blue-700 hover:bg-blue-50 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                CREATE FREE ACCOUNT →
              </Link>
              <p className="mt-6 text-blue-200/70 text-xs font-bold uppercase tracking-widest">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0f1e] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="StrikeSignal" className="h-8 w-auto" />
              </div>
              <p className="text-slate-500 text-sm mb-2 font-medium">Live Goal Intelligence</p>
              <p className="text-slate-700 text-xs font-bold">© 2026 StrikeSignal. All rights reserved.</p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500 font-semibold">
                <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500 font-semibold">
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center">
            <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest leading-loose max-w-2xl mx-auto">
              StrikeSignal provides information and education only. This is not financial advice. Results are not guaranteed. Please bet responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
