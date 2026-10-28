
import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, Globe, Phone, MapPin, Mail, Zap, Bot, Search, Sliders, Plus, Trash, AlertCircle, CheckSquare, X, Check, CreditCard, MessageCircle, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Share, Facebook, Lock, Activity, Server, Cpu, TrendingUp, Star, PlayCircle, Eye, ShieldCheck, FileText, Brain, Clock, Video, Code, Terminal, Database, Play, Key, Sparkles, Send, WhatsApp, Youtube, Image as ImageIcon } from './Icons';
import { ApiKeyConfig, AppSetting, User } from '../types';
import { fetchGoogleModels, fetchOpenRouterModels, getLiveHealthStats, generateChatResponse } from '../services/geminiService';
import { db } from '../services/db';
import { ToolsIntegration } from './ToolsIntegration';

interface EngineModel {
    id: string;
    name: string;
    provider: 'google' | 'openrouter';
    contextWindow: string;
    pricing: 'free' | 'paid';
    enabled: boolean; 
    isLive: boolean;  
    category?: 'Native' | 'Pro' | 'Fast' | 'Vision';
}

interface TestResult {
    modelId: string;
    modelName: string;
    status: 'pending' | 'success' | 'error';
    response: string;
    latency: number;
    provider: string;
}

const LiveHealthDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    useEffect(() => {
        const fetchStats = () => setStats(getLiveHealthStats());
        fetchStats();
        const interval = setInterval(fetchStats, 3000); 
        return () => clearInterval(interval);
    }, []);
    if (!stats) return <div className="p-4 text-center text-gray-500">Loading metrics...</div>;
    const getStatusColor = (status: string) => {
        if (status === 'ONLINE') return 'bg-green-500';
        if (status === 'DEGRADED') return 'bg-yellow-500';
        return 'bg-red-500';
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-[10px] font-bold uppercase tracking-tight">Requests / Min</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rpm}</div>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-[10px] font-bold uppercase tracking-tight">Active Chats</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeConversations}</div>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-[10px] font-bold uppercase tracking-tight">Google Status</div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(stats.providerStatus.google)} animate-pulse`}></div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{stats.providerStatus.google}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-[10px] font-bold uppercase tracking-tight">OpenRouter</div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(stats.providerStatus.openrouter)} animate-pulse`}></div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{stats.providerStatus.openrouter}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminSettings: React.FC<{ userData?: User }> = ({ userData }) => {
    const [activeTab, setActiveTab] = useState<'ai_agent' | 'scraper' | 'general'>('ai_agent');
    
    // --- AI AGENT / ENGINE LIBRARY STATES ---
    const [engineModels, setEngineModels] = useState<EngineModel[]>([]);
    const [modelSearch, setModelSearch] = useState('');
    const [manualModelId, setManualModelId] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Google' | 'OpenRouter' | 'Free' | 'Paid'>('All');
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- PLAYGROUND STATES ---
    const [testPrompt, setTestPrompt] = useState('');
    const [isTestingModels, setIsTestingModels] = useState(false);
    const [multiTestResults, setMultiTestResults] = useState<TestResult[]>([]);
    const [playgroundFilter, setPlaygroundFilter] = useState<'ALL' | 'WORKING' | 'ERROR'>('ALL');
    const [playCategoryFilter, setPlayCategoryFilter] = useState<'ALL' | 'GOOGLE' | 'OPENROUTER'>('ALL');

    // --- API KEY / CONNECTION HUB STATES ---
    const [appApiKeys, setAppApiKeys] = useState<ApiKeyConfig[]>([]);
    const [newKeyForm, setNewKeyForm] = useState({ label: '', key: '', provider: 'google' as 'google' | 'openrouter' });

    // --- GENERAL / BRANDING STATES ---
    const [exchangeRates, setExchangeRates] = useState({ bd: 120, other: 110 });
    const [branding, setBranding] = useState({
        appName: 'AdWallet Pro',
        appLogo: '',
        primaryColor: '#4f46e5',
        fontSize: '14',
        logoSize: '40',
        supportPhone: '8801983000739',
        fbAdminName: 'Nasimul Islam Sheikh',
        fbAdminLink: 'https://www.facebook.com/Nasimul2.0',
        fbAdminImage: 'https://trendifyboost.com/wp-content/uploads/2025/10/Nasimul-Islam-Sheikh.png',
        tutorialVideoId: 'zg8zxaarC3A'
    });

    useEffect(() => {
        const loadSettings = async () => {
            const loadedAppKeys = await db.getAll<ApiKeyConfig>('api_keys');
            setAppApiKeys(loadedAppKeys);

            const modelSettings = await db.get<AppSetting>('settings', 'engine_library');
            if (modelSettings) setEngineModels(modelSettings.value);

            const brandingSettings = await db.get<AppSetting>('settings', 'general_branding');
            if (brandingSettings) setBranding(brandingSettings.value);

            const rates = await db.get<AppSetting>('settings', 'exchange_rates');
            if (rates) setExchangeRates(rates.value);
        };
        loadSettings();
    }, []);

    const saveGeneralSettings = async () => {
        await db.put('settings', { id: 'general_branding', value: branding });
        await db.put('settings', { id: 'exchange_rates', value: exchangeRates });
        alert("Settings Updated Successfully!");
    };

    const saveModelsToDb = async (updated: EngineModel[]) => {
        setEngineModels(updated);
        await db.put('settings', { id: 'engine_library', value: updated });
    };

    const handleAddManualModel = async () => {
        if (!manualModelId.trim()) return;
        const mId = manualModelId.trim().toLowerCase();
        
        if (engineModels.find(m => m.id === mId)) {
            alert("This model is already in your library.");
            return;
        }

        const newModel: EngineModel = {
            id: mId,
            name: mId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            provider: 'google',
            contextWindow: '1M',
            pricing: mId.includes('pro') ? 'paid' : 'free',
            enabled: true,
            isLive: false,
            category: 'Native'
        };

        const updated = [newModel, ...engineModels];
        await saveModelsToDb(updated);
        setManualModelId('');
    };

    const toggleEnabled = (id: string) => {
        const updated = engineModels.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
        saveModelsToDb(updated);
    };

    const toggleLive = (id: string) => {
        const updated = engineModels.map(m => m.id === id ? { ...m, isLive: !m.isLive } : m);
        saveModelsToDb(updated);
    };

    const deleteModel = (id: string) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        const updated = engineModels.filter(m => m.id !== id);
        saveModelsToDb(updated);
    };

    const handleBulkAction = (action: 'ENABLE' | 'DISABLE' | 'DELETE') => {
        if (selectedIds.size === 0) return;
        let updated: EngineModel[] = [...engineModels];
        if (action === 'ENABLE') updated = updated.map(m => selectedIds.has(m.id) ? { ...m, enabled: true } : m);
        else if (action === 'DISABLE') updated = updated.map(m => selectedIds.has(m.id) ? { ...m, enabled: false } : m);
        else if (action === 'DELETE') updated = updated.filter(m => !selectedIds.has(m.id));
        saveModelsToDb(updated);
        setSelectedIds(new Set());
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(new Set(filteredFleet.map(m => m.id)));
        else setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSyncModels = async () => {
        setIsSyncing(true);
        try {
            const [googleModels, orModels] = await Promise.all([fetchGoogleModels(), fetchOpenRouterModels()]);
            const currentList = [...engineModels];
            googleModels.forEach(mId => {
                if (!currentList.find(m => m.id === mId)) {
                    currentList.push({ id: mId, name: mId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), provider: 'google', contextWindow: '1M', pricing: mId.includes('pro') ? 'paid' : 'free', enabled: false, isLive: false, category: 'Native' });
                }
            });
            orModels.forEach(m => {
                if (!currentList.find(curr => curr.id === m.id)) {
                    currentList.push({ id: m.id, name: m.name || m.id, provider: 'openrouter', contextWindow: '128K', pricing: 'paid', enabled: false, isLive: false, category: 'Fast' });
                }
            });
            saveModelsToDb(currentList);
        } catch (e) { alert("Sync failed."); }
        finally { setIsSyncing(false); }
    };

    const handleMultiModelTest = async () => {
        if (!testPrompt.trim()) return;
        const testingFleet = engineModels.filter(m => m.enabled);
        setIsTestingModels(true);
        setMultiTestResults(testingFleet.map(m => ({ modelId: m.id, modelName: m.name, status: 'pending', response: '', latency: 0, provider: m.provider })));
        await Promise.all(testingFleet.map(async (model) => {
            const start = Date.now();
            try {
                const response = await generateChatResponse(testPrompt, { user: { ...userData, forcedModel: model.id } });
                setMultiTestResults(prev => prev.map(r => r.modelId === model.id ? { ...r, status: response.includes("AI Service Error") ? 'error' : 'success', response, latency: Date.now() - start } : r));
            } catch (e: any) {
                setMultiTestResults(prev => prev.map(r => r.modelId === model.id ? { ...r, status: 'error', response: e.message, latency: Date.now() - start } : r));
            }
        }));
        setIsTestingModels(false);
    };

    const handleAddAppKey = async () => {
        if (!newKeyForm.label || !newKeyForm.key) return;
        const newKey: ApiKeyConfig = {
            id: `key-${Date.now()}`,
            provider: newKeyForm.provider,
            key: newKeyForm.key,
            label: newKeyForm.label,
            dailyLimit: 2000, usedToday: 0, errorCount: 0, status: 'active', 
            createdDate: new Date().toISOString()
        };
        await db.add('api_keys', newKey);
        setAppApiKeys([...appApiKeys, newKey]);
        setNewKeyForm({ label: '', key: '', provider: 'google' });
    };

    const filteredFleet = useMemo(() => 
        engineModels.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.id.toLowerCase().includes(modelSearch.toLowerCase());
            const matchesCategory = categoryFilter === 'All' ? true : categoryFilter === 'Google' ? m.provider === 'google' : categoryFilter === 'OpenRouter' ? m.provider === 'openrouter' : categoryFilter === 'Free' ? (m.pricing === 'free' || m.name.toLowerCase().includes('free')) : m.pricing === 'paid';
            return matchesSearch && matchesCategory;
        })
    , [engineModels, modelSearch, categoryFilter]);

    const filteredPlaygroundResults = useMemo(() => {
        return multiTestResults.filter(res => {
            const matchesStatus = playgroundFilter === 'ALL' ? true : playgroundFilter === 'WORKING' ? res.status === 'success' : res.status === 'error';
            const matchesProvider = playCategoryFilter === 'ALL' ? true : playCategoryFilter === 'GOOGLE' ? res.provider === 'google' : res.provider === 'openrouter';
            return matchesStatus && matchesProvider;
        });
    }, [multiTestResults, playgroundFilter, playCategoryFilter]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500"/> System Setup
            </h2>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-black/20">
                    {['ai_agent', 'scraper', 'general'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-4 font-bold text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            {tab === 'scraper' ? <Terminal className="w-4 h-4"/> : tab === 'ai_agent' ? <Brain className="w-4 h-4"/> : <Sliders className="w-4 h-4"/>}
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'ai_agent' && (
                        <div className="space-y-12 animate-fade-in">
                            <LiveHealthDashboard />
                            
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <Database className="w-5 h-5 text-green-500"/> Live Model Library
                                    </h3>
                                    <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-tighter">
                                        {engineModels.filter(m => m.isLive).length} Active Engines
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {engineModels.filter(m => m.isLive).map(m => (
                                        <div key={m.id} className="bg-gray-50 dark:bg-white/5 border border-green-200 dark:border-green-500/20 p-3 rounded-xl flex flex-col items-center text-center group relative overflow-hidden">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.provider === 'google' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                {m.provider === 'google' ? <Sparkles className="w-4 h-4"/> : <Cpu className="w-4 h-4"/>}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate w-full">{m.name}</span>
                                            <button onClick={() => toggleLive(m.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-indigo-50/30 dark:bg-indigo-900/5 p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><PlayCircle className="w-5 h-5 text-indigo-500"/> Parallel Model Playground</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex bg-white dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                            {['ALL', 'WORKING', 'ERROR'].map(f => (
                                                <button key={f} onClick={() => setPlaygroundFilter(f as any)} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${playgroundFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{f}</button>
                                            ))}
                                        </div>
                                        <div className="flex bg-white dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                            {['ALL', 'GOOGLE', 'OPENROUTER'].map(f => (
                                                <button key={f} onClick={() => setPlayCategoryFilter(f as any)} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${playCategoryFilter === f ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{f}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)} placeholder="Send a prompt to all enabled test engines..." className="flex-1 p-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                                    <button onClick={handleMultiModelTest} disabled={isTestingModels || !testPrompt.trim()} className="bg-indigo-600 text-white font-bold px-8 rounded-xl flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-indigo-700">
                                        {isTestingModels ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Send className="w-6 h-6"/>}
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Run Test</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredPlaygroundResults.map(res => (
                                        <div key={res.modelId} className={`bg-white dark:bg-slate-800 p-4 border rounded-xl shadow-sm flex flex-col h-[300px] overflow-hidden ${res.status === 'error' ? 'border-red-500' : 'border-gray-200 dark:border-white/10'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-xs text-gray-900 dark:text-white">{res.modelName}</span>
                                                <span className="text-[10px] text-gray-400">{res.latency}ms</span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-300 flex-1 overflow-y-auto custom-scrollbar">{res.response}</div>
                                            <button onClick={() => toggleLive(res.modelId)} className={`w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${engineModels.find(m => m.id === res.modelId)?.isLive ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-600 text-white shadow-md active:scale-95'}`}>
                                                {engineModels.find(m => m.id === res.modelId)?.isLive ? 'Remove from Live' : 'Send to Live'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4 pt-4 relative">
                                {selectedIds.size > 0 && (
                                    <div className="sticky top-16 z-30 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center justify-between animate-fade-in-up">
                                        <span className="text-sm font-bold">{selectedIds.size} Selected</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleBulkAction('ENABLE')} className="bg-white/20 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-white/30 transition-colors">For Test</button>
                                            <button onClick={() => handleBulkAction('DISABLE')} className="bg-white/10 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-white/20 transition-colors">Not Ready</button>
                                            <button onClick={() => handleBulkAction('DELETE')} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-red-600 transition-colors">Delete</button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Sliders className="w-5 h-5 text-indigo-500"/> Fleet Management</h3>
                                        <div className="flex gap-2">
                                            {['All', 'Google', 'OpenRouter', 'Free', 'Paid'].map((cat: any) => (
                                                <button key={cat} onClick={() => setCategoryFilter(cat)} className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100'}`}>{cat}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                            <input 
                                                type="text" 
                                                value={manualModelId} 
                                                onChange={e => setManualModelId(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && handleAddManualModel()}
                                                placeholder="Model Name (Press Enter to Add)" 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            <button onClick={handleSyncModels} disabled={isSyncing} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-bold uppercase rounded-lg border border-indigo-200 flex items-center gap-2 transition-all hover:bg-indigo-100"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}/> Sync Cloud</button>
                                            <div className="flex flex-1 sm:flex-none gap-1">
                                                <button onClick={() => saveModelsToDb(engineModels.map(m => ({...m, enabled: true})))} className="flex-1 sm:flex-none px-4 py-2 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-l-lg border border-green-200">Enable All</button>
                                                <button onClick={() => saveModelsToDb(engineModels.map(m => ({...m, enabled: false})))} className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase rounded-r-lg border border-gray-200">Disable All</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
                                        <Search className="w-4 h-4 text-gray-400 ml-2"/>
                                        <input type="text" value={modelSearch} onChange={e => setModelSearch(e.target.value)} placeholder="Search engine fleet..." className="flex-1 bg-transparent border-none outline-none text-xs" />
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="text-[10px] font-bold uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-slate-900">
                                                <tr>
                                                    <th className="px-6 py-4 w-10">
                                                        <input type="checkbox" className="w-4 h-4 accent-indigo-600" onChange={(e) => handleSelectAll(e.target.checked)} />
                                                    </th>
                                                    <th className="px-6 py-4">Engine Identifier</th>
                                                    <th className="px-6 py-4">Capacity</th>
                                                    <th className="px-6 py-4 text-center">Eligibility</th>
                                                    <th className="px-6 py-4 text-right">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                {filteredFleet.map(model => (
                                                    <tr key={model.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-all ${!model.enabled ? 'opacity-40 grayscale' : ''}`}>
                                                        <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={selectedIds.has(model.id)} onChange={() => toggleSelect(model.id)} /></td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${model.provider === 'google' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}><Zap className="w-4 h-4"/></div>
                                                                <div>
                                                                    <span className="font-bold text-xs text-gray-900 dark:text-white block">{model.name}</span>
                                                                    <span className="text-[8px] font-mono text-gray-400 uppercase tracking-tighter">{model.id}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[10px] text-gray-500 font-bold">{model.contextWindow} Window</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <button onClick={() => toggleEnabled(model.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${model.enabled ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'}`}>
                                                                    {model.enabled ? <><Check className="w-3 h-3"/> For Test</> : "Not Ready"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => deleteModel(model.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash className="w-4 h-4"/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Key className="w-5 h-5 text-yellow-500"/> Connection Hub</h3>
                                <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <select value={newKeyForm.provider} onChange={e => setNewKeyForm({...newKeyForm, provider: e.target.value as any})} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-xs font-bold outline-none text-gray-900 dark:text-white">
                                            <option value="google">Google Cloud (Gemini)</option>
                                            <option value="openrouter">OpenRouter (GPT/Claude)</option>
                                        </select>
                                        <input type="text" value={newKeyForm.label} onChange={e => setNewKeyForm({...newKeyForm, label: e.target.value})} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-xs outline-none text-gray-900 dark:text-white" placeholder="Model Identity Label..." />
                                        <input type="password" value={newKeyForm.key} onChange={e => setNewKeyForm({...newKeyForm, key: e.target.value})} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-xs outline-none text-gray-900 dark:text-white" placeholder="Private Credential Key..." />
                                        <button onClick={handleAddAppKey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase shadow-md transition-all active:scale-95">Link Credential</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                        {appApiKeys.map(key => (
                                            <div key={key.id} className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${key.provider === 'google' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}><Key className="w-4 h-4"/></div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 dark:text-white text-xs">{key.label}</h5>
                                                        <p className="text-[9px] text-gray-400 font-mono tracking-tighter">••••{key.key.slice(-8)}</p>
                                                    </div>
                                                </div>
                                                <button onClick={async () => { await db.delete('api_keys', key.id); setAppApiKeys(appApiKeys.filter(k => k.id !== key.id)); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                    
                    {activeTab === 'scraper' && <ToolsIntegration />}

                    {activeTab === 'general' && (
                        <div className="animate-fade-in space-y-10">
                            <section className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500"/> Global Config</h3>
                                    <button onClick={saveGeneralSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                                        <Save className="w-4 h-4"/> Save All
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* App Branding */}
                                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-5">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Identity & Logo</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Application Name</label>
                                                <input type="text" value={branding.appName} onChange={e => setBranding({...branding, appName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Logo Image URL</label>
                                                <input type="text" value={branding.appLogo} onChange={e => setBranding({...branding, appLogo: e.target.value})} placeholder="https://..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* UI Styling Controls */}
                                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-5">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Sliders className="w-3 h-3"/> Styling & Adjustments</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Primary Color</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} className="w-12 h-10 border-0 p-0 bg-transparent cursor-pointer rounded-lg" />
                                                    <input type="text" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono uppercase" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Base Font Size (px)</label>
                                                <input type="number" value={branding.fontSize} onChange={e => setBranding({...branding, fontSize: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Logo Icon Size (px)</label>
                                                <input type="number" value={branding.logoSize} onChange={e => setBranding({...branding, logoSize: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Links & Contact */}
                                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-5">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Phone className="w-3 h-3"/> Support & Admin</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Support WhatsApp</label>
                                                <div className="relative">
                                                    <WhatsApp className="absolute left-4 top-3.5 w-4 h-4 text-green-500"/>
                                                    <input type="text" value={branding.supportPhone} onChange={e => setBranding({...branding, supportPhone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-green-500 text-sm font-bold" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 flex items-center gap-2"><Youtube className="w-3.5 h-3.5 text-red-500"/> Tutorial Video ID</label>
                                                <input type="text" value={branding.tutorialVideoId} onChange={e => setBranding({...branding, tutorialVideoId: e.target.value})} placeholder="e.g. zg8zxaarC3A" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-red-500 text-sm font-bold text-red-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Facebook Admin Details */}
                                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-5">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Facebook className="w-3 h-3"/> FB Page Admin Access</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Admin Profile Name</label>
                                                <input type="text" value={branding.fbAdminName} onChange={e => setBranding({...branding, fbAdminName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Admin Link</label>
                                                    <input type="text" value={branding.fbAdminLink} onChange={e => setBranding({...branding, fbAdminLink: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-xs font-mono" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Avatar URL</label>
                                                    <input type="text" value={branding.fbAdminImage} onChange={e => setBranding({...branding, fbAdminImage: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-xs font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exchange Rates */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20 space-y-5 col-span-1 md:col-span-2">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><CreditCard className="w-3 h-3"/> Exchange Rates (1 USD)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Bangladesh Rate (৳)</label>
                                                <input type="number" value={exchangeRates.bd || ''} onChange={e => setExchangeRates({...exchangeRates, bd: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">International Rate (৳)</label>
                                                <input type="number" value={exchangeRates.other || ''} onChange={e => setExchangeRates({...exchangeRates, other: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
