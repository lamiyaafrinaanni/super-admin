
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Banknote, X, ChevronLeft, Send, Copy, Share } from './Icons';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  exchangeRate: number;
  onSubmit: (bdtAmount: number, usdAmount: number, method: 'MANUAL' | 'AUTO', proof: string) => void;
  paymentNumber?: string;
  initialAmount?: number;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, user, exchangeRate, onSubmit, paymentNumber = '01642832777', initialAmount, showToast }) => {
  const [step, setStep] = useState(1);
  const [bdtAmount, setBdtAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState(0);
  const [method, setMethod] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [proof, setProof] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        if (initialAmount && initialAmount > 0) setBdtAmount(initialAmount.toString());
        else setBdtAmount('');
    }
  }, [isOpen, initialAmount]);

  useEffect(() => {
    if (bdtAmount) setUsdAmount(parseFloat(bdtAmount) / exchangeRate);
    else setUsdAmount(0);
  }, [bdtAmount, exchangeRate]);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    if (showToast) showToast('Payment number copied!', 'success');
  };

  const handleShareWhatsApp = () => {
      const text = `*Add Funds Request*\n\nSend Money to: ${paymentNumber} (Bkash Personal)\nAmount: ${bdtAmount} BDT\n\nReference/User ID: ${user.id}\n\nPlease pay and send transaction ID.`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(bdtAmount), usdAmount, method, proof);
    setStep(1);
    setBdtAmount('');
    setProof('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up transition-colors duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center text-white border-b border-gray-200 dark:border-white/10">
           <h3 className="font-bold flex items-center gap-2"><Banknote className="w-5 h-5" /> Add Funds to Wallet</h3>
           <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {step === 1 && (
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">I want to load (BDT)</label>
                    <div className="relative max-w-[200px] mx-auto">
                        <input type="number" value={bdtAmount} onChange={e => setBdtAmount(e.target.value)} className="w-full px-4 py-3 border-b-2 border-indigo-500/50 text-3xl font-bold text-center text-gray-900 dark:text-white outline-none bg-transparent placeholder-gray-300 transition-colors" placeholder="0" autoFocus/>
                        <span className="block text-xs font-bold text-gray-400 mt-1">BDT</span>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                    <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-full text-gray-500"><ChevronLeft className="w-4 h-4 -rotate-90" /></div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 w-full flex items-center justify-between">
                         <div><p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">You Receive Credit</p><p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">${usdAmount.toFixed(2)}</p></div>
                         <div className="text-right"><p className="text-xs text-gray-500">Exchange Rate</p><p className="text-xs font-bold text-gray-700 dark:text-gray-300">1 USD = {exchangeRate} BDT</p></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-500">Select Payment Method</p>
                    <button onClick={() => { setMethod('MANUAL'); setStep(2); }} disabled={!bdtAmount || parseFloat(bdtAmount) <= 0} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between hover:border-pink-500/50 hover:bg-pink-50 transition-all group disabled:opacity-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-100 dark:bg-pink-500/20 text-pink-600 p-3 rounded-full"><Send className="w-5 h-5"/></div>
                            <div className="text-left"><p className="font-bold text-gray-900 dark:text-white group-hover:text-pink-600 transition-colors">Manual Send Money</p><p className="text-xs text-gray-500">Bkash / Nagad / Rocket</p></div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:text-pink-500"/>
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="p-6 space-y-6">
                <div className="text-center pb-4 border-b border-gray-200 dark:border-white/10">
                    <p className="text-sm text-gray-500">Sending Amount</p>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{bdtAmount} <span className="text-lg text-gray-400">BDT</span></h2>
                </div>
                <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold shadow-lg">Bkash/Nagad</div>
                    <p className="text-xs text-pink-600 font-bold uppercase mb-1">Send Money To</p>
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-2xl font-bold text-gray-800 dark:text-white tracking-wider">{paymentNumber}</span>
                        <div className="flex gap-2">
                            <button onClick={handleCopyNumber} className="bg-white/50 dark:bg-white/10 hover:bg-white text-pink-600 p-2 rounded-lg border border-pink-200" title="Copy Number"><Copy className="w-5 h-5"/></button>
                            <button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors shadow-lg" title="Share via WhatsApp"><Share className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-500">Instructions</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                        <li className="flex gap-2"><span className="font-bold text-indigo-600">1.</span> <span>Dial USSD or open <strong>Bkash/Nagad App</strong>.</span></li>
                        <li className="flex gap-2"><span className="font-bold text-indigo-600">2.</span> <span>Select <strong>Send Money</strong> option.</span></li>
                        <li className="flex gap-2"><span className="font-bold text-indigo-600">3.</span> <span>Enter Number: <strong>{paymentNumber}</strong></span></li>
                        <li className="flex gap-2"><span className="font-bold text-indigo-600">4.</span> <span>Enter Reference: <strong>{user.id}</strong></span></li>
                    </ul>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1">Payment Proof (TrxID)</label>
                        <input type="text" required value={proof} onChange={e => setProof(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" placeholder="e.g. 9H7D6F8G"/>
                    </div>
                    <div className="flex gap-3">
                         <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 rounded-xl font-bold text-gray-600">Back</button>
                         <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg">Confirm Payment</button>
                    </div>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};
