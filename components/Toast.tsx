
import React, { useEffect } from 'react';
import { Toast as ToastType } from '../types';
import { CheckCircle, X, AlertCircle, Info } from './Icons';

interface ToastProps {
    toast: ToastType;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const getColors = () => {
        switch (toast.type) {
            case 'success': return 'bg-green-500 text-white shadow-green-500/20';
            case 'error': return 'bg-red-500 text-white shadow-red-500/20';
            case 'warning': return 'bg-yellow-500 text-white shadow-yellow-500/20';
            default: return 'bg-indigo-600 text-white shadow-indigo-500/20';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up transition-all pointer-events-auto ${getColors()}`}>
            <div className="shrink-0">{getIcon()}</div>
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            <button onClick={() => onClose(toast.id)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastType[], onClose: (id: string) => void }> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
            {toasts.map(t => <Toast key={t.id} toast={t} onClose={onClose} />)}
        </div>
    );
};
