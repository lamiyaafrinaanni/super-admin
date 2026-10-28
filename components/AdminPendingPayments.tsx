
import React from 'react';
import { Transaction, User } from '../types';
import { CheckCircle, X, Banknote, Copy, Clock, Check, Send } from './Icons';

interface AdminPendingPaymentsProps {
    payments: Transaction[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const AdminPendingPayments: React.FC<AdminPendingPaymentsProps> = ({ payments, onApprove, onReject }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Fund Requests</h2>
                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 px-4 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 dark:border-indigo-500/30">
                    Total Pending: {payments.length}
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-gray-500 backdrop-blur-md">
                    <Banknote className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                    <p>No pending payment requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {payments.map(tx => (
                        <div key={tx.id} className="bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300">
                            <div className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                                {/* Left Info */}
                                <div className="flex gap-5 w-full lg:w-auto">
                                    <div className="w-16 h-16 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-500 rounded-2xl flex items-center justify-center shrink-0 border border-pink-500/20 dark:border-pink-500/30">
                                        <Send className="w-8 h-8"/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">${(tx.amount || 0).toFixed(2)} USD</h3>
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">≈ {tx.bdtAmount} BDT</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded font-mono text-xs border border-gray-200 dark:border-white/5">{tx.id}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {tx.date}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs font-bold">
                                            <span className="bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-md border border-pink-500/20">
                                                Method: {tx.paymentMethod || 'MANUAL'}
                                            </span>
                                            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1">
                                                TrxID: <span className="font-mono text-gray-900 dark:text-white">{tx.transactionProof}</span>
                                                <button onClick={() => navigator.clipboard.writeText(tx.transactionProof || '')} className="hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"><Copy className="w-3 h-3"/></button>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right User & Actions */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 dark:border-white/10 pt-4 lg:pt-0">
                                    <div className="text-left lg:text-right">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Requested By</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                            User ID: {tx.userId} 
                                            <button onClick={() => navigator.clipboard.writeText(tx.userId)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><Copy className="w-3 h-3"/></button>
                                        </p>
                                    </div>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={() => onApprove(tx.id)}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5"/> Approve
                                        </button>
                                        <button 
                                            onClick={() => onReject(tx.id)}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-white/5 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5"/> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
