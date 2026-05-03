import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const Nav = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <img 
          src="/logo.png" 
          alt="StrikeSignal" 
          className="w-[120px] md:w-[160px] h-auto"
          style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
        />
      </Link>
      <div className="flex items-center gap-3">
        <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors px-3 hidden md:block">About</Link>
        <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">Sign In</Link>
      </div>
    </div>
  </nav>
);

const InfoCard = ({ icon, title, children, action }) => (
  <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6">
    <div className="text-2xl mb-3">{icon}</div>
    <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
    <div className="text-slate-400 text-sm leading-relaxed mb-4">{children}</div>
    {action}
  </div>
);

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message || 'Message sent! We\'ll reply within 24 hours.' });
        setForm({ name: '', email: '', subject: 'General Enquiry', message: '' });
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to send message.' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', Inter, sans-serif" }} className="min-h-screen bg-[#0a0f1e] text-white">
      <Nav />
      <main className="pt-28 pb-20 max-w-6xl mx-auto px-5">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-3">Contact Us</h1>
          <p className="text-slate-400">We're here to help. Reach out anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left — Info cards */}
          <div className="space-y-4">
            <InfoCard icon="📧" title="Email Support"
              action={<a href="mailto:support@strikesignal.ng" className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">Send Email</a>}>
              <p>support@strikesignal.ng</p>
              <p className="text-xs text-slate-500 mt-1">We respond within 24 hours</p>
            </InfoCard>

            <InfoCard icon="💬" title="Live Chat"
              action={<button onClick={() => { const el = document.getElementById('ss-chatbox-btn'); if (el) el.click(); }} className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">Open Live Chat</button>}>
              <p>Chat with our support team or AI assistant</p>
              <p className="text-xs text-slate-500 mt-1">Available during match hours</p>
            </InfoCard>

            <InfoCard icon="🏢" title="Company">
              <p>StrikeSignal by Izent Global Ltd</p>
              <p className="text-xs text-slate-500 mt-1">Registered in United Kingdom</p>
              <p className="text-xs text-slate-600 mt-2">© 2026 Izent Global Ltd. All rights reserved.</p>
            </InfoCard>

            <InfoCard icon="⏰" title="Support Hours">
              <p>Monday — Friday: 9am — 10pm GMT</p>
              <p>Saturday — Sunday: 12pm — 11pm GMT</p>
              <p className="text-xs text-slate-500 mt-1">(During active football match hours)</p>
            </InfoCard>
          </div>

          {/* Right — Contact form */}
          <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-black mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                  className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Subject</label>
                <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full bg-[#0a0f1e] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option>General Enquiry</option>
                  <option>Technical Issue</option>
                  <option>Billing</option>
                  <option>Signal Query</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={4}
                  className="w-full bg-[#0a0f1e] border border-white/5 focus:border-blue-500/40 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none" />
              </div>
              {status && (
                <div className={`text-sm font-bold px-4 py-3 rounded-xl ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {status.msg}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
