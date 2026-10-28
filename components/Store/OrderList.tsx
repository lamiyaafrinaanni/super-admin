
import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { CheckCircle, Clock, Eye, AlertCircle, X, Package, Send, Copy, FileText } from '../Icons';

interface OrderListProps {
    orders: Order[];
    onUpdateOrder: (id: string, updates: Partial<Order>) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onUpdateOrder }) => {
    // Modal States
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [processingOrder, setProcessingOrder] = useState<Order | null>(null);
    const [deliveryOrder, setDeliveryOrder] = useState<Order | null>(null);

    // Input States
    const [processDuration, setProcessDuration] = useState<number>(30); // minutes
    const [customDuration, setCustomDuration] = useState('');
    const [deliveryContent, setDeliveryContent] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');

    // Countdown Logic for Processing Orders (Simulation)
    useEffect(() => {
        const interval = setInterval(() => {
            orders.forEach(order => {
                if (order.status === 'Processing' && order.processingEndTime) {
                    const timeLeft = new Date(order.processingEndTime).getTime() - Date.now();
                    if (timeLeft <= 0) {
                        // Auto extend by 5 mins if time runs out
                        const newEndTime = new Date(Date.now() + 5 * 60000).toISOString();
                        onUpdateOrder(order.id, { processingEndTime: newEndTime });
                    }
                }
            });
        }, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [orders, onUpdateOrder]);

    const handleStartProcessing = () => {
        if (!processingOrder) return;
        const duration = customDuration ? parseInt(customDuration) : processDuration;
        const endTime = new Date(Date.now() + duration * 60000).toISOString();
        
        onUpdateOrder(processingOrder.id, { 
            status: 'Processing',
            processingEndTime: endTime
        });
        setProcessingOrder(null);
        setCustomDuration('');
    };

    const handleDeliver = () => {
        if (!deliveryOrder) return;
        onUpdateOrder(deliveryOrder.id, {
            status: 'Delivered', // or Completed
            deliveryContent: deliveryContent,
            deliveryNote: deliveryNote
        });
        setDeliveryOrder(null);
        setDeliveryContent('');
        setDeliveryNote('');
    };

    const getCountdown = (endTime?: string) => {
        if (!endTime) return "N/A";
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "Extending...";
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* View Full Summary Modal */}
            {viewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h3>
                            <button onClick={() => setViewOrder(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Customer Info */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Customer Details</h4>
                                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-200 dark:border-white/5 text-sm">
                                    <p><span className="font-bold">Name:</span> {viewOrder.userName}</p>
                                    <p><span className="font-bold">User ID:</span> {viewOrder.userId}</p>
                                    <p><span className="font-bold">Date:</span> {viewOrder.date}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Items</h4>
                                <div className="space-y-2">
                                    {viewOrder.items.map((item, idx) => (
                                        <div key={idx} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                            <div className="flex justify-between font-bold text-sm">
                                                <span>{item.productName}</span>
                                                <span>${item.price}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                <p>Qty: {item.quantity}</p>
                                                {item.variationName && <p>Type: {item.variationName}</p>}
                                                
                                                {/* Customer Input Data */}
                                                {item.customerInput && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                                        <p className="font-bold text-indigo-500 mb-1">Customer Input:</p>
                                                        {Object.entries(item.customerInput).map(([key, val]) => (
                                                            <div key={key} className="flex gap-1 break-all">
                                                                <span className="capitalize">{key}:</span>
                                                                <span className="text-gray-800 dark:text-gray-300 font-mono">{String(val)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Modal */}
            {processingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500"/> Set Processing Time
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[5, 15, 30].map(mins => (
                                    <button 
                                        key={mins}
                                        onClick={() => { setProcessDuration(mins); setCustomDuration(''); }}
                                        className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                                            processDuration === mins && !customDuration 
                                            ? 'bg-yellow-500 text-white border-yellow-600' 
                                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Custom (Minutes)</label>
                                <input 
                                    type="number" 
                                    value={customDuration}
                                    onChange={e => setCustomDuration(e.target.value)}
                                    placeholder="e.g. 60"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setProcessingOrder(null)} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/10 font-bold text-gray-500">Cancel</button>
                                <button onClick={handleStartProcessing} className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-lg">Start</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Modal */}
            {deliveryOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-green-500"/> Deliver Order
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Delivery Content (Link / Code / Text)</label>
                                    <textarea 
                                        rows={4}
                                        value={deliveryContent}
                                        onChange={e => setDeliveryContent(e.target.value)}
                                        placeholder="Paste file link, license key, or code here..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Note to Customer (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={deliveryNote}
                                        onChange={e => setDeliveryNote(e.target.value)}
                                        placeholder="Thank you for your order..."
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setDeliveryOrder(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-gray-500">Cancel</button>
                                <button onClick={handleDeliver} className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4"/> Complete & Deliver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Orders</h2>

            <div className="grid gap-4">
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                        <p>No active orders.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-500">#{order.id.slice(-6).toUpperCase()}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase border ${
                                            order.status === 'Processing' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-500/20' :
                                            order.status === 'On Hold' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/20' :
                                            'bg-gray-100 dark:bg-white/10 text-gray-600'
                                        }`}>
                                            {order.status}
                                        </span>
                                        {order.status === 'Processing' && order.processingEndTime && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 animate-pulse">
                                                <Clock className="w-3 h-3"/> {getCountdown(order.processingEndTime)}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{order.items[0]?.productName} <span className="text-gray-400 text-sm font-normal">({order.items.length} items)</span></h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer: <span className="font-bold text-gray-700 dark:text-gray-200">{order.userName}</span></p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => setViewOrder(order)}
                                        className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4"/> View Summary
                                    </button>

                                    {order.status !== 'Processing' && (
                                        <button 
                                            onClick={() => setProcessingOrder(order)}
                                            className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-200 dark:hover:bg-yellow-500/20 transition-colors flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4"/> Processing
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => setDeliveryOrder(order)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        <Package className="w-4 h-4"/> Deliver
                                    </button>

                                    <button 
                                        onClick={() => onUpdateOrder(order.id, { status: 'On Hold' })}
                                        className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-200 dark:hover:bg-orange-500/20 transition-colors"
                                    >
                                        Hold
                                    </button>

                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Cancel this order?')) onUpdateOrder(order.id, { status: 'Cancelled' });
                                        }}
                                        className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
