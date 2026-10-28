
import React, { useState } from 'react';
import { SocialPageRequest, SocialRequestStatus, User, SocialPlatform } from '../types';
import { Facebook, Instagram, Video, ExternalLink, ShieldCheck, ChevronLeft, CheckCircle, Search, Clock, Check, X, Copy, Heart, MessageCircle, Lock, Key, Info, AlertCircle } from './Icons';

interface AdminSocialRequestsProps {
    requests: SocialPageRequest[];
    users: User[];
    onUpdateStatus: (request: SocialPageRequest, status: SocialRequestStatus, updatedData?: Partial<SocialPageRequest>) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const COUNTRIES = [
    { name: 'Bangladesh (+880)' },
    { name: 'USA (+1)' },
    { name: 'UK (+44)' },
    { name: 'India (+91)' },
    { name: 'Other' }
];

export const AdminSocialRequests: React.FC<AdminSocialRequestsProps> = ({ requests, users, onUpdateStatus, showToast }) => {
    const [verifyRequest, setVerifyRequest] = useState<SocialPageRequest | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [verifyForm, setVerifyForm] = useState({
        pageName: '',
        pageProfilePhoto: '',
        pageCategory: '',
        pageCountry: 'Bangladesh (+880)',
        pageBio: ''
    });

    const filteredRequests = requests.filter(req => {
        const query = searchQuery.toLowerCase();
        return (
            (req.pageName || '').toLowerCase().includes(query) ||
            (req.pageUrl || '').toLowerCase().includes(query) ||
            (req.userName || '').toLowerCase().includes(query) ||
            (req.loginId || '').toLowerCase().includes(query)
        );
    });

    const handleStartVerify = (req: SocialPageRequest) => {
        setVerifyRequest(req);
        // Initialize form with existing data if available
        setVerifyForm({
            pageName: req.pageName || '',
            pageProfilePhoto: req.pageProfilePhoto || '',
            pageCategory: req.pageCategory || '',
            pageCountry: req.pageCountry || 'Bangladesh (+880)',
            pageBio: req.pageBio || ''
        });
    };

    const submitVerification = () => {
        if (!verifyRequest) return;
        
        onUpdateStatus(verifyRequest, SocialRequestStatus.VERIFIED, {
            pageName: verifyForm.pageName,
            pageProfilePhoto: verifyForm.pageProfilePhoto,
            pageCategory: verifyForm.pageCategory,
            pageCountry: verifyForm.pageCountry,
            pageBio: verifyForm.pageBio
        });
        
        setVerifyRequest(null);
    };

    const handleReject = (req: SocialPageRequest) => {
        if (window.confirm('Are you sure you want to reject this request?')) {
            onUpdateStatus(req, SocialRequestStatus.REJECTED);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            if (showToast) showToast(`${label} copied to clipboard!`, 'success');
            else alert(`${label} copied!`);
        });
    };

