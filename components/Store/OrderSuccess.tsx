
import React from 'react';
import { Order } from '../../types';
import { CheckCircle, Package, Clock, Home, ShoppingBag, Copy, CreditCard } from '../Icons';

interface OrderSuccessProps {
    order: Order;
    onNavigate: (path: string) => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({ order, onNavigate }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-8 max-w-lg w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>

                <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং বর্তমানে প্রসেসিং অবস্থায় আছে।
                </p>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-8 border border-gray-200 dark:border-white/10 text-left">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-3 mb-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#{order.id.slice(-8).toUpperCase()}</span>
                            <button onClick={() => navigator.clipboard.writeText(order.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><Copy className="w-3 h-3"/></button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/10 shrink-0">
                                        <Package className="w-4 h-4 text-gray-600 dark:text-gray-400"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.productName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.variationName ? `${item.variationName} • ` : ''} Qty: {item.quantity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Amount (USD)</span>
                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">${(order.totalAmountUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 rounded-xl">
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Paid In BDT</span>
                            <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">৳{(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-8 px-2">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-md"><CheckCircle className="w-4 h-4"/></div>
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400">Placed</span>
                    </div>
                    <div className="h-1 flex-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-center opacity-50">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 flex items-center justify-center text-xs font-bold mb-1"><Clock className="w-4 h-4"/></div>
                        <span className="text-[10px] font-bold text-gray-500">Processing</span>
                    </div>
                    <div className="h-1 flex-1 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                    <div className="flex flex-col items-center opacity-50">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 flex items-center justify-center text-xs font-bold mb-1"><CheckCircle className="w-4 h-4"/></div>
                        <span className="text-[10px] font-bold text-gray-500">Complete</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => onNavigate('my_orders')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"><Package className="w-5 h-5"/> Track My Order</button>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onNavigate('store')} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"><ShoppingBag className="w-4 h-4"/> Shop More</button>
                        <button onClick={() => onNavigate('dashboard')} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"><Home className="w-4 h-4"/> Home</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
