
import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction, Product } from '../types';
import { Copy, Users, ShieldCheck, Plus, Megaphone, History, Facebook, ShoppingBag, Briefcase, Settings, LifeBuoy, Check, Clock, PlusCircle, CreditCard, Bot, Wallet, TrendingUp, ChevronRight, Package, MessageSquare, Sparkles, X } from './Icons';

interface UserDashboardProps {
    user: User;
    activeAdsCount: number;
    totalSpend: number;
    recentTransactions: Transaction[];
    onNavigate: (tab: string) => void;
    onAddFunds: () => void;
    onOpenChat?: () => void;
}

const getCountryFlag = (user: User) => {
  const country = user?.country ?? '';
  if (country.includes('Bangladesh')) return '🇧🇩';
  if (country.includes('Qatar')) return '🇶🇦';
  if (country.includes('Oman')) return '🇴🇲';
  if (country.includes('Bahrain')) return '🇧🇭';
  if (country.includes('Saudi')) return '🇸🇦';
  return '🏳️';
}

const useAnimatedCounter = (end: number, duration = 1000) => {
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
            
            const ease = 1 - Math.pow(1 - percentage, 3); // Simpler easing
            
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

export const UserDashboard: React.FC<UserDashboardProps> = React.memo(({ 
    user, activeAdsCount, totalSpend, recentTransactions, onNavigate, onAddFunds, onOpenChat
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* 1. Action Buttons (Flat Design) - Updated Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                    onClick={onAddFunds}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-green-500/30 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group text-left shadow-sm"
                >
                    <div className="bg-green-100 dark:bg-green-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5"/>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Funds</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Deposit</p>
                </button>

                <button 
                    onClick={() => onNavigate('create_ad')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group text-left shadow-sm"
                >
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                        <Megaphone className="w-5 h-5"/>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create Ad</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Campaign</p>
                </button>

                <button 
                    onClick={() => onNavigate('my_orders')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group text-left shadow-sm"
                >
                    <div className="bg-purple-100 dark:bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5"/>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">My Orders</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track Status</p>
                </button>

                <button 
                    onClick={() => onNavigate('transactions')}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors group text-left shadow-sm"
                >
                    <div className="bg-orange-100 dark:bg-orange-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3 group-hover:scale-110 transition-transform">
                        <History className="w-5 h-5"/>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">History</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Transactions</p>
                </button>
            </div>

            {/* 2. Simple Stats Row - Due Removed */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => onNavigate('my_ads')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm group">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Active Ads</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{activeAdsCount}</h3>
                </div>
                <div onClick={() => onNavigate('transactions')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm group">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Total Spend</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">${(totalSpend || 0).toFixed(2)}</h3>
                </div>
            </div>

            {/* 3. Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500"/> Recent Activity
                    </h3>
                    <button 
                        onClick={() => onNavigate('transactions')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                        View All <ChevronRight className="w-3 h-3"/>
                    </button>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {recentTransactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No recent transactions found.
                        </div>
                    ) : (
                        recentTransactions.slice(0, 3).map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        tx.type === 'DEPOSIT' 
                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' 
                                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                    }`}>
                                        {tx.type === 'DEPOSIT' ? <Plus className="w-4 h-4"/> : <CreditCard className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            {tx.type === 'DEPOSIT' ? 'Funds Added' : 'Ad Payment'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`block font-bold text-sm ${
                                        tx.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}${(tx.amount || 0).toFixed(2)}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        tx.status === 'Completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                                        tx.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                                        'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* AI Banner */}
            <div 
                onClick={onOpenChat}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer group"
            >
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <Bot className="w-5 h-5"/> Need Help?
                        </h3>
                        <p className="text-purple-100 text-sm max-w-xs">Ask Trendify AI about strategies, ad copies, or account help.</p>
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur-sm">
                        <ChevronRight className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
});
