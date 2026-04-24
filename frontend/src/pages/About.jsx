import React from 'react';
import { Link } from 'react-router-dom';

const Nav = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="StrikeSignal" className="h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-3">
        <Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors px-3 hidden md:block">Terms</Link>
        <Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors px-3">Contact</Link>
        <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">Sign In</Link>
      </div>
    </div>
  </nav>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-[#0d1527] border border-white/5 hover:border-blue-500/25 rounded-2xl p-7 transition-all group">
    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{icon}</div>
    <h3 className="font-bold text-white text-base mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default function About() {
  return (
    <div style={{ fontFamily: "'DM Sans', Inter, sans-serif" }} className="min-h-screen bg-[#0a0f1e] text-white">
      <Nav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%)'}} className="absolute inset-0" />
        </div>
        <div className="max-w-5xl mx-auto px-5 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">About StrikeSignal</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Built for Nigerian bettors. Powered by data. Backed by Izent Global Ltd.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-5">
          <div className="bg-[#0d1527] border border-white/5 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl font-black mb-6">Our Story</h2>
            <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
              <p>StrikeSignal was born out of a simple frustration — Nigerian football bettors had no access to intelligent, data-driven live betting signals built for their market.</p>
              <p>Most signal tools were designed for UK Betfair exchange traders. None of them spoke to the millions of Nigerians placing bets daily on Sportybet, Bet9ja, and BetKing.</p>
              <p>We built StrikeSignal to change that. Using real-time xG (Expected Goals) data and match pressure metrics, StrikeSignal identifies the exact moments during a live football match when a goal becomes statistically likely — and alerts you instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-5">
          <div className="bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 rounded-3xl p-8 md:p-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-black mb-4">Our Mission</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">
              Our mission is to give every Nigerian bettor access to the same data-driven intelligence that professional traders have used in UK markets for years — built specifically for Nigerian bookmakers and Nigerian bettors.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl font-black text-center mb-10">What Makes Us Different</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <FeatureCard icon="⚡" title="Built for Nigeria" desc="Signals optimised for Sportybet and Bet9ja markets. One-click bet placement. No Betfair account needed." />
            <FeatureCard icon="📊" title="Real Data, Not Tips" desc="We don't guess. Every signal is generated from live xG data and statistical models — not human tipsters." />
            <FeatureCard icon="🔒" title="Transparent Results" desc="Every signal is logged. Every result is tracked. You can see our full strike rate history — no hiding losses." />
            <FeatureCard icon="🇳🇬" title="Nigerian First" desc="Pricing in Naira. Support in your timezone. Built by Africans, for Africans." />
          </div>
        </div>
      </section>

      {/* The Company */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-5">
          <div className="bg-[#0d1527] border border-blue-500/20 rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png" alt="StrikeSignal" className="h-8 w-auto" />
              <h2 className="text-xl font-black">is a product of Izent Global Ltd</h2>
            </div>
            <div className="space-y-4 text-slate-400 text-sm leading-relaxed mb-8">
              <p>Izent Global Ltd is a technology company registered in England and Wales (United Kingdom) and Nigeria (Corporate Affairs Commission).</p>
              <p>We build digital products at the intersection of technology, finance, and sports — serving users across the UK and Nigeria.</p>
              <p>StrikeSignal represents our commitment to making sophisticated sports intelligence tools accessible to African bettors.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <span className="text-sm text-slate-300 font-bold">Registered in England & Wales</span>
              </div>
              <div className="bg-[#0a0f1e] border border-white/5 rounded-xl px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🇳🇬</span>
                <span className="text-sm text-slate-300 font-bold">Registered in Nigeria (CAC)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            {[['67%', 'Average Strike Rate'], ['15+', 'Daily Signals'], ['5 Leagues', 'PL · La Liga · Bundesliga · Serie A · Ligue 1']].map(([v, l]) => (
              <div key={l} className="bg-[#0d1527] py-10 text-center">
                <div className="text-3xl font-black text-blue-400 mb-1">{v}</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider px-2">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4">
          <span className="text-slate-700 text-xs font-bold">© 2026 Izent Global Ltd. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="text-slate-600 text-xs hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="text-slate-600 text-xs hover:text-white transition-colors">Privacy</Link>
            <Link to="/contact" className="text-slate-600 text-xs hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
