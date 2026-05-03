import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  { q: "Is this a get-rich-quick scheme?", a: "Not at all. StrikeSignal is a data-driven tool designed to help you find high-probability opportunities. It requires discipline, bankroll management, and consistency to be profitable." },
  { q: "Do I need to be an expert in football or trading?", a: "No prior experience is necessary. Our system does the heavy lifting by analyzing the data and sending you clear signals. You just need to follow the alerts and place the bets." },
  { q: "How are the signals delivered?", a: "Signals are delivered instantly to your dashboard and pushed to your Telegram or Email so you can place your bets without delay." },
  { q: "Can I cancel my subscription?", a: "Yes, you can cancel at any time directly from your account settings with no hidden fees or contracts." },
  { q: "Do you have an affiliate program?", a: "We do! Please contact our support team to learn more about how you can earn by referring other bettors to StrikeSignal." }
];

export default function LandingPage() {
  const [bankroll, setBankroll] = useState(200);
  const [openFaq, setOpenFaq] = useState(null);

  // Simple static calculation based on the image's text:
  // £5 flat stake (2.5% of £200), 70% strike rate, 1.60 odds. Let's assume 30 bets a month.
  // Stake per bet = bankroll * 0.025
  const stake = bankroll * 0.025;
  const betsPerMonth = 30;
  const wins = betsPerMonth * 0.70;
  const losses = betsPerMonth * 0.30;
  const profit = (wins * stake * 0.60) - (losses * stake); // 0.60 profit per win at 1.6 odds
  const monthlyProfit = profit > 0 ? profit : 0;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", scrollBehavior: 'smooth' }} className="min-h-screen bg-[#06080F] text-white flex flex-col relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        html { scroll-behavior: smooth; }
        @keyframes fadeup { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .fadeup { animation: fadeup .8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .glass-panel { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>

      {/* Abstract Background Elements for Premium Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/20 rounded-[100%] blur-[150px] pointer-events-none mix-blend-screen opacity-50" />
      
      {/* ── NAV ── */}
      <nav className="w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="StrikeSignal" 
              className="w-[140px] md:w-[160px] h-auto"
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-black transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)] hidden sm:block">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center px-6 text-center pt-16 pb-24 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-widest mb-8 fadeup" style={{ animationDelay: '0.1s' }}>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" /> Live UK Market Signals
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6 fadeup" style={{ animationDelay: '0.2s' }}>
            Imagine knowing when a goal is about to land <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500">before it happens.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed fadeup" style={{ animationDelay: '0.3s' }}>
            That's StrikeSignal. Designed for football fans who want to turn their passion into profit, it guides you toward high probability bets that keep your bankroll climbing.
          </p>
          
          <div className="fadeup flex flex-col items-center gap-4" style={{ animationDelay: '0.4s' }}>
            <Link 
              to="/signup" 
              className="inline-block bg-white text-black px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Get started with a free 7-day trial →
            </Link>
            <p className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-widest">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT IS STRIKESIGNAL ── */}
      <section className="relative py-24 bg-[#0a0f1e] border-t border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none mix-blend-screen -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="text-left fadeup">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">What is StrikeSignal?</h2>
            <p className="text-xl text-slate-300 mb-6 font-medium leading-relaxed">
              StrikeSignal is a real-time football goal alert system designed to make betting on goals simple, repeatable, <span className="text-emerald-400">and highly profitable.</span>
            </p>
            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
              Instead of guessing scores or stacking risky accumulators, StrikeSignal identifies live moments when goal probability spikes during a match.
            </p>
            <p className="text-lg text-slate-300 font-bold mb-10">
              When the alert hits, place the bet. That's it.
            </p>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
              START MY 7-DAY FREE TRIAL
            </Link>
          </div>

          <div className="relative fadeup" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-3xl rounded-[3rem]" />
            <div className="relative glass-panel rounded-[2rem] p-6 shadow-2xl border border-white/10 overflow-hidden bg-[#0d1527]">
              {/* Fake Dashboard UI */}
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">77'</span>
                  <span className="text-white font-bold text-sm">PRO LEAGUE</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Act Now</span>
              </div>
              <div className="flex justify-between items-center mb-8 px-4">
                <div className="text-center">
                  <div className="text-lg font-black text-white">Anderlecht</div>
                  <div className="text-xs text-slate-500">xG: 0.32</div>
                </div>
                <div className="text-3xl font-black text-white tracking-widest">0 - 1</div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">Gent</div>
                  <div className="text-xs text-slate-500">xG: 3.11</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#1a2744] rounded-xl p-3 text-center border border-emerald-500/30">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Match xG</div>
                  <div className="text-xl font-black text-emerald-400">3.43</div>
                </div>
                <div className="bg-[#1a2744] rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">xG Score</div>
                  <div className="text-xl font-black text-white">0 - 4</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
                  <div className="text-[10px] font-bold text-red-400 uppercase">Overdue</div>
                  <div className="text-xl font-black text-red-500">+3</div>
                </div>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs text-blue-400 font-bold mb-1">Recommended Angle</div>
                  <div className="text-white font-black text-lg">Back Over 1.5 Goals</div>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black">1.85</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY IS STRIKESIGNAL BETTER ── */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-12 tracking-tight fadeup">
            Why is StrikeSignal better than other betting or trading methods?
          </h2>
          
          <div className="space-y-6 text-left max-w-2xl mx-auto mb-12 fadeup" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
              <p className="text-lg text-slate-300">No more losing money on ACCAs or Bet Builders with Bookies where one goal kills the entire bet.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
              <p className="text-lg text-slate-300">No need for hours of research for <strong className="text-white">$market</strong> traders using overs markets.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
              <p className="text-lg text-slate-300">Higher profits for less time than Matched betting with no risk of restrictions.</p>
            </div>
          </div>

          <p className="text-xl text-slate-400 mb-4 fadeup" style={{ animationDelay: '0.2s' }}>
            You don't chase bets. You wait for high-probability goal moments — then act.
          </p>
          <p className="text-2xl font-black text-white mb-10 fadeup" style={{ animationDelay: '0.3s' }}>
            Get the signal. Place the bet. Grow the bankroll.
          </p>

          <div className="fadeup" style={{ animationDelay: '0.4s' }}>
            <Link to="/signup" className="inline-block bg-white text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              START MY 7-DAY FREE TRIAL
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW STRIKESIGNAL WORKS ── */}
      <section className="py-24 bg-[#0a0f1e] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-[100%] blur-[120px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight fadeup">How StrikeSignal Works</h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-4 fadeup" style={{ animationDelay: '0.1s' }}>
            We take the guesswork out of betting. Our powerful analysis finds the signals with the highest statistical chance of success. We do the hard work, so you can bet with confidence.
          </p>
          <p className="text-slate-300 font-medium mb-12 fadeup" style={{ animationDelay: '0.2s' }}>Get Started in 4 Simple Steps:</p>

          <div className="grid md:grid-cols-4 gap-6 mb-12 fadeup" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: '📋', title: '1. Sign Up', desc: 'Start your free 7-day trial. (Takes just 2 minutes)' },
              { icon: '💬', title: '2. Get Signals', desc: 'We send you the exact moment when pressure spikes and a goal window opens.' },
              { icon: '⚽', title: '3. Place Your Bet', desc: 'Place your bet directly on the $market exchange.' },
              { icon: '📈', title: '4. Track Progress', desc: 'Use your dashboard to review your strike rate, ROI patterns, and decision-making.' }
            ].map((step, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-colors flex flex-col items-center text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-xl text-slate-300 mb-10 fadeup" style={{ animationDelay: '0.4s' }}>
            No overthinking. No chasing. <strong className="text-white">Just clearer moments and better timing.</strong>
          </p>

          <div className="fadeup" style={{ animationDelay: '0.5s' }}>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
              GET INSTANT ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ── */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 fadeup">
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Want to know what you could make?</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Calculate your profit here</h3>
            <p className="text-lg text-slate-400">
              Use this calculator to see how much profit you are likely to make by following our system based on your bank roll and stake.
            </p>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl mb-12 text-left fadeup max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>
            <h4 className="text-xl font-black text-white text-center mb-8">StrikeSignal Profit Calculator</h4>
            
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Starting Bankroll (£)</label>
            <input 
              type="number" 
              value={bankroll} 
              onChange={e => setBankroll(Number(e.target.value))}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-4 text-white text-lg font-bold outline-none focus:border-blue-500 transition-colors mb-6"
            />
            
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-blue-400 leading-relaxed font-medium">
                This version is built around a £{bankroll} starting bankroll, £{stake.toFixed(2)} flat stakes (2.5%), 70% strike rate, and 1.60 average odds over 30 bets a month.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl p-[1px]">
              <div className="bg-[#0a0f1e] rounded-xl p-6 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">Est. Monthly Profit:</span>
                <span className="text-3xl font-black text-emerald-400">£{monthlyProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="fadeup" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup" className="inline-block bg-white text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              START MY 7-DAY FREE TRIAL
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY BETTORS LOVE STRIKESIGNAL ── */}
      <section className="py-24 bg-[#0a0f1e] border-t border-white/5 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tight fadeup">Why Bettors Love StrikeSignal</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 fadeup" style={{ animationDelay: '0.1s' }}>
            <div className="glass-panel p-8 rounded-2xl text-left border border-white/10 hover:border-emerald-500/30 transition-colors">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                <span className="text-emerald-400">⚽</span> Better Timing
              </h3>
              <p className="text-slate-400">Alerts come at the exact moment pressure spikes — not before, not after.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl text-left border border-white/10 hover:border-emerald-500/30 transition-colors">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                <span className="text-emerald-400">📱</span> Telegram + Dashboard
              </h3>
              <p className="text-slate-400">Fast alerts combined with deep personal tracking gives you a full betting workflow.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl text-left border border-white/10 hover:border-emerald-500/30 transition-colors">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                <span className="text-emerald-400">🔥</span> More Fun
              </h3>
              <p className="text-slate-400">Members enjoy the whole flow: the alert, the entry, the match, the goal, and checking results together.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl text-left border border-white/10 hover:border-emerald-500/30 transition-colors">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                <span className="text-emerald-400">🧠</span> Smarter Decisions
              </h3>
              <p className="text-slate-400">Tracking your own data reduces emotional, FOMO-driven bets.</p>
            </div>
          </div>
          
          <div className="fadeup" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
              GET INSTANT ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* ── THIS IS NOT / THIS IS ── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="fadeup mb-12 text-center">
            <Link to="/signup" className="inline-block bg-white text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              GET INSTANT ACCESS
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 fadeup" style={{ animationDelay: '0.1s' }}>
            <div>
              <h3 className="text-3xl font-black text-white mb-8 text-center md:text-left">This Is Not...</h3>
              <ul className="space-y-4">
                {[
                  'Like losing ACCAs or Bet Builders with bookies',
                  'Spending hours studying football stats',
                  'Risking everything on one big bet',
                  'Matched betting with account restrictions',
                  'Hoping for "lucky wins"',
                  'A get-rich-quick scheme',
                  'Guaranteed wins'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-red-500 font-black shrink-0 text-xl leading-none">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-3xl font-black text-white mb-8 text-center md:text-left">This Is...</h3>
              <ul className="space-y-4">
                {[
                  'Perfect as a real, profitable side hustle',
                  'Timing the market smarter',
                  'Betting with data',
                  'Tracking your progress',
                  'A more disciplined approach',
                  'A more exciting matchday experience'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-emerald-500 font-black shrink-0 text-xl leading-none">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-16 text-center fadeup" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
              START MY 7-DAY TRIAL
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 bg-[#0a0f1e] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-[100%] blur-[150px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto fadeup">
            {[
              { title: 'MONTHLY', price: '£49.99/mo' },
              { title: 'ANNUAL', price: '£499/year' }
            ].map((plan, i) => (
              <div key={i} className="glass-panel p-10 rounded-3xl border border-white/10 flex flex-col items-center hover:border-emerald-500/30 transition-colors">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">{plan.title}</h4>
                <div className="text-4xl font-black text-white mb-8">{plan.price}</div>
                
                <ul className="space-y-4 mb-8 w-full">
                  {[
                    'Free 7 Day Trial',
                    'Daily Goal Signals',
                    'Get Exclusive Signals via Telegram and app',
                    'Lifetime Community Access',
                    'Dashboard & Full Tracking',
                    '52 International Leagues Covered',
                    'Automation Bot',
                    'Training & support',
                    'Cancel Anytime',
                    '5 Star Trustpilot Score'
                  ].map((feat, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/signup" className="w-full text-center bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 mb-6">
                  START MY 7-DAY TRIAL
                </Link>
                
                <div className="flex gap-2 mb-4 opacity-50">
                  <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] font-bold text-blue-800">VISA</div>
                  <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] font-bold text-red-600">MC</div>
                  <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] font-bold text-cyan-600">AMEX</div>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">No contracts | Cancel anytime</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight fadeup">What Members Say About StrikeSignal</h2>
          <p className="text-slate-400 mb-12 fadeup" style={{ animationDelay: '0.1s' }}>Our community says it best. These reviews highlight the trust, results, and satisfaction we aim to deliver every day.</p>
          
          <div className="glass-panel p-6 rounded-3xl border border-white/10 mb-12 fadeup flex flex-col md:flex-row items-center justify-between" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div>
                <div className="text-4xl font-black text-white">5.00</div>
                <div className="flex text-emerald-400 text-xl">★★★★★</div>
                <div className="text-xs text-slate-400 mt-1">24 reviews</div>
              </div>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">Write a review</button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12 fadeup text-left" style={{ animationDelay: '0.3s' }}>
            {[
              { text: "Been a subscriber for 2 months now and love the accuracy. Bankroll is steadily growing.", author: "Ryan McLaughlin", init: "RM" },
              { text: "Unbelievably accurate! Definitely worth getting. Has completely changed my betting.", author: "Di", init: "D" },
              { text: "Have been a subscriber for over a week now and have already doubled my starting bank. Alerts arrive immediately and are easy to read.", author: "Tom Dwyer", init: "TD" }
            ].map((review, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col hover:border-emerald-500/30 transition-colors">
                <div className="text-emerald-400 text-lg mb-2">★★★★★</div>
                <div className="text-xs text-slate-500 mb-4">Feb 2026</div>
                <p className="text-slate-300 text-sm flex-1 mb-6">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">{review.init}</div>
                  <div className="text-sm font-bold text-white">{review.author}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="fadeup" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex gap-1 text-emerald-500 text-2xl">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <div className="font-bold text-xl flex items-center gap-1">
                <span className="text-emerald-500">★</span> Trustpilot
              </div>
            </div>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
              GET INSTANT ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-[#0a0f1e] border-t border-white/5 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 fadeup">STILL NOT SURE?</h3>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tight fadeup" style={{ animationDelay: '0.1s' }}>Frequently Asked Questions</h2>
          
          <div className="space-y-4 text-left fadeup mb-12" style={{ animationDelay: '0.2s' }}>
            {FAQS.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="glass-panel p-6 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">{faq.q}</span>
                  <span className={`text-slate-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {openFaq === i && (
                  <div className="mt-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="fadeup" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup" className="inline-block bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
              START MY FREE TRIAL AND GET INSTANT ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/5 bg-[#06080F] text-center">
        <p className="text-slate-600 text-xs font-medium">© {new Date().getFullYear()} StrikeSignal. All rights reserved. Play responsibly.</p>
      </footer>
    </div>
  );
}
