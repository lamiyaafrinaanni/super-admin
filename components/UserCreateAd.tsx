
import React, { useState, useEffect } from 'react';
import { User, Ad, SocialPlatform, AdStatus, SocialPageRequest, SocialRequestStatus } from '../types';
import { Facebook, Instagram, ChevronDown, Briefcase, Zap, Sliders, CreditCard, Megaphone, Banknote, AlertCircle, X, ExternalLink, Sparkles, CheckCircle, RefreshCw, Copy, Plus, Trash, Users, Info, ShieldCheck } from './Icons';
import { fetchPageContent, findMatchingContent } from '../services/socialScraper';
import { generateAudienceTargeting } from '../services/geminiService';

interface UserCreateAdProps {
    user: User;
    socialRequests: SocialPageRequest[];
    onCreateAd: (ad: Ad, cost: number) => boolean;
    exchangeRate: number;
    onSuccess: () => void;
    initialData?: any; 
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface AudienceLayer {
    demographics: string[];
    interests: string[];
    behaviours: string[];
}

export const UserCreateAd: React.FC<UserCreateAdProps> = ({ user, socialRequests, onCreateAd, exchangeRate, onSuccess, initialData, showToast }) => {
    const [adForm, setAdForm] = useState({
        platform: SocialPlatform.FACEBOOK,
        accountId: '',
        audienceType: 'AGENCY', // AGENCY, CUSTOM (Custom includes AI flow)
        ageMin: 18,
        ageMax: 65,
        gender: 'Both',
        dailyBudget: 5,
        days: 5,
        title: 'My New Campaign',
        adContent: '',
    });

    const [targetingLayers, setTargetingLayers] = useState<AudienceLayer>({ demographics: [], interests: [], behaviours: [] });
    const [aiExpertNote, setAiExpertNote] = useState<string | null>(null);
    const [isGeneratingAudience, setIsGeneratingAudience] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTagInput, setNewTagInput] = useState<{ layer: keyof AudienceLayer, value: string } | null>(null);
    const [createAdModalOpen, setCreateAdModalOpen] = useState(false);

    const verifiedRequests = socialRequests.filter(req => req.userId === user.id && req.status === SocialRequestStatus.VERIFIED);
    const availablePages = verifiedRequests.filter(r => r.platform === adForm.platform);

    useEffect(() => {
        if (availablePages.length > 0) {
            if (!availablePages.find(p => p.id === adForm.accountId)) {
                setAdForm(prev => ({ ...prev, accountId: availablePages[0].id }));
            }
        } else {
            setAdForm(prev => ({ ...prev, accountId: '' }));
        }
    }, [adForm.platform, socialRequests.length]);

    useEffect(() => {
        if (initialData) {
            setAdForm(prev => ({
                ...prev,
                title: initialData.title || prev.title,
                adContent: initialData.adContent || prev.adContent,
                dailyBudget: initialData.dailyBudget || prev.dailyBudget,
                days: initialData.days || prev.days,
                platform: initialData.platform === 'Instagram' ? SocialPlatform.INSTAGRAM : SocialPlatform.FACEBOOK
            }));
        }
    }, [initialData]);

    const selectedPageInfo = availablePages.find(p => p.id === adForm.accountId);
    const totalCostUSD = adForm.dailyBudget * adForm.days;
    const totalCostBDT = totalCostUSD * exchangeRate;

