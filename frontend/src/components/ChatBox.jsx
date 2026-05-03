import React, { useState, useRef, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

function genId() { return 'ss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

const QUICK_REPLIES = [
  'How do signals work?',
  'Subscription pricing',
  'Connect $market',
  'Talk to support team',
];

const WELCOME = `👋 Hi! I'm StrikeSignal's AI assistant.

I can help you with:
• How signals work
• Account and subscription questions
• Technical support
• $market bet placement

Type your question or choose an option below:`;

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('ss_chat_session');
    if (stored) return stored;
    const id = genId();
    sessionStorage.setItem('ss_chat_session', id);
    return id;
  });
  const [needsAgent, setNeedsAgent] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  // Welcome on first open
  const handleOpen = () => {
    setOpen(true);
    if (msgs.length === 0) {
      setMsgs([{ role: 'assistant', content: WELCOME, ts: new Date().toISOString() }]);
    }
  };

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), ts: new Date().toISOString() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setShowQuick(false);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sessionId })
      });
      const data = await res.json();
      if (data.needs_agent) setNeedsAgent(true);
      if (data.message) {
        setMsgs(prev => [...prev, { role: data.needs_agent ? 'agent' : 'assistant', content: data.message, ts: new Date().toISOString() }]);
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', ts: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  // Poll for agent replies when in agent mode
  useEffect(() => {
    if (!needsAgent || !open) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/chat/${sessionId}`);
        if (res.ok) {
          const session = await res.json();
          if (session.messages) {
            const agentMsgs = session.messages.filter(m => m.role === 'agent');
            const currentAgent = msgs.filter(m => m.role === 'agent').length;
            if (agentMsgs.length > currentAgent) {
              const newMsgs = agentMsgs.slice(currentAgent);
              setMsgs(prev => [...prev, ...newMsgs.map(m => ({
                role: 'agent', content: m.content, ts: m.timestamp, agentName: m.agentName
              }))]);
            }
          }
        }
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(poll);
  }, [needsAgent, open, sessionId, msgs]);

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Floating button */}
      <button id="ss-chatbox-btn" onClick={() => open ? setOpen(false) : handleOpen()}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/40 flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95"
        style={{ fontSize: 24 }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 md:bottom-24 md:right-4 bottom-0 right-0 md:w-[360px] w-full md:h-[500px] h-full md:rounded-2xl rounded-none bg-[#0f1729] border border-blue-500/20 shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '100dvh' }}>
          {/* Header */}
          <div className="bg-[#0d1527] border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="StrikeSignal" 
                className="w-[100px] h-auto"
                style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
              />
              <div className="pl-3 border-l border-white/10">
                <div className="text-white text-sm font-bold">
                  {needsAgent ? 'Live Support — Support Team' : 'Support'}
                </div>
                <div className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  {needsAgent ? 'Support Team is online' : 'Typically replies instantly'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-[#1d4ed8] text-white rounded-br-md'
                    : m.role === 'agent'
                    ? 'bg-emerald-600/20 border border-emerald-500/20 text-emerald-100 rounded-bl-md'
                    : 'bg-[#1a2744] text-slate-200 rounded-bl-md'
                }`}>
                  {m.role === 'agent' && m.agentName && (
                    <div className="text-[10px] text-emerald-400 font-bold mb-1">🟢 {m.agentName}</div>
                  )}
                  {m.content}
                </div>
                <span className="text-[10px] text-slate-600 mt-1 px-1">{fmtTime(m.ts)}</span>
              </div>
            ))}

            {/* Quick replies */}
            {showQuick && msgs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="bg-[#1a2744] hover:bg-blue-600/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-500/20 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="bg-[#1a2744] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/5 p-3 shrink-0">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..."
                className="flex-1 bg-[#0a0f1e] border border-white/5 focus:border-blue-500/30 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
              <button type="submit" disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[9px] text-slate-700 font-medium">Powered by Gemini</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
