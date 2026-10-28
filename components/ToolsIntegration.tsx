
import React, { useState, useEffect, useRef } from 'react';
import { DynamicTool, ScraperAssignment, AppSetting } from '../types';
import { parseRapidApiSnippet, executeDynamicTool } from '../services/toolService';
import { db } from '../services/db';
import { Terminal, Key, Zap, Play, Save, Trash, Search, Code, CheckCircle, AlertCircle, X, RefreshCw, Sliders, ChevronRight, Facebook, Info } from './Icons';

export const ToolsIntegration: React.FC = () => {
    const [rapidApiKeys, setRapidApiKeys] = useState<string[]>([]);
    const [newRapidKey, setNewRapidKey] = useState('');
    const [dynamicTools, setDynamicTools] = useState<DynamicTool[]>([]);
    const [toolForm, setToolForm] = useState({ name: '', description: '', snippet: '' });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Assignments State
    const [assignments, setAssignments] = useState<ScraperAssignment[]>([
        { task: 'PAGE_DETAILS', toolId: '' },
        { task: 'PAGE_POSTS', toolId: '' }
    ]);

    const [testToolId, setTestToolId] = useState('');
    const [testParams, setTestParams] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const testEngineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            const savedKeys = localStorage.getItem('RAPID_API_KEYS');
            if (savedKeys) setRapidApiKeys(JSON.parse(savedKeys));
            
            // Migrate dynamic tools to IndexedDB if they exist in localStorage or just load from DB
            const dbTools = await db.getAll<DynamicTool>('dynamic_tools' as any);
            if (dbTools.length > 0) {
                setDynamicTools(dbTools);
            } else {
                const savedTools = localStorage.getItem('DYNAMIC_TOOLS');
                if (savedTools) {
                    const parsed = JSON.parse(savedTools);
                    for (const t of parsed) await db.add('dynamic_tools' as any, t);
                    setDynamicTools(parsed);
                    localStorage.removeItem('DYNAMIC_TOOLS');
                }
            }

            const mappingSetting = await db.get<AppSetting>('settings', 'fb_scraper_assignments');
            if (mappingSetting) setAssignments(mappingSetting.value);
        };
        loadData();
    }, []);

    const saveKeys = (keys: string[]) => {
        setRapidApiKeys(keys);
        localStorage.setItem('RAPID_API_KEYS', JSON.stringify(keys));
    };

    const saveTools = async (tools: DynamicTool[]) => {
        setDynamicTools(tools);
        // We handle add/delete individually in the UI usually, but this is a state update
    };

    const addKey = () => {
        if (!newRapidKey.trim()) return;
        if (rapidApiKeys.includes(newRapidKey.trim())) {
            alert("এই Key টি আগে থেকেই আছে।");
            return;
        }
        const updated = [newRapidKey.trim(), ...rapidApiKeys];
        saveKeys(updated);
        setNewRapidKey('');
    };

    const handleAddTool = async () => {
        try {
            if (!toolForm.name || !toolForm.snippet) {
                alert("নাম এবং স্নিপেট অবশ্যই দিতে হবে।");
                return;
            }
            const { tool, extractedKey } = parseRapidApiSnippet(toolForm.name, toolForm.description, toolForm.snippet);
            
            if (extractedKey && !rapidApiKeys.includes(extractedKey)) {
                const updatedKeys = [extractedKey, ...rapidApiKeys];
                saveKeys(updatedKeys);
            }

            await db.add('dynamic_tools' as any, tool);
            setDynamicTools([tool, ...dynamicTools]);
            setToolForm({ name: '', description: '', snippet: '' });
            alert("টুল সফলভাবে যুক্ত হয়েছে!");
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteTool = async (id: string) => {
        if (!confirm("আপনি কি নিশ্চিতভাবে এই টুলটি মুছে ফেলতে চান?")) return;
        await db.delete('dynamic_tools' as any, id);
        setDynamicTools(dynamicTools.filter(t => t.id !== id));
        
        // Remove from assignments if used
        const updatedAssignments = assignments.map(a => a.toolId === id ? { ...a, toolId: '' } : a);
        setAssignments(updatedAssignments);
        await db.put('settings', { id: 'fb_scraper_assignments', value: updatedAssignments });
    };

    const handleAssignTool = async (task: 'PAGE_DETAILS' | 'PAGE_POSTS', toolId: string) => {
        const updated = assignments.map(a => a.task === task ? { ...a, toolId } : a);
        setAssignments(updated);
        await db.put('settings', { id: 'fb_scraper_assignments', value: updated });
    };

    const handleLiveTest = async () => {
        const tool = dynamicTools.find(t => t.id === testToolId);
        if (!tool) return;

        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await executeDynamicTool(tool, testParams);
            setTestResult(result);
            setTestStatus('success');
            const updatedTool = { ...tool, lastStatus: 'success' as const };
            await db.put('dynamic_tools' as any, updatedTool);
            setDynamicTools(dynamicTools.map(t => t.id === tool.id ? updatedTool : t));
        } catch (e: any) {
            setTestResult(e.message);
            setTestStatus('error');
            const updatedTool = { ...tool, lastStatus: 'error' as const };
            await db.put('dynamic_tools' as any, updatedTool);
            setDynamicTools(dynamicTools.map(t => t.id === tool.id ? updatedTool : t));
        } finally {
            setIsTesting(false);
        }
    };

    const renderStatusBadge = (status?: string) => {
        if (rapidApiKeys.length === 0) return <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase">No Key</span>;
        if (status === 'success') return <span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 font-bold uppercase">Active</span>;
        if (status === 'error') return <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 font-bold uppercase">Failure</span>;
        return <span className="text-[9px] bg-gray-500/10 text-gray-500 px-2 py-0.5 rounded-full border border-gray-500/20 font-bold uppercase">Idle</span>;
    };

    const renderResult = () => {
        if (!testResult) return null;
        if (typeof testResult === 'string' && (testResult.startsWith('blob:') || testResult.startsWith('http'))) {
            return (
                <div className="flex flex-col items-center gap-4">
                    <img src={testResult} className="max-w-full rounded-xl border border-gray-200 dark:border-white/10 shadow-lg" alt="Result"/>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Result Detected</p>
                </div>
            );
        }
        return (
            <pre className="p-4 bg-black/90 text-green-400 rounded-xl text-xs font-mono overflow-auto max-h-[400px] custom-scrollbar">
                {JSON.stringify(testResult, null, 2)}
            </pre>
        );
    };

    const filteredTools = dynamicTools.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            
            {/* 1. Assignments Section */}
            <section className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Facebook className="w-6 h-6"/>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-widest italic">Facebook Scraper Logic</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-3">Page Details Scraper</p>
                            <select 
                                value={assignments.find(a => a.task === 'PAGE_DETAILS')?.toolId || ''}
                                onChange={e => handleAssignTool('PAGE_DETAILS', e.target.value)}
                                className="w-full bg-white text-indigo-900 px-4 py-3 rounded-xl font-bold outline-none border-none shadow-lg cursor-pointer"
                            >
                                <option value="">No Tool Selected (Manual Fallback)</option>
                                {dynamicTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <p className="text-[10px] text-indigo-100/60 mt-3 flex items-start gap-1.5">
                                <Info className="w-3 h-3 shrink-0"/> 
                                ব্যবহারকারীর ফেসবুক পেজের নাম, আইডি এবং ক্যাটাগরি কালেক্ট করতে এই টুলটি ব্যবহৃত হবে।
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-3">Page Posts/URLs Scraper</p>
                            <select 
                                value={assignments.find(a => a.task === 'PAGE_POSTS')?.toolId || ''}
                                onChange={e => handleAssignTool('PAGE_POSTS', e.target.value)}
                                className="w-full bg-white text-indigo-900 px-4 py-3 rounded-xl font-bold outline-none border-none shadow-lg cursor-pointer"
                            >
                                <option value="">No Tool Selected (Simulated Fallback)</option>
                                {dynamicTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <p className="text-[10px] text-indigo-100/60 mt-3 flex items-start gap-1.5">
                                <Info className="w-3 h-3 shrink-0"/> 
                                ক্যাম্পেইন তৈরির সময় পেজের লেটেস্ট পোস্টগুলো লোড করতে এই টুলটি ব্যবহৃত হবে।
                            </p>
                        </div>
                    </div>
                    
                    {!assignments.some(a => a.toolId) && (
                         <div className="mt-6 p-4 bg-yellow-400/20 border border-yellow-400/30 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-300 shrink-0"/>
                            <p className="text-xs font-medium text-yellow-100">কোনো টুল সেট করা নেই। ফেসবুক পেজ রিকোয়েস্টগুলো অ্যাডমিনকে ম্যানুয়ালি ভেরিফাই করতে হবে।</p>
                         </div>
                    )}
                </div>
            </section>

            {/* 2. Key Storage Section */}
            <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
                <h4 className="text-xs font-black uppercase text-orange-500 tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Key className="w-4 h-4"/> RapidAPI Authorization
                </h4>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        placeholder="নতুন RapidAPI Key যোগ করুন..." 
                        value={newRapidKey}
                        onChange={e => setNewRapidKey(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                    />
                    <button onClick={addKey} className="px-6 bg-gray-900 dark:bg-white dark:text-black text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95">Add</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {rapidApiKeys.map((key, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-mono text-gray-500">••••{key.slice(-12)}</span>
                            <button onClick={() => saveKeys(rapidApiKeys.filter(k => k !== key))} className="text-gray-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Integration Hub */}
            <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
                <h4 className="text-xs font-black uppercase text-orange-500 tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Code className="w-4 h-4"/> Scraper Tool Builder
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        type="text" 
                        placeholder="টুলের নাম (উদাঃ FB Page Scraper v3)" 
                        value={toolForm.name}
                        onChange={e => setToolForm({...toolForm, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                    />
                    <input 
                        type="text" 
                        placeholder="সংক্ষিপ্ত বর্ণনা..." 
                        value={toolForm.description}
                        onChange={e => setToolForm({...toolForm, description: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                    />
                </div>
                <textarea 
                    placeholder="RapidAPI (Request -> Javascript -> XHR) কোডটি এখানে পেস্ট করুন..." 
                    value={toolForm.snippet}
                    onChange={e => setToolForm({...toolForm, snippet: e.target.value})}
                    className="w-full h-32 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white resize-none"
                />
                <button onClick={handleAddTool} className="w-full mt-4 py-4 bg-orange-500 text-white font-bold rounded-xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all">Connect Tool</button>
            </section>

            {/* 4. Test Engine */}
            <section ref={testEngineRef} className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-inner">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <h4 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isTesting ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                            Live Integration Test
                        </h4>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select 
                            value={testToolId}
                            onChange={e => { setTestToolId(e.target.value); setTestParams({}); setTestResult(null); }}
                            className="flex-1 md:w-64 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                        >
                            <option value="">Select a tool to test...</option>
                            {dynamicTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button 
                            disabled={!testToolId || isTesting}
                            onClick={handleLiveTest}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                        >
                            {isTesting ? 'Running...' : 'Run Test'}
                        </button>
                    </div>
                </div>

                {testToolId && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {dynamicTools.find(t => t.id === testToolId)?.queryParams.map(p => (
                                <div key={p}>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{p}</label>
                                    <input 
                                        type="text" 
                                        placeholder={`Enter ${p}...`} 
                                        value={testParams[p] || ''}
                                        onChange={e => setTestParams({...testParams, [p]: e.target.value})}
                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="min-h-[200px] bg-white dark:bg-black/30 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center p-6 overflow-hidden">
                            {!testResult && !isTesting ? (
                                <p className="text-xs text-gray-400 italic">Ready for execution. Click "Run Test" above.</p>
                            ) : isTesting ? (
                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin"/>
                            ) : renderResult()}
                        </div>
                    </div>
                )}
            </section>

            {/* 5. Library */}
            <section className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-base font-black uppercase text-gray-900 dark:text-white italic tracking-widest">Connected Tools</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="টুল খুঁজুন..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none shadow-sm"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTools.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-gray-50 dark:bg-white/5">লাইব্রেরি খালি আছে</div>
                    ) : (
                        filteredTools.map(tool => (
                            <div key={tool.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl text-gray-400 group-hover:text-indigo-500 transition-colors">
                                            <Zap className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-white">{tool.name}</h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400 font-mono">{tool.host}</span>
                                                {renderStatusBadge(tool.lastStatus)}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteTool(tool.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash className="w-4 h-4"/></button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-8">{tool.description || 'No description provided.'}</p>
                                <div className="flex flex-wrap gap-1.5 mb-4 h-6 overflow-hidden">
                                    {tool.queryParams.map(p => <span key={p} className="text-[9px] font-bold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-500 border border-gray-200 dark:border-white/10">{p}</span>)}
                                </div>
                                <button 
                                    onClick={() => { setTestToolId(tool.id); testEngineRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                                    className="w-full py-3 bg-gray-900 dark:bg-white dark:text-black text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                                >
                                    Test Live
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