    const handleGenerateWithAI = async () => {
        if (!selectedPageInfo) {
            showToast?.("অনুগ্রহ করে একটি সোশ্যাল পেজ সিলেক্ট করুন।", "warning");
            return;
        }
        
        setIsGeneratingAudience(true);
        try {
            const pageIdToScrape = selectedPageInfo?.pageId || selectedPageInfo?.pageName || ''; 
            const contents = await fetchPageContent(pageIdToScrape);
            const specificContent = findMatchingContent(contents, adForm.adContent);

            const contentToAnalyze = specificContent || (contents.length > 0 ? contents[0] : { 
                description: adForm.title, type: 'text', likes: 0 
            });

            const aiResult = await generateAudienceTargeting(contentToAnalyze, {
                pageName: selectedPageInfo?.pageName ?? "General",
                pageCategory: selectedPageInfo?.pageCategory ?? "General",
                pageBio: selectedPageInfo?.pageBio ?? ""
            }, user.id);

            setAdForm(prev => ({
                ...prev,
                ageMin: aiResult.age_min,
                ageMax: aiResult.age_max,
                gender: aiResult.gender,
                dailyBudget: aiResult.suggested_daily_budget || prev.dailyBudget,
                days: aiResult.suggested_duration_days || prev.days
            }));

            setTargetingLayers({
                demographics: aiResult.demographics || [],
                interests: aiResult.interests || [],
                behaviours: aiResult.behaviours || []
            });

            setAiExpertNote(aiResult.expert_note);
            showToast?.("এআই স্ট্র্যাটেজি জেনারেট হয়েছে!", "success");

        } catch (e) {
            showToast?.("এআই এনালাইসিস ব্যর্থ হয়েছে।", "error");
        } finally {
            setIsGeneratingAudience(false);
        }
    };

    const handleProceed = () => {
        if (!adForm.accountId) { setError("Please select an account."); return; }
        if (!adForm.adContent.trim()) { setError("Please enter content URL."); return; }
        setCreateAdModalOpen(true);
    };

    const removeTag = (layer: keyof AudienceLayer, index: number) => {
        setTargetingLayers(prev => ({
            ...prev,
            [layer]: prev[layer].filter((_, i) => i !== index)
        }));
    };

    const addTag = (layer: keyof AudienceLayer, value: string) => {
        if (!value.trim()) {
            setNewTagInput(null);
            return;
        }
        setTargetingLayers(prev => ({
            ...prev,
            [layer]: [...prev[layer], value.trim()]
        }));
        setNewTagInput(null);
    };

    const handleCreateAdSubmit = () => {
        const strategyText = `🎯 Target Age: ${adForm.ageMin}-${adForm.ageMax} | Gender: ${adForm.gender}\n✨ Demographics: ${targetingLayers.demographics.join(', ')}\n✨ Interests: ${targetingLayers.interests.join(', ')}\n✨ Behaviours: ${targetingLayers.behaviours.join(', ')}`;
        
        const success = onCreateAd({
            id: `ad-${Date.now()}`,
            userId: user.id,
            title: adForm.title,
            content: `Promoting: ${adForm.adContent}\n\n${strategyText}`,
            platform: adForm.platform,
            status: AdStatus.PENDING,
            userName: user.name,
            date: new Date().toISOString().split('T')[0],
            budget: totalCostUSD,
            dailyBudget: adForm.dailyBudget,
            duration: adForm.days,
            spent: 0
        }, totalCostUSD);
    
        if (success) {
            setCreateAdModalOpen(false);
            onSuccess();
        } else {
            setError("Insufficient Balance.");
        }
    };

