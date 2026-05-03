import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, ImageIcon, Copy, ExternalLink, RefreshCw, Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://strikesignal-api.up.railway.app';

export default function AiChatTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- API Logic ---
  const handleSendMessage = async (userMessage, base64Image = null) => {
    if (!userMessage && !base64Image) return;

    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage || '(Image Attachment)',
      img: base64Image
    };

    const newHistory = [...messages, newMessage];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const apiHistory = newHistory.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.img && { img: m.img }) // Format matches izentbet API if supported
    }));

    const payload = {
      messages: apiHistory,
      ...(base64Image && { image: { data: base64Image } })
    };

    try {
      const response = await fetch(`${API}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success && result.data) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: result.data.message,
          $marketLoading: false,
          $marketError: false,
          codeData: result.data.booking_code ? {
            code: result.data.booking_code,
            totalOdds: result.data.total_odds,
            selections: result.data.selections || [],
            platforms: result.data.converted_codes || {},
            slipData: result.data.slip_data
          } : null
        };
        
        setMessages(prev => [...prev, aiMessage]);


      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: result.message || "I couldn't process that request." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Network error reaching the AI." }]);
    }
    setIsTyping(false);
  };


  // --- Handlers ---
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      handleSendMessage('', base64);
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const submitChat = () => {
    if (!input.trim()) return;
    handleSendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // --- Sub-components ---
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 h-full">
      <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
        <Bot size={40} className="text-purple-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">StrikeSignal AI</h2>
        <p className="text-slate-400 max-w-md mx-auto">Upload betting slips, paste fixtures, or just ask me to generate winning picks for you today.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <button onClick={() => setInput('Please generate 5 high confidence picks for today.')} className="bg-[#1e2d3d] hover:bg-[#253648] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-3 transition-colors">
          <Zap size={24} className="text-purple-400" />
          <span className="text-sm font-semibold text-slate-300">Generate Picks</span>
        </button>
        <button onClick={() => setInput('Convert these fixtures for me:\n')} className="bg-[#1e2d3d] hover:bg-[#253648] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-3 transition-colors">
          <Copy size={24} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-300">Paste Fixtures</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="bg-[#1e2d3d] hover:bg-[#253648] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-3 transition-colors">
          <ImageIcon size={24} className="text-green-400" />
          <span className="text-sm font-semibold text-slate-300">Upload Slip</span>
        </button>
      </div>
    </div>
  );

  const BookingCodeCard = ({ msg }) => {
    const data = msg.codeData;

    return (
      <div className="mt-4 bg-[#1e2d3d] rounded-2xl overflow-hidden border border-white/10 shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap size={16} className="text-yellow-300 fill-yellow-300" /> Booking Codes Ready
          </div>
          {data.selections?.length > 0 && (
            <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-widest">
              {data.selections.length} PICKS
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {data.totalOdds && (
            <div className="text-center pb-3 border-b border-white/5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">Total Odds</span>
              <span className="text-2xl font-black text-white">{data.totalOdds}</span>
            </div>
          )}

          {/* $market */}
          <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 flex justify-between items-center">
              <span>$market</span>
              {data.platforms?.$market && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            {data.platforms?.$market ? (
              <div className="space-y-3">
                <div className="text-2xl font-mono font-bold text-white text-center tracking-widest bg-green-900/40 py-2 rounded-lg border border-green-500/10">
                  {data.platforms.$market}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(data.platforms.$market)} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold text-xs py-2 rounded-lg transition-colors">
                    <Copy size={14} /> Copy
                  </button>
                  {data.platforms?.$market_url && (
                    <button onClick={() => window.open(data.platforms.$market_url, '_blank')} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-2 rounded-lg transition-colors">
                      <ExternalLink size={14} /> Open
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-green-500/60 font-semibold py-2">Code not available</div>
            )}
          </div>


        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1923] text-white">
      {/* Header */}
      <div className="h-16 shrink-0 bg-[#1e2d3d] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 p-2 rounded-lg"><Bot size={20} className="text-purple-400" /></div>
          <h2 className="font-bold text-white">AI Betting Assistant</h2>
        </div>
        <button onClick={() => setMessages([])} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          Clear Chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} className="text-purple-400" />
                  </div>
                )}
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#22c55e] text-white rounded-tr-sm' 
                      : 'bg-[#1e2d3d] text-slate-200 rounded-tl-sm border border-white/5 shadow-sm'
                  }`}>
                    {msg.img && <img src={msg.img} alt="Uploaded attachment" className="max-w-xs rounded-xl mb-3 border border-white/10" />}
                    <div className="prose prose-invert prose-p:my-1 prose-a:text-purple-400 max-w-none break-words">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  {msg.codeData && <BookingCodeCard msg={msg} />}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center shrink-0 mt-1">
                    <User size={16} className="text-green-500" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-purple-400" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[#1e2d3d] border border-white/5 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-[#1e2d3d] border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[#0f1923] border border-white/10 rounded-2xl p-2 pl-4 focus-within:border-purple-500/50 transition-colors shadow-inner">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to analyze games, or paste a betting slip..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white resize-none max-h-32 min-h-[44px] py-3 custom-scrollbar"
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
          />
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            className="hidden" 
          />
          
          <div className="flex gap-2 pb-1 shrink-0">
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Upload Image">
              <ImageIcon size={20} />
            </button>
            <button 
              onClick={submitChat} 
              disabled={(!input.trim() && !isTyping) || isTyping}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                input.trim() 
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-md' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3 font-semibold tracking-wider">POWERED BY IZENTBET AI</p>
      </div>
      
      {/* Basic custom scrollbar styles to ensure sleekness */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
