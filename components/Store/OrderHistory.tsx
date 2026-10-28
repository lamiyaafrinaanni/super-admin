
import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { CheckSquare, Clock, Package, AlertCircle, CheckCircle, Copy, FileText } from '../Icons';

interface OrderHistoryProps {
    orders: Order[];
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const getSubscriptionStatus = (expiryDate?: string) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return { status: 'Expired', days: 0, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-500/20' };
        return { status: 'Active', days: diffDays, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/20' };
    };

    const getCountdown = (endTime?: string) => {
        if (!endTime) return null;
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "Finishing up...";
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Orders & Subscriptions</h2>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                        <p>No orders found.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all">
                             <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl">
                                        <Package className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Order #{order.id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{order.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg leading-none">${(order.totalAmountUSD || 0).toFixed(2)}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">৳{(order.totalAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${
                                        order.status === 'Processing' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 border-yellow-200' :
                                        order.status === 'Delivered' || order.status === 'Completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 border-green-200' :
                                        'bg-gray-100 dark:bg-white/10 text-gray-600 border-gray-200'
                                    }`}>
                                        {order.status === 'Processing' && <Clock className="w-3 h-3 animate-pulse"/>}
                                        {order.status}
                                    </div>
                                    {order.status === 'Processing' && order.processingEndTime && (
                                        <p className="text-[10px] text-red-500 font-black mt-1 animate-pulse uppercase">Est. {getCountdown(order.processingEndTime)}</p>
                                    )}
                                </div>
                             </div>

                             <div className="space-y-3">
                                 {order.items.map((item, idx) => {
                                     const subStatus = item.productType === 'Subscription' ? getSubscriptionStatus(item.subscriptionExpiryDate) : null;
                                     return (
                                        <div key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                            <div className="flex justify-between items-start text-sm">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{item.productName}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 mt-1">
                                                        <span>Qty: {item.quantity}</span>
                                                        {item.variationName && <span>• {item.variationName}</span>}
                                                        <span className="text-indigo-600 dark:text-indigo-400">• ৳{(item.price || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {item.productType === 'Subscription' && subStatus && (
                                                    <div className={`text-right ${subStatus.bg} px-3 py-1.5 rounded-lg border border-transparent`}>
                                                        <p className={`text-xs font-bold ${subStatus.color} flex items-center gap-1 justify-end`}>
                                                            {subStatus.status === 'Active' ? <Clock className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                                                            {subStatus.status}
                                                        </p>
                                                        {subStatus.status === 'Active' && <p className={`text-[10px] ${subStatus.color} font-medium mt-0.5`}>{subStatus.days} Days Left</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                     )
                                 })}
                             </div>

                             {(order.status === 'Delivered' || order.status === 'Completed') && order.deliveryContent && (
                                 <div className="mt-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4 animate-fade-in">
                                     <h4 className="text-xs font-black text-green-800 dark:text-green-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                         <CheckCircle className="w-4 h-4"/> Your Package is Ready
                                     </h4>
                                     <div className="bg-white dark:bg-black/30 p-3 rounded-lg border border-green-100 dark:border-white/5 font-mono text-xs text-gray-800 dark:text-gray-200 break-all relative group shadow-inner">
                                         {order.deliveryContent}
                                         <button onClick={() => navigator.clipboard.writeText(order.deliveryContent || '')} className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-white/10 rounded hover:bg-gray-200 transition-colors text-gray-500"><Copy className="w-3.5 h-3.5"/></button>
                                     </div>
                                     {order.deliveryNote && <p className="text-[11px] text-green-700 dark:text-green-400 mt-3 italic font-medium">" {order.deliveryNote} "</p>}
                                 </div>
                             )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
