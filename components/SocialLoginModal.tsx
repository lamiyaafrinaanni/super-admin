
import React, { useState, useEffect } from 'react';
import { SocialPlatform, SocialPageRequest, SocialRequestStatus } from '../types';
import { Instagram, Video, Facebook, X, ShieldCheck, Copy, Youtube, ExternalLink, CheckCircle, AlertCircle, ChevronRight, UserPlus, Link, ChevronLeft, WhatsApp, Lock } from './Icons';

interface SocialLoginModalProps {
  isOpen: boolean;
  platform: SocialPlatform | null;
  onClose: () => void;
  onConnect: (identifier: string, password?: string) => Promise<void>;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  // NEW PROP
  branding?: {
      appName: string;
      supportPhone: string;
      fbAdminName: string;
      fbAdminLink: string;
      fbAdminImage: string;
      tutorialVideoId: string;
  };
}

export const SocialLoginModal: React.FC<SocialLoginModalProps> = ({ isOpen, platform, onClose, onConnect, showToast, branding }) => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Defaults if branding is not provided
  const config = branding || {
      appName: 'AdWallet Pro',
      supportPhone: '8801983000739',
      fbAdminName: 'Nasimul Islam Sheikh',
      fbAdminLink: 'https://www.facebook.com/Nasimul2.0',
      fbAdminImage: 'https://trendifyboost.com/wp-content/uploads/2025/10/Nasimul-Islam-Sheikh.png',
      tutorialVideoId: 'zg8zxaarC3A'
  };

  useEffect(() => {
      if (isOpen) {
          setIdentifier('');
          setPassword('');
          setError(null);
          setIsConnecting(false);
      }
  }, [isOpen]);

  if (!isOpen || !platform) return null;

  const getPlatformColor = () => {
      if (platform === SocialPlatform.INSTAGRAM) return 'from-pink-500 to-purple-600';
      if (platform === SocialPlatform.TIKTOK) return 'from-gray-700 to-black';
      return 'from-blue-600 to-indigo-600';
  };

  const validateInput = () => {
      if (!identifier.trim()) return "Identifier is required.";
      const lowerId = identifier.toLowerCase();
      if (platform === SocialPlatform.FACEBOOK) {
          if (identifier.includes('http') && !lowerId.includes('facebook.com') && !lowerId.includes('fb.com')) {
              return "Please enter a valid Facebook URL.";
          }
      } else if (platform === SocialPlatform.INSTAGRAM || platform === SocialPlatform.TIKTOK) {
          if (!password) return "Password is required for secure connection.";
      }
      return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateInput();
    if (validationError) {
        setError(validationError);
        showToast?.(validationError, 'warning');
        return;
    }
    setIsConnecting(true);
    try {
        await onConnect(identifier, password);
        onClose(); 
    } catch (err: any) {
        const msg = err.message || "Connection failed.";
        setError(msg);
        showToast?.(msg, 'error');
    } finally { setIsConnecting(false); }
  };

  const handlePaste = async () => {
    try {
        const text = await navigator.clipboard.readText();
        setIdentifier(text);
        showToast?.("Link pasted successfully", "info");
    } catch (err) { showToast?.("Please paste the link manually.", "warning"); }
  };

  const handleCopyAdminLink = () => {
    navigator.clipboard.writeText(config.fbAdminLink)
        .then(() => showToast?.("Admin Link Copied!", "success"))
        .catch(() => showToast?.("Failed to copy link", "error"));
  };

  if (platform === SocialPlatform.FACEBOOK) {
      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col animate-fade-in transition-colors duration-300 overflow-hidden">
            <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-gray-700 dark:text-gray-300 active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-600/20"><Facebook className="w-5 h-5"/></div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Connect Facebook Page</h2>
                            <p className="text-xs text-gray-500 mt-1">Verify page access for automated boosting</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6"/></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-slate-950">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x dark:divide-white/5 min-h-full">
                    <div className="p-6 md:p-10 space-y-8 bg-white dark:bg-slate-900/50">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2 block">Quick Verification</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Authorizing Your Page</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Follow these simple steps to connect your page with {config.appName}. We use secure methods to manage your campaigns efficiently.</p>
                        </div>

                        <div className="space-y-8 relative">
                            <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-blue-100 dark:bg-blue-900/20 -z-10"></div>
                            
                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-600/20 z-10">1</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">Grant Access</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">First, copy our Admin ID link and give <strong className="text-blue-600">Editor/Admin Access</strong> of your Facebook page to this account.</p>
                                    
                                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-4 group transition-all hover:border-blue-500/50">
                                        <img src={config.fbAdminImage} alt="Admin" className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 dark:text-white font-bold text-sm truncate">{config.fbAdminName}</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">System Admin</p>
                                        </div>
                                        <button onClick={handleCopyAdminLink} className="px-4 py-2 bg-white dark:bg-white/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-900/50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"><Copy className="w-3.5 h-3.5"/> Copy Link</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-sm z-10 transition-all ${identifier ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-gray-700 text-gray-400'}`}>2</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">Submit Page URL</h4>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors"><Link className="w-5 h-5"/></div>
                                        <input type="text" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(null); }} className={`w-full pl-12 pr-24 py-3.5 bg-gray-50 dark:bg-black/30 border rounded-xl outline-none text-sm transition-all shadow-inner ${error ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 dark:text-white'}`} placeholder="https://facebook.com/your-page-url" />
                                        <button onClick={handlePaste} className="absolute right-2 top-2 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 px-4 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 transition-all active:scale-95">Paste Link</button>
                                    </div>
                                    {error && <p className="text-red-500 text-xs mt-2.5 flex items-center gap-1.5 animate-pulse"><AlertCircle className="w-4 h-4"/> {error}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button onClick={handleSubmit} disabled={!identifier || isConnecting} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}>
                                {isConnecting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying Access...</> : <><ShieldCheck className="w-6 h-6"/> Connect Facebook Page</>}
                            </button>
                            <p className="text-center text-[11px] text-gray-400 mt-4 flex justify-center gap-2 items-center"><Lock className="w-3 h-3"/> Secured by AdWallet Pro end-to-end encryption.</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-10 bg-gray-50/50 dark:bg-slate-900/20 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full text-center lg:text-left">
                            <div className="mb-8">
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full uppercase border border-red-200 dark:border-red-900/30">Video Tutorial</span>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4">সহজ পদ্ধতিতে পেজ কানেক্ট করুন</h3>
                                <p className="text-sm text-gray-500 mt-2">কিভাবে এক্সেস দিবেন তা বুঝতে নিচের ভিডিওটি শেষ পর্যন্ত দেখুন।</p>
                            </div>

                            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 mb-8 relative group">
                                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${config.tutorialVideoId}`} title="Connect Guide" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="relative z-10"></iframe>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 dark:bg-green-500/20 text-green-600 p-2.5 rounded-lg shrink-0"><WhatsApp className="w-5 h-5"/></div>
                                    <div>
                                        <h5 className="font-bold text-gray-900 dark:text-white text-sm">সহযোগিতা প্রয়োজন?</h5>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">কানেক্ট করতে কোনো সমস্যা হলে সরাসরি আমাদের সাপোর্ট টিমের সাথে হোয়াটসঅ্যাপে যোগাযোগ করুন।</p>
                                        <a href={`https://wa.me/${config.supportPhone}?text=${encodeURIComponent("Expert: I need help connecting my Facebook Page.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-green-600 dark:text-green-400 text-xs font-bold hover:underline">Chat on WhatsApp <ExternalLink className="w-3.5 h-3.5"/></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up relative transition-all">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getPlatformColor()}`}></div>
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 dark:border-white/10">
           <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">Connect <span className="capitalize">{platform}</span></h3>
           <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-white/5 p-1.5 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-8">
           <div className="flex justify-center mb-8">
              <div className={`p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-lg bg-gradient-to-br ${getPlatformColor()} bg-opacity-5`}>
                 {platform === SocialPlatform.INSTAGRAM ? <Instagram className="w-10 h-10 text-pink-500" /> : <Video className="w-10 h-10 text-gray-900 dark:text-white" />}
              </div>
           </div>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Username or Profile URL</label>
               <input type="text" value={identifier} onChange={e => { setIdentifier(e.target.value); setError(null); }} className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-sm transition-all ${error ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-indigo-500 dark:text-white'}`} placeholder={platform === SocialPlatform.TIKTOK ? "@username" : "Username"} />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Account Password</label>
               <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-sm transition-all ${error ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-indigo-500 dark:text-white'}`} placeholder="••••••••" />
             </div>
             {error && <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-lg flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 shrink-0"/> {error}</div>}
             <button type="submit" disabled={isConnecting} className={`w-full font-bold py-3.5 rounded-xl text-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${platform === SocialPlatform.INSTAGRAM ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-gray-900 dark:bg-white dark:text-black'} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}>
               {isConnecting ? <span className="flex items-center gap-2 text-sm"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Connecting...</span> : <><ShieldCheck className="w-5 h-5"/> Secure Connect</>}
             </button>
           </form>
           <p className="text-center text-[10px] text-gray-400 mt-6 flex justify-center gap-2 items-center"><ShieldCheck className="w-3 h-3"/> End-to-end encrypted connection.</p>
        </div>
      </div>
    </div>
  );
};
