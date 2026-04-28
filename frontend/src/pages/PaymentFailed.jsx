import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0d1527] border border-red-500/20 rounded-3xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.05)]">
        
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          ✕
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Payment was not completed</h2>
        <p className="text-slate-300 mb-1">No money was charged.</p>
        <p className="text-slate-500 text-sm mb-8">If you experienced an issue with your card or bank, please try a different payment method.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
            Try Again
          </button>
          
          <a href="mailto:support@strikesignal.pro" className="block text-sm text-slate-400 hover:text-white transition-colors">
            Contact Support
          </a>
        </div>

      </div>
    </div>
  );
}
