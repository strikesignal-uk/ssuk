import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txRef = searchParams.get('tx_ref');
  
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    if (!txRef) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API}/api/subscription/verify/${txRef}`, {
          method: 'POST'
        });
        const data = await res.json();
        
        if (data.success && data.activated) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    verify();
  }, [txRef]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0d1527] border border-white/5 rounded-3xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying your payment...</h2>
              <p className="text-slate-400 text-sm">Please don't close this window.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Payment Successful! 🎉</h2>
              <p className="text-slate-300 mb-1">Welcome to StrikeSignal Pro</p>
              <p className="text-emerald-400 text-sm font-bold">Your Pro features are now active</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-8">
              Go to Dashboard →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
              ⏳
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Payment verification pending</h2>
              <p className="text-slate-400 text-sm mb-1">Your account will be upgraded within 5 minutes once Flutterwave confirms the transaction.</p>
              <p className="text-slate-500 text-xs">Contact support@strikesignal.pro if not resolved</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-[#1a2744] hover:bg-[#1e3a8a] border border-[#1e3a8a] text-white font-bold py-3 rounded-xl transition-colors mt-8">
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