    const TargetingLayer = ({ title, layer, icon: Icon, desc }: { title: string, layer: keyof AudienceLayer, icon: any, desc: string }) => (
        <div className="bg-white dark:bg-black/20 p-5 rounded-3xl border border-gray-100 dark:border-white/5 space-y-4 hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Icon className="w-5 h-5"/>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{desc}</p>
                    </div>
                </div>
                <button onClick={() => setNewTagInput({ layer, value: '' })} className="bg-gray-100 dark:bg-white/5 p-2 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
                    <Plus className="w-4 h-4"/>
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[40px]">
                {targetingLayers[layer].map((tag, idx) => (
                    <span key={idx} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-2 group animate-fade-in">
                        {tag}
                        <button onClick={() => removeTag(layer, idx)} className="text-indigo-300 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3"/>
                        </button>
                    </span>
                ))}
                {newTagInput?.layer === layer && (
                    <div className="animate-fade-in flex-1">
                        <input 
                            autoFocus
                            className="w-full bg-gray-50 dark:bg-black/40 px-3 py-1.5 rounded-xl border border-indigo-500/30 outline-none text-xs font-bold"
                            placeholder="Add tag..."
                            onBlur={e => addTag(layer, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTag(layer, (e.target as HTMLInputElement).value)}
                        />
                    </div>
                )}
                {targetingLayers[layer].length === 0 && !newTagInput && (
                    <p className="text-[11px] text-gray-400 italic py-2">Click + to add {title.toLowerCase()}...</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up max-w-[1200px] mx-auto pb-20">
            <div className="text-center py-4">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Campaign Creator</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Build, target, and launch your ads with AI-driven precision.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Config */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-200 dark:border-white/10 p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Megaphone className="w-6 h-6"/></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">Platform & Source</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setAdForm({...adForm, platform: SocialPlatform.FACEBOOK})} className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all ${adForm.platform === SocialPlatform.FACEBOOK ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-200'}`}>
                                <Facebook className={`w-10 h-10 ${adForm.platform === SocialPlatform.FACEBOOK ? 'text-blue-600' : 'text-gray-300'}`}/>
                                <span className={`font-black text-xs uppercase tracking-widest ${adForm.platform === SocialPlatform.FACEBOOK ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400'}`}>Facebook</span>
                            </button>
                            <button onClick={() => setAdForm({...adForm, platform: SocialPlatform.INSTAGRAM})} className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all ${adForm.platform === SocialPlatform.INSTAGRAM ? 'border-pink-500 bg-pink-50 dark:bg-pink-600/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-200'}`}>
                                <Instagram className={`w-10 h-10 ${adForm.platform === SocialPlatform.INSTAGRAM ? 'text-pink-600' : 'text-gray-300'}`}/>
                                <span className={`font-black text-xs uppercase tracking-widest ${adForm.platform === SocialPlatform.INSTAGRAM ? 'text-pink-700 dark:text-pink-400' : 'text-gray-400'}`}>Instagram</span>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row items-center gap-5">
                                <div className="w-16 h-16 rounded-[20px] bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                                    {selectedPageInfo?.pageProfilePhoto ? (
                                        <img src={selectedPageInfo.pageProfilePhoto} className="w-full h-full object-cover"/>
                                    ) : <Users className="w-8 h-8 text-gray-300"/>}
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Target Account</label>
                                    <select value={adForm.accountId} onChange={e => setAdForm({...adForm, accountId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none text-gray-900 dark:text-white font-bold cursor-pointer shadow-inner">
                                        {availablePages.length === 0 && <option>No verified accounts found</option>}
                                        {availablePages.map(p => <option key={p.id} value={p.id}>{p.pageName}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campaign Title</label>
                                    <input type="text" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} placeholder="e.g. Winter Sale 2025" className="w-full px-5 py-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold shadow-inner"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Post / Video Link</label>
                                    <input type="text" value={adForm.adContent} onChange={e => setAdForm({...adForm, adContent: e.target.value})} placeholder="Paste Meta post URL..." className="w-full px-5 py-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs shadow-inner"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Targeting Interface */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-200 dark:border-white/10 p-8 space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/20"><Sparkles className="w-6 h-6"/></div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">Audience Strategy</h3>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-black/40 rounded-2xl p-1 w-full md:w-auto border border-gray-200 dark:border-white/5">
                                {[
                                    { id: 'AGENCY', label: 'Agency Handled' },
                                    { id: 'CUSTOM', label: 'Custom Build' }
                                ].map(t => (
                                    <button key={t.id} onClick={() => setAdForm({...adForm, audienceType: t.id as any})} className={`flex-1 md:flex-none px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all tracking-widest ${adForm.audienceType === t.id ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{t.label}</button>
                                ))}
                            </div>
                        </div>
                        
                        {adForm.audienceType === 'CUSTOM' ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-indigo-600 rounded-[28px] p-6 text-white shadow-2xl shadow-indigo-500/30 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
                                    <div className="relative z-10 text-center md:text-left">
                                        <h4 className="text-lg font-black uppercase italic tracking-tighter">AI Targeting Assistant</h4>
                                        <p className="text-xs text-indigo-100/80 mt-1 font-medium">আপনার পেজ এবং কন্টেন্ট এনালাইসিস করে অটোমেটিক টার্গেটিং সেট করুন।</p>
                                    </div>
                                    <button onClick={handleGenerateWithAI} disabled={isGeneratingAudience} className="w-full md:w-auto bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isGeneratingAudience ? <RefreshCw className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>}
                                        {isGeneratingAudience ? 'এনালাইসিস চলছে...' : 'Generate with AI'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-black/20 p-6 rounded-3xl border border-gray-100 dark:border-white/5 space-y-4">
                                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Range & Demographics</h4>
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Age Span</p>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" value={adForm.ageMin} onChange={e => setAdForm({...adForm, ageMin: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-black/40 text-center font-black py-2.5 rounded-xl border border-gray-200 dark:border-white/10 outline-none text-sm"/>
                                                    <span className="text-gray-400 font-black">-</span>
                                                    <input type="number" value={adForm.ageMax} onChange={e => setAdForm({...adForm, ageMax: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-black/40 text-center font-black py-2.5 rounded-xl border border-gray-200 dark:border-white/10 outline-none text-sm"/>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Gender</p>
                                                <div className="flex bg-gray-50 dark:bg-black/40 rounded-xl p-1 border border-gray-200 dark:border-white/10">
                                                    {['Both', 'Men', 'Women'].map(g => (
                                                        <button key={g} onClick={() => setAdForm({...adForm, gender: g as any})} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${adForm.gender === g ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>{g}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-4">
                                        {aiExpertNote && (
                                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/30 animate-fade-in flex gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 text-white shadow-lg"><Zap className="w-5 h-5"/></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">AI Marketing Tip</p>
                                                    <p className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed font-bold">"{aiExpertNote}"</p>
                                                </div>
                                            </div>
                                        )}
                                        {!aiExpertNote && (
                                            <div className="p-5 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-center flex flex-col items-center justify-center">
                                                <Info className="w-6 h-6 text-gray-200 mb-2"/>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Expert is ready to analyze your post content.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <TargetingLayer title="Demographics" layer="demographics" icon={Users} desc="Life Stages & Jobs"/>
                                    <TargetingLayer title="Interests" layer="interests" icon={Sparkles} desc="Topics & Hobbies"/>
                                    <TargetingLayer title="Behaviours" layer="behaviours" icon={Zap} desc="Buying Habits"/>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[28px] flex items-center justify-center mx-auto text-gray-300 dark:text-gray-600 shadow-inner">
                                    <ShieldCheck className="w-10 h-10"/>
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Verified Agency Management</h4>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium mt-1">Our certified Meta marketing experts will manually analyze your content and set high-performance targeting for you.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-200 dark:border-white/10 p-8 sticky top-24 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 p-2.5 rounded-2xl text-white shadow-lg shadow-green-600/20"><Banknote className="w-6 h-6"/></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">Budget & Launch</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Budget ($)</label>
                                    <span className="text-lg font-black text-indigo-600">${adForm.dailyBudget}</span>
                                </div>
                                <input type="range" min="1" max="100" value={adForm.dailyBudget} onChange={e => setAdForm({...adForm, dailyBudget: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer dark:bg-white/10"/>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration (Days)</label>
                                    <span className="text-lg font-black text-indigo-600">{adForm.days} Days</span>
                                </div>
                                <input type="range" min="1" max="30" value={adForm.days} onChange={e => setAdForm({...adForm, days: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer dark:bg-white/10"/>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-600/5 p-6 rounded-[28px] border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Payable</span>
                                <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tighter">${totalCostUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-indigo-100 dark:border-indigo-500/20 pt-4">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Approx in BDT</span>
                                <span className="text-xl font-black text-indigo-700 dark:text-indigo-200">৳{Math.round(totalCostBDT).toLocaleString()}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-shake">
                                <AlertCircle className="w-5 h-5 shrink-0"/>
                                <span>{error}</span>
                            </div>
                        )}

                        <button onClick={handleProceed} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.25em] text-[10px] py-5 rounded-[24px] shadow-2xl shadow-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            Initiate Campaign <ChevronDown className="-rotate-90 w-4 h-4"/>
                        </button>
                    </div>
                </div>
            </div>

            {createAdModalOpen && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 max-w-sm w-full text-center border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 shadow-inner">
                            <CheckCircle className="w-12 h-12"/>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter italic">Verify Launch</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                            আপনি কি <strong>${totalCostUSD.toFixed(2)}</strong> পেমেন্ট করে <b>{adForm.platform}</b>-এ ক্যাম্পেইনটি শুরু করতে চান?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleCreateAdSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl transition-all active:scale-95">Confirm & Deduct</button>
                            <button onClick={() => setCreateAdModalOpen(false)} className="w-full py-4 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 transition-colors">Cancel Launch</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
