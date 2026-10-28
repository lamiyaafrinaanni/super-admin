
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, AppSetting } from '../types';
import { Wallet, X, CheckCircle, AlertCircle } from './Icons';
import { db } from '../services/db';
import { initKnowledgeBase } from '../services/geminiService';

declare global {
  interface Window {
    intlTelInput: any;
  }
}

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  clients: User[];
  onPreload?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const MOCK_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '123'
};

export const Login: React.FC<LoginProps> = ({
  onLogin,
  onRegister,
  clients,
  onPreload,
  showToast
}) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const phoneRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<any>(null);

  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const saved = await db.get<any>('settings', 'auth_session');
        if (saved?.value?.identifier) {
          setIdentifier(saved.value.identifier);
          setRememberMe(true);
        }
      } catch {}
    };
    checkSavedSession();
  }, []);

  // Initialize intl-tel-input when view switches to Register or Mount
  useEffect(() => {
    if (!isLoginView && phoneRef.current && window.intlTelInput) {
      itiRef.current = window.intlTelInput(phoneRef.current, {
        initialCountry: "bd",
        preferredCountries: ["bd", "qa", "sa", "ae", "us", "it"],
        separateDialCode: true,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      });
    }
    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, [isLoginView]);

  const handlePersistence = async (id: string) => {
    if (rememberMe) {
      await db.put('settings', {
        id: 'auth_session',
        value: { identifier: id, timestamp: Date.now() }
      });
    } else {
      await db.delete('settings', 'auth_session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLoginView) {
      setIsAuthenticating(true);
      // ADMIN LOGIN
      if (
        identifier === MOCK_ADMIN_CREDENTIALS.username &&
        password === MOCK_ADMIN_CREDENTIALS.password
      ) {
        const adminUser =
          clients.find(u => u.role === UserRole.ADMIN || u.username === 'admin') ||
          (await db.getAll<User>('users')).find(
            u => u.username === 'admin' && u.password === '123'
          );

        if (adminUser) {
          await handlePersistence(identifier);
          onLogin(adminUser);
          setIsAuthenticating(false);
          return;
        }
      }

      // NORMAL USER LOGIN
      const user = clients.find(
        u => u.username === identifier && u.password === password
      );

      if (user) {
        await handlePersistence(identifier);
        onLogin(user);
        setIsAuthenticating(false);
        return;
      }

      setError('Invalid credentials');
      showToast?.('Invalid credentials', 'error');
      setIsAuthenticating(false);
    } else {
      // REGISTER LOGIC
      if (!name || !password) {
        setError('All fields are required');
        return;
      }

      if (!itiRef.current.isValidNumber()) {
        setError('দয়া করে একটি সঠিক মোবাইল নাম্বার দিন।');
        return;
      }

      const fullPhoneNumber = itiRef.current.getNumber();
      const countryData = itiRef.current.getSelectedCountryData();
      
      if (clients.find(u => u.username === fullPhoneNumber)) {
        showToast?.('এই নাম্বার দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে।', 'warning');
        return;
      }

      setIsAuthenticating(true);

      // --- AUTO EXCHANGE RATE CALCULATION ---
      const rateSetting = await db.get<AppSetting>('settings', 'exchange_rates');
      const globalRates = rateSetting?.value || { bd: 120, other: 110 };
      
      // If detected country is Bangladesh (ISO: bd or Dial: 880)
      const isBD = countryData.iso2 === 'bd' || countryData.dialCode === '880';
      const initialRate = isBD ? globalRates.bd : globalRates.other;

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        username: fullPhoneNumber,
        role: UserRole.USER,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        country: `${countryData.name} (+${countryData.dialCode})`,
        balance: 0,
        kycStatus: 'Unverified',
        password,
        businessCategory: 'Retail',
        customExchangeRate: initialRate // Automatically set rate
      };

      await initKnowledgeBase(newUser.id, newUser);
      await handlePersistence(fullPhoneNumber);
      onRegister(newUser);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10 transform transition-all hover:scale-[1.01]">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center transform -rotate-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            AdWallet <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 font-bengali">
            {isLoginView ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div className="animate-fade-in-up">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                পুরো নাম
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="আপনার নাম লিখুন"
                className="w-full px-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-black/20 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all dark:text-white"
              />
            </div>
          )}

          <div className="animate-fade-in-up delay-75">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              {isLoginView ? 'ইউজারনেম / মোবাইল' : 'মোবাইল নাম্বার'}
            </label>
            {isLoginView ? (
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Username or Phone"
                className="w-full px-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-black/20 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all dark:text-white"
              />
            ) : (
              <input
                type="tel"
                ref={phoneRef}
                className="w-full px-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-black/20 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all dark:text-white"
              />
            )}
          </div>

          <div className="animate-fade-in-up delay-150">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-black/20 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all dark:text-white"
            />
          </div>

          {isLoginView && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-tighter">Remember me</span>
              </label>
              <button type="button" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-tighter">Forgot Password?</button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-2xl px-4 py-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bengali">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isAuthenticating ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> processing...</>
            ) : isLoginView ? (
              'Sign In'
            ) : (
              'Register Now'
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center border-t border-gray-100 dark:border-white/5 pt-6">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">
            {isLoginView ? 'New to platform?' : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError('');
              }}
              className="ml-2 text-indigo-600 font-black hover:underline underline-offset-4"
            >
              {isLoginView ? 'CREATE ACCOUNT' : 'LOG IN'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
