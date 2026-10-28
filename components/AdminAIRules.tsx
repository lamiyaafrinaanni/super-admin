
import React, { useState, useEffect } from 'react';
import { Brain, Bot, Sparkles, Database, Terminal, ShieldCheck, Megaphone, Package, Edit, Save, X, Plus } from './Icons';
import { db } from '../services/db';
import { AppSetting } from '../types';

interface AIExpertConfig {
    adminTitle: string;
    adminMode: string;
    adminSystemPrompt: string;
    adminCommands: string[];
    userTitle: string;
    userMode: string;
    userSystemPrompt: string;
    capabilities: string[];
}

export const AdminAIRules: React.FC = () => {
    const [isEditing, setIsEditing] = useState<'admin' | 'user' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [config, setConfig] = useState<AIExpertConfig>({
        adminTitle: "Admin AI (Copilot) Rules",
        adminMode: "System Management Mode",
        // Fix: Escaped triple backticks to prevent the template literal from closing early and causing syntax errors.
        adminSystemPrompt: `You are 'Admin Copilot' (System Manager). You control the AdWallet Pro database via specific commands.

CRITICAL INSTRUCTIONS:
1. ALWAYS respond in valid JSON format wrapped in a single \`\`\`json code block.
2. DO NOT include any JSON data outside of the code block.
3. Your text message (in Bengali) must be placed INSIDE the "steps" array.
4. When performing an action, you MUST use the "actions" array.
5. Use EXACT command names.

STRICT RESPONSE STRUCTURE:
{
  "steps": [
    { "text": "আপনার কাজের বর্ণনা বাংলায় এখানে লিখুন", "delay": 500 }
  ],
  "actions": [
    { "type": "COMMAND_NAME", "data": { ...params } }
  ]
}

COMMAND REFERENCE:
- ADMIN_CREATE_USER: data: { "name": "string", "username": "string", "balance": number }
- ADMIN_BATCH_CREATE_USERS: data: { "user_count": number, "initial_balance": number }
- ADMIN_ADD_FUNDS: data: { "userId": "string", "amount": number }
- ADMIN_CREATE_PRODUCT: data: { "name": "string", "basePrice": number, "categoryName": "string" }
- ADMIN_NAVIGATE: data: "dashboard" | "clients" | "store_products" | "all_ads"

EXAMPLE:
User: "Create 5 demo users with $200 each"
Response:
{
  "steps": [{ "text": "জি স্যার, ৫ জন ডেমো ইউজার তৈরি করা হচ্ছে এবং প্রত্যেকের ব্যালেন্সে ২০০ ডলার করে যোগ করা হচ্ছে।" }],
  "actions": [{ "type": "ADMIN_BATCH_CREATE_USERS", "data": { "user_count": 5, "initial_balance": 200 } }]
}`,
        adminCommands: ["ADMIN_NAVIGATE", "ADMIN_ADD_FUNDS", "ADMIN_CREATE_USER", "ADMIN_BATCH_CREATE_USERS", "ADMIN_CREATE_VARIATION", "ADMIN_CREATE_PRODUCT"],
        userTitle: "User AI (Expert) Rules",
        userMode: "Client Assistance Mode",
        userSystemPrompt: "You are Trendify AI Expert. Respond in Bengali. Help users with marketing strategies, ad copies, and account management. Use the provided context to offer personalized advice.",
        capabilities: ["Ad Strategies", "Copywriting", "Product Offers", "Contextual Help"]
    });

    useEffect(() => {
        const loadConfig = async () => {
            const saved = await db.get<AppSetting>('settings', 'ai_expert_config');
            if (saved) {
                setConfig(saved.value);
            } else {
                await db.put('settings', { id: 'ai_expert_config', value: config });
            }
            setIsLoading(false);
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        await db.put('settings', { id: 'ai_expert_config', value: config });
        setIsEditing(null);
        alert("AI Rules Updated Successfully!");
    };

    const addCapability = () => {
        setConfig({ ...config, capabilities: [...config.capabilities, "New Capability"] });
    };

    const removeCapability = (index: number) => {
        const updated = config.capabilities.filter((_, i) => i !== index);
        setConfig({ ...config, capabilities: updated });
    };

    const addCommand = () => {
        setConfig({ ...config, adminCommands: [...config.adminCommands, "NEW_COMMAND"] });
    };

    const removeCommand = (index: number) => {
        const updated = config.adminCommands.filter((_, i) => i !== index);
        setConfig({ ...config, adminCommands: updated });
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-500">Loading AI Configuration...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Brain className="w-7 h-7 text-indigo-500"/>
                        AI Intelligence Center
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and audit all AI logic, system instructions, and training data.</p>
                </div>
                {isEditing && (
                    <button 
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Save className="w-5 h-5"/> Save All Changes
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Admin AI Section */}
                <div className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-all ${isEditing === 'admin' ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                    <div className="p-6 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-600/20">
                                <ShieldCheck className="w-5 h-5"/>
                            </div>
                            <div className="flex-1">
                                {isEditing === 'admin' ? (
                                    <input 
                                        value={config.adminTitle}
                                        onChange={e => setConfig({...config, adminTitle: e.target.value})}
                                        className="w-full bg-white dark:bg-black/40 border border-red-200 dark:border-red-800 rounded px-2 py-0.5 font-bold text-gray-900 dark:text-white outline-none"
                                    />
                                ) : (
                                    <h3 className="font-bold text-gray-900 dark:text-white">{config.adminTitle}</h3>
                                )}
                                {isEditing === 'admin' ? (
                                    <input 
                                        value={config.adminMode}
                                        onChange={e => setConfig({...config, adminMode: e.target.value})}
                                        className="w-full mt-1 bg-white dark:bg-black/40 border border-red-200 dark:border-red-800 rounded px-2 py-0.5 text-[10px] text-red-600 dark:text-red-400 font-black uppercase outline-none"
                                    />
                                ) : (
                                    <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest">{config.adminMode}</p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditing(isEditing === 'admin' ? null : 'admin')}
                            className={`p-2 rounded-lg transition-colors ml-4 ${isEditing === 'admin' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                        >
                            {isEditing === 'admin' ? <X className="w-4 h-4"/> : <Edit className="w-4 h-4"/>}
                        </button>
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">System Instruction (Actions Interface)</label>
                            {isEditing === 'admin' ? (
                                <textarea 
                                    rows={12}
                                    value={config.adminSystemPrompt}
                                    onChange={e => setConfig({...config, adminSystemPrompt: e.target.value})}
                                    className="w-full bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono border border-gray-800 leading-relaxed outline-none focus:ring-2 focus:ring-red-500/30"
                                />
                            ) : (
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {config.adminSystemPrompt}
                                </pre>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Actions</h4>
                                {isEditing === 'admin' && (
                                    <button onClick={addCommand} className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase flex items-center gap-1">
                                        <Plus className="w-3 h-3"/> Add Action
                                    </button>
                                )}
                            </div>
                            {config.adminCommands.map((cmd, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 group">
                                    {isEditing === 'admin' ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input 
                                                value={cmd}
                                                onChange={e => {
                                                    const updated = [...config.adminCommands];
                                                    updated[idx] = e.target.value;
                                                    setConfig({...config, adminCommands: updated});
                                                }}
                                                className="bg-transparent border-none font-mono text-xs font-bold text-gray-700 dark:text-gray-200 outline-none w-full"
                                            />
                                            <button onClick={() => removeCommand(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-200">{cmd}</span>
                                            <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-bold uppercase">Ready</span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User AI Section */}
                <div className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-all ${isEditing === 'user' ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                                <Bot className="w-5 h-5"/>
                            </div>
                            <div className="flex-1">
                                {isEditing === 'user' ? (
                                    <input 
                                        value={config.userTitle}
                                        onChange={e => setConfig({...config, userTitle: e.target.value})}
                                        className="w-full bg-white dark:bg-black/40 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-0.5 font-bold text-gray-900 dark:text-white outline-none"
                                    />
                                ) : (
                                    <h3 className="font-bold text-gray-900 dark:text-white">{config.userTitle}</h3>
                                )}
                                {isEditing === 'user' ? (
                                    <input 
                                        value={config.userMode}
                                        onChange={e => setConfig({...config, userMode: e.target.value})}
                                        className="w-full mt-1 bg-white dark:bg-black/40 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase outline-none"
                                    />
                                ) : (
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{config.userMode}</p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditing(isEditing === 'user' ? null : 'user')}
                            className={`p-2 rounded-lg transition-colors ml-4 ${isEditing === 'user' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                        >
                            {isEditing === 'user' ? <X className="w-4 h-4"/> : <Edit className="w-4 h-4"/>}
                        </button>
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">System Instruction (Expert Advisor)</label>
                            {isEditing === 'user' ? (
                                <textarea 
                                    rows={10}
                                    value={config.userSystemPrompt}
                                    onChange={e => setConfig({...config, userSystemPrompt: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-200 dark:border-white/5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic outline-none focus:ring-2 focus:ring-indigo-500/30"
                                />
                            ) : (
                                <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-200 dark:border-white/5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                    "{config.userSystemPrompt}"
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Features & Capabilities</h4>
                                {isEditing === 'user' && (
                                    <button onClick={addCapability} className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase flex items-center gap-1">
                                        <Plus className="w-3 h-3"/> Add Item
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {config.capabilities.map((cap, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-black/20 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5 group">
                                        <div className="flex items-center gap-2 flex-1">
                                            {idx === 0 ? <Megaphone className="w-3 h-3 text-indigo-500"/> : 
                                             idx === 1 ? <Terminal className="w-3 h-3 text-blue-500"/> : 
                                             idx === 2 ? <Package className="w-3 h-3 text-purple-500"/> : <Database className="w-3 h-3 text-orange-500"/>}
                                            {isEditing === 'user' ? (
                                                <input 
                                                    value={cap}
                                                    onChange={e => {
                                                        const updated = [...config.capabilities];
                                                        updated[idx] = e.target.value;
                                                        setConfig({...config, capabilities: updated});
                                                    }}
                                                    className="bg-transparent border-none font-bold outline-none w-full"
                                                />
                                            ) : cap}
                                        </div>
                                        {isEditing === 'user' && (
                                            <button onClick={() => removeCapability(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3"/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-3xl flex gap-4">
                <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl text-amber-600 shrink-0 h-fit">
                    <Sparkles className="w-6 h-6"/>
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">এআই ইন্টেলিজেন্স অডিট নোট</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-300/80 leading-relaxed">
                        উপরের রুলসগুলো এআই-কে নির্দেশ দেয় কিভাবে সে ইউজারের সাথে কথা বলবে এবং কমান্ডগুলো প্রসেস করবে। আপনি যেকোনো টেক্সট বক্সে ক্লিক করে সরাসরি এডিট করতে পারেন। সেভ করতে ভুলবেন না।
                    </p>
                </div>
            </div>
        </div>
    );
};
