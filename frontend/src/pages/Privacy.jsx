import React from 'react';
import { Link } from 'react-router-dom';

const Nav = () => (
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
);

const Section = ({ title, children }) => (
  <section className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 md:p-8">
    <h2 className="text-lg font-black text-white mb-3">{title}</h2>
    {children}
  </section>
);

const P = ({ children }) => <p className="text-slate-400 text-sm leading-relaxed mb-2">{children}</p>;
const Li = ({ children }) => <li className="text-slate-400 text-sm flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span><span>{children}</span></li>;

export default function Privacy() {
  return (
    <div style={{ fontFamily: "'DM Sans', Inter, sans-serif" }} className="min-h-screen bg-[#0a0f1e] text-white">
      <Nav />
      <main className="pt-28 pb-20 max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-6">
          <Section title="1. Who We Are">
            <P>StrikeSignal is operated by Izent Global Ltd, registered in the United Kingdom and Nigeria. We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the Nigeria Data Protection Regulation (NDPR).</P>
            <div className="bg-[#0a0f1e] border border-white/5 rounded-xl p-4 mt-3 space-y-1">
              <p className="text-xs text-slate-500"><span className="text-slate-300 font-bold">Data Controller:</span> Izent Global Ltd</p>
              <p className="text-xs text-slate-500"><span className="text-slate-300 font-bold">Contact:</span> support@strikesignal.ng</p>
            </div>
          </Section>

          <Section title="2. What Data We Collect">
            <ul className="space-y-2">
              <Li>Full name and email address (registration)</Li>
              <Li>Phone number (Sportybet account connection)</Li>
              <Li>Payment information (processed by Paystack — we do not store card details)</Li>
              <Li>Usage data (pages visited, signals viewed, time on platform)</Li>
              <Li>Device and browser information</Li>
              <Li>IP address and approximate location</Li>
              <Li>Chat messages sent through our support chatbox</Li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="space-y-2">
              <Li>To provide and improve the StrikeSignal service</Li>
              <Li>To process subscription payments via Paystack</Li>
              <Li>To send signal notifications and email alerts</Li>
              <Li>To provide customer support</Li>
              <Li>To analyse platform usage and improve algorithms</Li>
              <Li>To comply with legal obligations</Li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing (UK GDPR)">
            <ul className="space-y-2">
              <Li>Contract performance (providing the service you subscribed to)</Li>
              <Li>Legitimate interests (improving the platform)</Li>
              <Li>Legal obligation (fraud prevention, tax records)</Li>
              <Li>Consent (marketing emails — you can withdraw at any time)</Li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            <P>We do not sell your personal data. We may share data with:</P>
            <ul className="space-y-2">
              <Li>Paystack (payment processing)</Li>
              <Li>Sportmonks (football data API — no personal data shared)</Li>
              <Li>Google (Gemini AI chatbox — chat messages processed)</Li>
              <Li>Hosting providers (Netlify, Supabase)</Li>
              <Li>Law enforcement when legally required</Li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <ul className="space-y-2">
              <Li>Account data: retained while account is active + 2 years</Li>
              <Li>Payment records: 7 years (legal requirement)</Li>
              <Li>Chat logs: 90 days</Li>
              <Li>Usage analytics: 12 months</Li>
            </ul>
          </Section>

          <Section title="7. Your Rights (UK GDPR & NDPR)">
            <P>You have the right to:</P>
            <ul className="space-y-2">
              <Li>Access your personal data</Li>
              <Li>Correct inaccurate data</Li>
              <Li>Request deletion of your data</Li>
              <Li>Object to processing</Li>
              <Li>Data portability</Li>
              <Li>Withdraw consent at any time</Li>
            </ul>
            <P>To exercise your rights, email support@strikesignal.ng</P>
          </Section>

          <Section title="8. Cookies">
            <P>We use essential cookies for authentication and session management, and analytics cookies to understand platform usage. You can disable cookies in your browser settings but this may affect functionality.</P>
          </Section>

          <Section title="9. Security">
            <P>We implement industry-standard security measures including SSL encryption, secure password hashing, and encrypted storage of sensitive credentials. However no system is 100% secure.</P>
          </Section>

          <Section title="10. Third Party Links">
            <P>StrikeSignal may contain links to third-party sites including Sportybet and Bet9ja. We are not responsible for their privacy practices.</P>
          </Section>

          <Section title="11. Children">
            <P>StrikeSignal is not intended for users under 18 years of age. We do not knowingly collect data from minors.</P>
          </Section>

          <Section title="12. Changes to This Policy">
            <P>We may update this policy periodically. We will notify you of significant changes by email.</P>
          </Section>

          <Section title="13. Contact">
            <P>For privacy enquiries: support@strikesignal.ng</P>
            <P>Izent Global Ltd — United Kingdom & Nigeria</P>
          </Section>
        </div>
      </main>
    </div>
  );
}
