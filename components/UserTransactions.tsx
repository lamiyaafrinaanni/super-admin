
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, User } from '../types';
import { Clock, CheckCircle, AlertCircle, X, CreditCard, PlusCircle, Wallet, Copy } from './Icons';

interface UserTransactionsProps {
    transactions: Transaction[];
    user: User;
    onAddFunds: () => void;
}

const useAnimatedCounter = (end: number, duration = 1500) => {
    const [count, setCount] = useState(end);
    const countRef = useRef(end);
    const startTimeRef = useRef<number | null>(null);
    
    useEffect(() => {
        const start = countRef.current;
        if (start === end) return;
        
        startTimeRef.current = null;
        let animationFrameId: number;
  
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);
            
            // Ease Out Quint
            const ease = 1 - Math.pow(1 - percentage, 5);
            
            const currentCount = start + (end - start) * ease;
            setCount(currentCount);
            countRef.current = currentCount;
  
            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };
  
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [end, duration]);
  
    return count;
};

export const UserTransactions: React.FC<UserTransactionsProps> = ({ transactions, user, onAddFunds }) => {
    const animatedBalance = useAnimatedCounter(user.balance || 0);

    return (
        <div className="space-y-8 animate-fade-in">
          
          {/* Balance Card Section - Keep Dark Text White as BG is fixed Gradient */}
          <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900/90 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-full border-2 border-indigo-400 p-1 shadow-lg shadow-indigo-500/20">
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white text-glow">{user.name}</h2>
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-mono mt-1 bg-black/20 px-2 py-0.5 rounded-lg w-fit">
                                <span>ID: {user.id}</span>
                                <button onClick={() => navigator.clipboard.writeText(user.id)} className="hover:text-white transition-colors">
                                    <Copy className="w-3 h-3"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Balance & Action */}
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-center md:text-right">
                            <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Available Balance</p>
                            <h3 className="text-3xl font-extrabold text-white text-glow-soft font-mono tracking-tighter">
                                ${animatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        
                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                        
                        <button 
                            onClick={onAddFunds}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-glow-soft"
                        >
                            <PlusCircle className="w-5 h-5"/> Add Funds
                        </button>
                    </div>
                </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5"/>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-glow-soft">Transaction History</h2>
          </div>
          
          {/* Desktop View (Table) - Hidden on Mobile */}
          <div className="hidden md:block bg-white dark:bg-white/5 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-white/10">
                   <tr>
                     <th className="px-6 py-3 font-medium">Transaction ID</th>
                     <th className="px-6 py-3 font-medium">Type</th>
                     <th className="px-6 py-3 font-medium">Date</th>
                     <th className="px-6 py-3 font-medium">Amount</th>
                     <th className="px-6 py-3 font-medium">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300">
                   {transactions.map((t) => (
                     <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500 font-mono">#{t.id.slice(-8).toUpperCase()}</td>
                       <td className="px-6 py-4">
                           <span className={`font-bold flex items-center gap-2 ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
                               {t.type === 'DEPOSIT' ? <PlusCircle className="w-4 h-4"/> : <CreditCard className="w-4 h-4"/>}
                               {t.type}
                           </span>
                       </td>
                       <td className="px-6 py-4 text-gray-500 text-sm">{t.date}</td>
                       <td className={`px-6 py-4 font-bold ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          {t.type === 'DEPOSIT' ? '+' : '-'}${(t.amount || 0).toFixed(2)}
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                           t.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' :
                           t.status === 'Pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                         }`}>
                           {t.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                   {transactions.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-500">No transactions found.</td></tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Mobile View (Cards) - Hidden on Desktop */}
          <div className="md:hidden space-y-4">
              {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                      No transactions found.
                  </div>
              ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${t.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
                                    {t.type === 'DEPOSIT' ? <PlusCircle className="w-5 h-5"/> : <CreditCard className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t.type === 'DEPOSIT' ? 'Add Funds' : 'Ad Spend'}</h4>
                                    <p className="text-[10px] text-gray-500 font-mono">#{t.id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`block font-bold text-lg ${t.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {t.type === 'DEPOSIT' ? '+' : '-'}${(t.amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5 mt-3">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {t.date}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                                t.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' :
                                t.status === 'Pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                            }`}>
                                {t.status === 'Completed' && <CheckCircle className="w-3 h-3"/>}
                                {t.status === 'Pending' && <AlertCircle className="w-3 h-3"/>}
                                {t.status === 'Failed' && <X className="w-3 h-3"/>}
                                {t.status}
                            </span>
                        </div>
                    </div>
                  ))
              )}
          </div>
        </div>
    );
};
