
import React, { useState } from 'react';
import { User } from '../types';
import { Send, Users, X, Bell, CheckCircle, RefreshCw } from './Icons';

interface AdminSendNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onSend: (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AdminSendNotification: React.FC<AdminSendNotificationProps> = ({ isOpen, onClose, users, onSend }) => {
    const [target, setTarget] = useState('ALL');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            onSend(target, title, message, type);
            setIsSubmitting(false);
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center text-white border-b border-white/10">
                    <h3 className="font-bold flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Send Notification
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Recipient</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                            <select 
                                value={target} 
                                onChange={e => setTarget(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white cursor-pointer"
                            >
                                <option value="ALL">All Users (Broadcast)</option>
                                {users.filter(u => u.role === 'USER').map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Notification Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['info', 'success', 'warning', 'error'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t as any)}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                                        type === t 
                                        ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            required
                            value={title} 
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="e.g. System Update"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Message</label>
                        <textarea 
                            required
                            rows={3}
                            value={message} 
                            onChange={e => setMessage(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Type your message here..."
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <><RefreshCw className="w-5 h-5 animate-spin"/> Sending...</> : <><Send className="w-5 h-5"/> Send Notification</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