    // If verifying, show the form
    if (verifyRequest) {
        return (
            <div className="max-w-5xl mx-auto animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={() => setVerifyRequest(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold bg-white dark:bg-white/5 px-4 py-2 rounded-lg transition-colors shadow-sm border border-gray-200 dark:border-white/5">
                        <ChevronLeft className="w-5 h-5"/> Back
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify Page Request</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Data Display */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Header Card with Cover */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden relative group">
                            <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
                                {verifyRequest.pageCoverPhoto ? (
                                    <img src={verifyRequest.pageCoverPhoto} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white opacity-50 font-bold">
                                        Cover Photo Missing
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20"></div>
                                
                                {/* Scraper Status Badge */}
                                <div className="absolute top-4 left-4">
                                    {(verifyRequest as any).is_manual_entry ? (
                                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg">
                                            <AlertCircle className="w-3 h-3"/> No Scraper Data
                                        </div>
                                    ) : (
                                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg">
                                            <CheckCircle className="w-3 h-3"/> Scraped Data
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="px-8 pb-6 relative">
                                <div className="flex justify-between items-end -mt-10 mb-4">
                                    <div className="relative">
                                        <img 
                                            src={verifyRequest.pageProfilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(verifyRequest.pageName)}&background=random`} 
                                            className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-lg object-cover bg-white"
                                        />
                                        <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 text-white ${
                                            verifyRequest.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600' : 'bg-pink-600'
                                        }`}>
                                            {verifyRequest.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-3 h-3"/> : <Instagram className="w-3 h-3"/>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={verifyRequest.pageUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                                            Visit Page <ExternalLink className="w-3 h-3"/>
                                        </a>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {verifyRequest.pageName || 'Pending Name'}
                                            {verifyRequest.isVerifiedBadge && <CheckCircle className="w-5 h-5 text-blue-500"/>}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{verifyRequest.pageCategory || 'No Category'}</p>
                                    </div>
                                    {verifyRequest.followersCount !== undefined && (
                                        <div className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl text-center border border-gray-200 dark:border-white/5">
                                            <span className="block text-lg font-bold text-gray-900 dark:text-white">{verifyRequest.followersCount.toLocaleString()}</span>
                                            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Followers</span>
                                        </div>
                                    )}
                                </div>

                                {verifyRequest.pageBio && (
                                    <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm text-gray-600 dark:text-gray-300 italic border border-gray-100 dark:border-white/5">
                                        "{verifyRequest.pageBio}"
                                    </div>
                                )}
                                
                                {(verifyRequest as any).is_manual_entry && (
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"/>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">ফেসবুক স্ক্র্যাপার কানেক্ট না থাকায় ডাটা পাওয়া যায়নি। অনুগ্রহ করে ম্যানুয়ালি পেজ ডাটা ইনপুট দিন।</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* USER CREDENTIALS DISPLAY */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/30 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-lg">Verification Access</div>
                            <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                                <Lock className="w-4 h-4"/> User Provided Credentials
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 group relative">
                                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Username / Identifier</p>
                                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white break-all">{verifyRequest.loginId || 'N/A'}</p>
                                    <button 
                                        onClick={() => copyToClipboard(verifyRequest.loginId || '', 'Username')}
                                        className="absolute top-4 right-4 p-1.5 bg-white dark:bg-white/10 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Copy className="w-4 h-4"/>
                                    </button>
                                </div>
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 group relative">
                                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Password</p>
                                    <p className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400 break-all">{verifyRequest.loginPassword || 'No Password'}</p>
                                    <button 
                                        onClick={() => copyToClipboard(verifyRequest.loginPassword || '', 'Password')}
                                        className="absolute top-4 right-4 p-1.5 bg-white dark:bg-white/10 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Copy className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Posts Preview */}
                        {verifyRequest.recentPosts && verifyRequest.recentPosts.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 tracking-wider">Scraped Activity Preview</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {verifyRequest.recentPosts.map(post => (
                                        <div key={post.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                            <img src={post.thumbnail} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-200"/>
                                            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                                <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">{post.caption}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3"/> {post.likes}</span>
                                                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3"/> {post.comments}</span>
                                                    <span className="ml-auto">{post.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Edit Form */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-500"/> Verification Data
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Page Name</label>
                                    <input 
                                        type="text" 
                                        value={verifyForm.pageName}
                                        onChange={e => setVerifyForm({...verifyForm, pageName: e.target.value})}
                                        placeholder="User's Page Name"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Category</label>
                                    <input 
                                        type="text" 
                                        value={verifyForm.pageCategory}
                                        onChange={e => setVerifyForm({...verifyForm, pageCategory: e.target.value})}
                                        placeholder="e.g. Media Agency"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Profile Photo URL</label>
                                    <input 
                                        type="text" 
                                        value={verifyForm.pageProfilePhoto}
                                        onChange={e => setVerifyForm({...verifyForm, pageProfilePhoto: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Country</label>
                                    <select 
                                        value={verifyForm.pageCountry}
                                        onChange={e => setVerifyForm({...verifyForm, pageCountry: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white cursor-pointer"
                                    >
                                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Internal Note (Bio)</label>
                                    <textarea 
                                        rows={3}
                                        value={verifyForm.pageBio}
                                        onChange={e => setVerifyForm({...verifyForm, pageBio: e.target.value})}
                                        placeholder="Admin remarks about this page..."
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3">
                                <button 
                                    onClick={submitVerification}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5"/> Complete Verification
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setVerifyRequest(null)}
                                        className="py-3 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleReject(verifyRequest)}
                                        className="py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Page Requests</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                     <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search requests..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                        />
                    </div>
                    <span className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap text-center border border-yellow-200 dark:border-yellow-500/30">
                        Pending: {requests.filter(r => r.status === SocialRequestStatus.PENDING).length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredRequests.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-gray-500">
                        {searchQuery ? (
                            <>
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                                <p>No requests found matching "{searchQuery}"</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                                <p>No social verification requests found.</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex flex-col items-stretch gap-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 w-full">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden ${
                                        req.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600' :
                                        req.platform === SocialPlatform.INSTAGRAM ? 'bg-pink-600' : 'bg-black'
                                    }`}>
                                        {req.pageProfilePhoto ? (
                                            <img src={req.pageProfilePhoto} className="w-full h-full object-cover"/>
                                        ) : (
                                            req.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-8 h-8"/> :
                                            req.platform === SocialPlatform.INSTAGRAM ? <Instagram className="w-8 h-8"/> : <Video className="w-8 h-8"/>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate">{req.pageName || 'Pending Name'}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                                req.status === SocialRequestStatus.PENDING ? 'bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400' :
                                                req.status === SocialRequestStatus.VERIFIED ? 'bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <a href={req.pageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline flex items-center gap-1 mb-2 truncate max-w-md">
                                            {req.pageUrl} <ExternalLink className="w-3 h-3"/>
                                        </a>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-black/20 px-2 py-1 rounded"><Clock className="w-3 h-3"/> {req.date}</span>
                                            <span className="bg-gray-100 dark:bg-black/20 px-2 py-1 rounded">User: <span className="text-gray-800 dark:text-gray-300">{req.userName}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    {req.status === SocialRequestStatus.PENDING && (
                                        <>
                                            <button 
                                                onClick={() => handleStartVerify(req)}
                                                className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                            >
                                                { (req as any).is_manual_entry ? 'Fill Data' : 'Review Data' }
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req)}
                                                className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-white/5 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-colors active:scale-95"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {req.status === SocialRequestStatus.VERIFIED && (
                                        <button disabled className="px-6 py-3 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 rounded-xl font-bold flex items-center gap-2 cursor-default">
                                            <Check className="w-5 h-5"/> Verified
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* DISPLAY CREDENTIALS */}
                            {(req.platform !== SocialPlatform.FACEBOOK && req.loginId) && (
                                <div className="mt-2 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center animate-fade-in">
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider mb-1">Identifier</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{req.loginId}</p>
                                                <button onClick={() => copyToClipboard(req.loginId!, 'Identifier')} className="text-gray-400 hover:text-orange-600 transition-colors"><Copy className="w-3 h-3"/></button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider mb-1">Password</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400">{req.loginPassword || 'No Password'}</p>
                                                <button onClick={() => copyToClipboard(req.loginPassword || '', 'Password')} className="text-gray-400 hover:text-orange-600 transition-colors"><Copy className="w-3 h-3"/></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-white dark:bg-orange-900/40 px-2 py-1 rounded-lg shadow-sm border border-orange-200/50">
                                        <Key className="w-3 h-3"/> Credentials Provided
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
