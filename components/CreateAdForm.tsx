
import React, { useState, useEffect, useRef } from 'react';
import { User, Ad, SocialPageRequest, SocialPlatform, UserRole, AdStatus, SocialRequestStatus } from '../types';
import { Megaphone, Search, Facebook, Instagram, ExternalLink, Check, Sliders, CheckCircle, X, ChevronDown, Users, Edit, Image, Video, RefreshCw } from './Icons';

interface CreateAdFormProps {
    clients: User[];
    socialRequests: SocialPageRequest[];
    onCreateAd: (ad: Ad, cost?: number) => void;
    onClose?: () => void;
    initialAd?: Ad | null; 
}

interface SocialPost {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    thumbnail: string;
    caption: string;
    date: string;
    url: string;
}

export const CreateAdForm: React.FC<CreateAdFormProps> = ({ clients, socialRequests, onCreateAd, onClose, initialAd }) => {
    const [step, setStep] = useState(1); 
    const [clientSearch, setClientSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientInputRef = useRef<HTMLInputElement>(null);

    const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.FACEBOOK);
    const [selectedPageId, setSelectedPageId] = useState('');
    const [placements, setPlacements] = useState<string[]>(['Facebook']);
    const [runnerType, setRunnerType] = useState('Agency Marketer');
    const [boostLink, setBoostLink] = useState('');
    const [ageMin, setAgeMin] = useState(18);
    const [ageMax, setAgeMax] = useState(65);
    const [dailyBudget, setDailyBudget] = useState<number>(10);
    const [duration, setDuration] = useState<number>(7);

    const [isFetchingPosts, setIsFetchingPosts] = useState(false);
    const [availablePosts, setAvailablePosts] = useState<SocialPost[]>([]);
    const [manualInputMode, setManualInputMode] = useState(false);

    useEffect(() => {
        if (initialAd) {
            const user = clients.find(c => c.id === initialAd.userId);
            if (user) {
                setSelectedUser(user);
                setClientSearch(user.name);
            }
            const linkMatch = initialAd.content.match(/Promoting: (.*?)\n/);
            const link = linkMatch ? linkMatch[1] : '';
            setBoostLink(link);
            if (link) setManualInputMode(true);
            setPlatform(initialAd.platform);
            setDailyBudget(initialAd.dailyBudget || 10);
            setDuration(initialAd.duration || 7);
        }
    }, [initialAd, clients]);

    const filteredClients = clients.filter(c => {
        if (c.role !== UserRole.USER) return false;
        const searchLower = clientSearch.toLowerCase();
        const matchesIdentity = c.name.toLowerCase().includes(searchLower) || c.username.includes(searchLower);
        const matchesPage = socialRequests.some(req => 
            req.userId === c.id && 
            req.status === SocialRequestStatus.VERIFIED && 
            ((req.pageName || '').toLowerCase().includes(searchLower) || (req.pageUrl || '').toLowerCase().includes(searchLower))
        );
        return matchesIdentity || matchesPage;
    });

    const userPages = selectedUser 
        ? socialRequests.filter(req => req.userId === selectedUser.id && req.status === SocialRequestStatus.VERIFIED && req.platform === platform)
        : [];

    useEffect(() => {
        if (userPages.length > 0) {
            const currentIsValid = userPages.find(p => p.id === selectedPageId);
            if (!currentIsValid) setSelectedPageId(userPages[0].id);
        } else {
            setSelectedPageId('');
        }
    }, [platform, selectedUser, userPages.length]);

    useEffect(() => {
        setAvailablePosts([]);
        if (!initialAd) setBoostLink('');
        if (selectedPageId && !manualInputMode) {
            const page = userPages.find(p => p.id === selectedPageId);
            if (page && platform === SocialPlatform.FACEBOOK && page.pageId) {
                setIsFetchingPosts(true);
                const fetchPosts = async () => {
                    try {
                        const apiKey = 'eac8fcd27bmsh73ac195d7c05856p198d15jsn0e552b8cb354';
                        const apiHost = 'facebook-scraper3.p.rapidapi.com';
                        const apiUrl = `https://${apiHost}/page/posts?page_id=${page.pageId}`;
                        const response = await fetch(apiUrl, {
                            method: 'GET',
                            headers: { 'x-rapidapi-host': apiHost, 'x-rapidapi-key': apiKey }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            const results = data.results || [];
                            const mappedPosts: SocialPost[] = results.map((item: any) => {
                                let imageUrl = item.full_picture || item.picture || item.thumbnail_uri || item.image;
                                if ((item.type === 'video' || item.type === 'reel' || item.video) && item.video_thumbnail) imageUrl = item.video_thumbnail;
                                return {
                                    id: item.post_id || Math.random().toString(),
                                    type: (item.type === 'reel' || item.video) ? 'VIDEO' : 'IMAGE',
                                    thumbnail: imageUrl || 'https://via.placeholder.com/150',
                                    caption: item.message || item.description || 'No description',
                                    date: item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString() : 'Recent',
                                    url: item.url || `https://facebook.com/${item.post_id}`
                                };
                            });
                            setAvailablePosts(mappedPosts);
                        }
                    } catch (error) { console.error(error); }
                    finally { setIsFetchingPosts(false); }
                };
                fetchPosts();
            } else {
                setIsFetchingPosts(true);
                setTimeout(() => {
                    setAvailablePosts([]);
                    setIsFetchingPosts(false);
                }, 500);
            }
        }
    }, [selectedPageId, platform, manualInputMode]);

    const selectedPageInfo = userPages.find(p => p.id === selectedPageId);

    const handleClientSelect = (user: User) => {
        setSelectedUser(user);
        setClientSearch(user.name);
        setShowClientDropdown(false);
    };

    const clearClientSelection = () => {
        if (initialAd) return;
        setSelectedUser(null);
        setClientSearch('');
        setShowClientDropdown(true);
        setTimeout(() => clientInputRef.current?.focus(), 100);
    };

    const togglePlacement = (p: string) => {
        setPlacements(placements.includes(p) ? placements.filter(i => i !== p) : [...placements, p]);
    };

    const handleConfirm = () => {
        if (!selectedUser) return;
        const totalCost = dailyBudget * duration;
        const newAd: Ad = {
            id: initialAd ? initialAd.id : `ad-${Date.now()}`,
            userId: selectedUser.id,
            title: `Boost Campaign (${platform})`,
            content: `Promoting: ${boostLink}\nRunner: ${runnerType}\nPlacement: ${placements.join(', ')}`,
            platform: platform,
            status: initialAd ? initialAd.status : AdStatus.ACTIVE,
            userName: selectedUser.name,
            date: initialAd ? initialAd.date : new Date().toISOString().split('T')[0],
            budget: totalCost,
            dailyBudget: dailyBudget,
            duration: duration,
            spent: initialAd ? initialAd.spent : 0
        };
        onCreateAd(newAd, initialAd ? undefined : totalCost);
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] transition-all">
                
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            {initialAd ? <Edit className="w-5 h-5 text-blue-500"/> : <Megaphone className="w-5 h-5 text-indigo-500"/>}
                            {initialAd ? 'Edit Campaign' : 'New Ad Campaign'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50 dark:bg-slate-950">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Client Select */}
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-gray-200 dark:border-white/10 space-y-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Client Identity</label>
                                    {selectedUser ? (
                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img src={selectedUser.avatar} className="w-10 h-10 rounded-lg object-cover" alt=""/>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedUser.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{selectedUser.username}</p>
                                                </div>
                                            </div>
                                            {!initialAd && <button onClick={clearClientSelection} className="text-xs font-bold text-indigo-600 hover:underline">Change</button>}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                            <input 
                                                ref={clientInputRef}
                                                type="text" value={clientSearch}
                                                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                placeholder="Search client name or mobile..."
                                            />
                                            {showClientDropdown && clientSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                                    {filteredClients.map(client => (
                                                        <button key={client.id} onClick={() => handleClientSelect(client)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 text-left">
                                                            <img src={client.avatar} className="w-6 h-6 rounded" alt=""/>
                                                            <span className="text-sm font-semibold">{client.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Ad Details */}
                                <div className={`bg-white dark:bg-slate-900 p-5 rounded-lg border border-gray-200 dark:border-white/10 space-y-6 ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setPlatform(SocialPlatform.FACEBOOK)} className={`py-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${platform === SocialPlatform.FACEBOOK ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 text-blue-600' : 'border-gray-200 dark:border-white/5 text-gray-400'}`}><Facebook className="w-4 h-4"/> Facebook</button>
                                        <button onClick={() => setPlatform(SocialPlatform.INSTAGRAM)} className={`py-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${platform === SocialPlatform.INSTAGRAM ? 'border-pink-600 bg-pink-50 dark:bg-pink-600/10 text-pink-600' : 'border-gray-200 dark:border-white/5 text-gray-400'}`}><Instagram className="w-4 h-4"/> Instagram</button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Asset Link / Post URL</label>
                                            <input type="text" value={boostLink} onChange={e => setBoostLink(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono" placeholder="https://facebook.com/..."/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Daily Budget ($)</label>
                                                <input type="number" value={dailyBudget || ''} onChange={e => setDailyBudget(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold"/>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Duration (Days)</label>
                                                <input type="number" value={duration || ''} onChange={e => setDuration(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className={`bg-white dark:bg-slate-900 p-5 rounded-lg border border-gray-200 dark:border-white/10 flex flex-col justify-between h-full ${!selectedUser ? 'opacity-50' : ''}`}>
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Summary</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Platform:</span> <span className="font-bold">{platform}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal:</span> <span className="font-bold">${(dailyBudget * duration).toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setStep(2)}
                                        disabled={!selectedUser || !boostLink || !dailyBudget}
                                        className="w-full mt-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        Review Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-8 space-y-6 text-center">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-600/10 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle className="w-10 h-10"/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verify Deployment</h3>
                                <p className="text-sm text-gray-500 mt-2">The campaign for <b>{selectedUser?.name}</b> will cost <b>${(dailyBudget * duration).toFixed(2)}</b>. Confirm to finalize.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50">Back</button>
                                <button onClick={handleConfirm} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all">Launch Campaign</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
