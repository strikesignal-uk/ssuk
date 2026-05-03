import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  { title: '1. Introduction', body: 'These Terms and Conditions govern your use of StrikeSignal ("the Platform"), a product of Izent Global Ltd, a company registered in the United Kingdom (Companies House). By accessing or using StrikeSignal, you agree to be bound by these terms.' },
  { title: '2. About the Platform', body: 'StrikeSignal is a real-time football signal intelligence platform designed to help users identify statistically high-probability goal moments during live football matches. The platform uses xG (Expected Goals) data and match pressure metrics to generate signals.' },
  { title: '3. Not Financial Advice', body: 'StrikeSignal provides information and educational content only. Nothing on this platform constitutes financial advice, betting advice, or a guarantee of profit. All signals are generated algorithmically based on statistical data. Past performance does not guarantee future results. You are solely responsible for any betting decisions you make.' },
  { title: '4. Eligibility', body: 'You must be at least 18 years of age to use StrikeSignal. By using this platform you confirm you are of legal age to engage in sports betting in your jurisdiction. StrikeSignal does not facilitate or process bets directly.' },
  { title: '5. Subscription and Payments', body: 'StrikeSignal operates on a subscription basis. Payments are processed securely via Paystack. Subscription fees are non-refundable except where required by applicable law. You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.' },
  { title: '6. Acceptable Use', body: null, list: [
    'Share account credentials with others',
    'Attempt to reverse engineer or scrape the platform',
    'Use the platform for any unlawful purpose',
    'Resell or redistribute signals without written permission',
    'Use automated tools to access the platform without authorisation'
  ]},
  { title: '7. Intellectual Property', body: 'All content, designs, algorithms, and signals on StrikeSignal are the intellectual property of Izent Global Ltd. You may not reproduce, distribute, or create derivative works without prior written consent.' },
  { title: '8. Disclaimer of Warranties', body: 'StrikeSignal is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or timeliness of signals. The platform may experience downtime during maintenance or technical issues.' },
  { title: '9. Limitation of Liability', body: 'To the maximum extent permitted by law, Izent Global Ltd shall not be liable for any direct, indirect, incidental, or consequential losses arising from your use of StrikeSignal, including but not limited to betting losses.' },
  { title: '10. Governing Law', body: 'These terms are governed by the laws of England and Wales. Disputes shall be resolved in the appropriate jurisdiction.' },
  { title: '11. Changes to Terms', body: 'We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.' },
  { title: '12. Contact', body: 'For questions about these terms, contact us at support@strikesignal.ng' },
];

export default function Terms() {
  return (
    <div style={{ fontFamily: "'DM Sans', Inter, sans-serif" }} className="min-h-screen bg-[#0a0f1e] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="StrikeSignal" 
              className="w-[120px] md:w-[160px] h-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors px-3">About</Link>
            <Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors px-3">Contact</Link>
            <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-black mb-2">Terms and Conditions</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i} className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-black text-white mb-3">{s.title}</h2>
              {s.body && <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>}
              {s.list && (
                <>
                  <p className="text-slate-400 text-sm mb-3">Users must not:</p>
                  <ul className="space-y-2">
                    {s.list.map((item, j) => (
                      <li key={j} className="text-slate-400 text-sm flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">✕</span> {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 text-xs italic">
            StrikeSignal is a product of Izent Global Ltd. Registered in England & Wales.
          </p>
        </div>
      </main>
    </div>
  );
}
