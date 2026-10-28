
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserPlus, X, ShieldCheck, AlertCircle } from './Icons';

interface AddClientFormProps {
    onSave: (user: User) => Promise<void>;
    onCancel: () => void;
    existingClients: User[];
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ onSave, onCancel, existingClients }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim() || !mobile.trim() || !password.trim()) {
        setError("All fields are required.");
        return;
    }

    if (existingClients.find(c => c.username === mobile.trim())) {
      setError('A user with this mobile/username already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: name.trim(),
            username: mobile.trim(),
            role: UserRole.USER,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&color=fff`,
            country: 'Bangladesh (+880)',
            balance: 0,
            kycStatus: 'Unverified',
            password: password.trim()
          };
          await onSave(newUser);
    } catch (err: any) {
        setError(err.message || "Failed to create client account.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up transition-colors duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center text-white border-b border-gray-200 dark:border-white/10">
           <h3 className="font-bold text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Add New Client
           </h3>
           <button onClick={onCancel} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           {error && (
               <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-pulse">
                   <AlertCircle className="w-5 h-5 shrink-0"/>
                   <span>{error}</span>
               </div>
           )}

           <div>
             <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
             <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-inner"
                placeholder="Client Name"
             />
           </div>
           
           <div>
             <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mobile / Username</label>
             <input 
                type="text" 
                required 
                value={mobile} 
                onChange={e => setMobile(e.target.value)} 
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-inner font-mono"
                placeholder="017xxxxxxxx"
             />
           </div>

           <div>
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
              <input 
                type="text" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-inner"
                placeholder="Temporary Password"
              />
           </div>

           <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex gap-3">
               <ShieldCheck className="w-6 h-6 text-indigo-500 shrink-0"/>
               <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                   Accounts are created with <b>$0.00</b> initial balance. You can add funds immediately after creation.
               </p>
           </div>

           <div className="pt-4 flex gap-3">
               <button 
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95"
               >
                Cancel
               </button>
               <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
               >
                {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
                ) : (
                    <><UserPlus className="w-5 h-5"/> Create Account</>
                )}
               </button>
           </div>
        </form>
      </div>
    </div>
  );
};
