
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Paperclip, Maximize2, Minimize2, Key, Package, Megaphone, Facebook, Instagram, DollarSign, CheckCircle, Mic, Bot, Sparkles, Image as ImageIcon, Robot } from './Icons';
import { Product, User, Ad, ProductVariation, SocialPageRequest, ApiKeyConfig, AdStatus, SocialPlatform, Order, AIActionPayload, AppSetting, Transaction, AIAutoAction, AIAutoActionType, StoreCategory, GlobalVariation } from '../types';
import { db } from '../services/db';
import { generateChatResponse } from '../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    attachment?: string; 
    type?: 'text' | 'product' | 'audit' | 'campaign_success' | 'admin_action' | 'system';
    data?: any;
    timestamp: Date;
}

interface TrendifyAIChatProps {
    isGlobalOpen: boolean;
    onToggle: () => void;
    storeProducts?: Product[];
    onPurchase?: (product: Product, variation?: ProductVariation) => void;
    userData?: User;
    userAds?: Ad[];
    userSocials?: SocialPageRequest[];
    userTransactions?: Transaction[]; 
    userOrders?: Order[]; 
    onNavigate?: (tab: string, data?: any) => void; 
    onCreateAd?: (newAd: Ad, cost: number) => boolean;
    activeTab?: string; 
    allUsers?: User[];
    allAds?: Ad[];
    allOrders?: Order[];
    allProducts?: Product[];
    allTransactions?: Transaction[]; 
    allCategories?: StoreCategory[];
    allVariations?: GlobalVariation[];
    onAdminAction?: (action: AIActionPayload) => void;
    onOpenAddFunds?: () => void;
    onOpenConnectSocial?: () => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parseBold = (text: string) => {
        if (typeof text !== 'string') return String(text);
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (typeof content !== 'string') return <div>{JSON.stringify(content)}</div>;

    // Remove any accidental JSON remnants that might have leaked into display content
    const sanitizedContent = content.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*?\}/g, "").trim();
    if (!sanitizedContent && content.includes('{')) return null;

    return (
        <div className="space-y-3 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 font-normal">
            {sanitizedContent.split('\n').map((line, i) => {
                const cleanLine = line.trim();
                if (!cleanLine) return <div key={i} className="h-2"></div>;
                if (cleanLine.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{cleanLine.replace('### ', '')}</h3>;
                if (cleanLine.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-5 mb-2">{cleanLine.replace('## ', '')}</h2>;
                const numberedMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
                if (numberedMatch) return (
                    <div key={i} className="flex gap-3 ml-1">
                        <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[15px]">{numberedMatch[1]}.</span>
                        <span className="text-gray-800 dark:text-gray-200">{parseBold(numberedMatch[2])}</span>
                    </div>
                );
                if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) return (
                    <div key={i} className="flex gap-3 ml-2">
                        <span className="font-bold text-gray-400 mt-2 w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-400 block shrink-0"></span>
                        <span className="text-gray-800 dark:text-gray-200">{parseBold(cleanLine.substring(2))}</span>
                    </div>
                );
                return <p key={i} className="text-gray-800 dark:text-gray-200">{parseBold(line)}</p>;
            })}
        </div>
    );
};

const ChatProductCard: React.FC<{ data: any, onPurchase?: (product: Product, variation?: ProductVariation) => void }> = ({ data, onPurchase }) => {
    const vars = data.product?.variations || [];
    const [selectedVar, setSelectedVar] = useState<ProductVariation | undefined>(vars[0]);
    const currentPrice = selectedVar ? selectedVar.price : (data.product?.price || data.product?.basePrice || 0);
    return (
        <div className="bg-white dark:bg-[#1e1f20] rounded-2xl overflow-hidden max-w-sm w-full border border-gray-200 dark:border-700 mt-2 shadow-sm">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
                <img src={data.image} className="w-full h-full object-cover" alt="Product"/>
            </div>
            <div className="p-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{data.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">{data.description}</p>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">${(currentPrice || 0).toFixed(2)}</span>
                    <button onClick={() => onPurchase?.(data.product, selectedVar)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"><DollarSign className="w-4 h-4"/> Buy Now</button>
                </div>
            </div>
        </div>
    );
};

export const TrendifyAIChat: React.FC<TrendifyAIChatProps> = ({ 
    isGlobalOpen, onToggle, storeProducts = [], onPurchase, userData, userAds = [], userSocials = [], userTransactions = [], userOrders = [], onNavigate, onCreateAd, activeTab, allUsers = [], allAds = [], allOrders = [], allProducts = [], allTransactions = [], allCategories = [], allVariations = [], onAdminAction, onOpenAddFunds, onOpenConnectSocial, showToast
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [agentIdentity, setAgentIdentity] = useState("Trendify Expert");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 }); 
    const isDraggingRef = useRef(false);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const initialElementPosRef = useRef({ x: 0, y: 0 });
    const isAdmin = userData?.role === 'ADMIN';

    useEffect(() => {
        if (isGlobalOpen) { setIsOpen(true); setIsExpanded(true); }
    }, [isGlobalOpen]);

    useEffect(() => {
        if (isOpen && (messages || []).length === 0) {
            const greeting = isAdmin ? "Admin Copilot প্রস্তুত স্যার। কোনো সিস্টেম কমান্ড বা ডাটা রিকোয়েস্ট থাকলে বলুন।" : `হ্যালো ${userData?.name || 'বন্ধুবর'}! আমি ${agentIdentity}। আপনাকে কীভাবে সাহায্য করতে পারি?`;
            setMessages([{ id: 'init', role: 'ai', content: greeting, timestamp: new Date() }]);
        }
    }, [isOpen, isAdmin, userData, agentIdentity]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    const executeAutoAction = async (action: any) => {
        if (!action || !action.type) return;
        try {
            // Check if it's an admin action
            if (isAdmin && onAdminAction && (action.type?.startsWith('ADMIN_'))) {
                await onAdminAction({ type: action.type, data: action.data || action });
                setMessages(prev => [...prev, { id: `action-${Date.now()}`, role: 'ai', content: `সিস্টেম কমান্ড এক্সিকিউট করা হয়েছে: ${action.type}`, type: 'admin_action', timestamp: new Date() }]);
                return;
            }

            // Normal user actions
            switch (action.type) {
                case 'NAVIGATE': onNavigate?.(action.target || action.data, action.data); break;
                case 'OPEN_ADD_FUNDS': onOpenAddFunds?.(); break;
                case 'CONNECT_SOCIAL': onOpenConnectSocial?.(); break;
            }
        } catch (e) { console.error("Action Failed", e); }
    };

    const processSteps = async (steps: any[], actions?: any[]) => {
        if (!steps || steps.length === 0) {
            setIsTyping(false);
            if (actions && Array.isArray(actions)) {
                for (const action of actions) {
                    await executeAutoAction(action);
                }
            }
            return;
        }
        const [current, ...rest] = steps;
        setIsTyping(true);
        await new Promise(r => setTimeout(r, current.delay || 400));
        
        const stepText = current.text || current.message;
        const finalContent = typeof stepText === 'string' ? stepText : JSON.stringify(stepText);
        
        if (finalContent && finalContent.trim()) {
            setMessages(prev => [...(prev || []), { id: Math.random().toString(), role: 'ai', content: finalContent, timestamp: new Date(), type: current.action === 'offer' ? 'product' : 'text', data: current.data }]);
        }
        
        processSteps(rest, actions);
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;
        const safeText = text.trim();
        setMessages(prev => [...(prev || []), { id: Date.now().toString(), role: 'user', content: safeText, timestamp: new Date() }]);
        setInput(''); 
        setIsTyping(true);
        
        const context = { 
            user: userData, 
            history: (messages || []).slice(-10).map(m => ({ role: m.role, content: m.content })), 
            allUsers: allUsers || [], 
            allAds: allAds || [], 
            allOrders: allOrders || [], 
            allProducts: allProducts || [], 
            allTransactions: allTransactions || [], 
            allCategories: allCategories || [], 
            allVariations: allVariations || [] 
        };
        
        try {
            const result = await generateChatResponse(safeText, context);
            if (!result || !result.trim()) {
                throw new Error("এআই কোনো উত্তর দিতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।");
            }

            let parsed: any = null;
            let textOutput = "";
            
            try {
                // Stronger JSON extraction to prevent JSON blocks from showing in UI
                const jsonBlockMatch = result.match(/```json([\s\S]*?)```/);
                const rawJsonMatch = result.match(/\{[\s\S]*\}/);
                
                let jsonStr = "";
                if (jsonBlockMatch) {
                    jsonStr = jsonBlockMatch[1].trim();
                    textOutput = result.replace(jsonBlockMatch[0], "").trim();
                } else if (rawJsonMatch) {
                    jsonStr = rawJsonMatch[0].trim();
                    textOutput = result.replace(rawJsonMatch[0], "").trim();
                } else {
                    textOutput = result;
                }

                if (jsonStr) {
                    parsed = JSON.parse(jsonStr);
                    
                    // Normalize "action/parameters" structure used by some models
                    if (parsed.action && !parsed.actions) {
                        const type = String(parsed.action).toUpperCase().includes('ADMIN_') ? parsed.action : `ADMIN_${String(parsed.action).toUpperCase()}`;
                        parsed.actions = [{ type, data: parsed.parameters || parsed.data || {} }];
                    }
                    
                    // Prioritize specific steps array if present
                    if (!parsed.steps && (parsed.message || parsed.text || textOutput)) {
                        parsed.steps = [{ text: parsed.message || parsed.text || textOutput }];
                    }
                }
            } catch (e) {
                console.warn("AI Response JSON parse failed, treating as plain text", e);
                parsed = { steps: [{ text: result }], actions: [] };
            }

            if (!parsed) parsed = { steps: [{ text: result }], actions: [] };

            const finalActions = (parsed.actions || (parsed.adminAction ? [parsed.adminAction] : (parsed.autoAction ? [parsed.autoAction] : []))) || [];
            const finalSteps = (parsed.steps || (parsed.text ? [{text: parsed.text}] : [{text: result}]));

            await processSteps(finalSteps, finalActions);
        } catch (e: any) {
            setMessages(prev => [...(prev || []), { id: Date.now().toString(), role: 'ai', content: "ত্রুটি: " + String(e.message), timestamp: new Date() }]);
            setIsTyping(false);
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!buttonRef.current || !wrapperRef.current) return;
        isDraggingRef.current = false;
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        initialElementPosRef.current = { ...position };
        buttonRef.current.setPointerCapture(e.pointerId);
        const handleMove = (ev: PointerEvent) => {
            const dx = ev.clientX - dragStartPosRef.current.x;
            const dy = ev.clientY - dragStartPosRef.current.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDraggingRef.current = true;
            if (isDraggingRef.current) {
                const rawX = initialElementPosRef.current.x + dx;
                const rawY = initialElementPosRef.current.y + dy;
                wrapperRef.current!.style.transform = `translate(${rawX}px, ${rawY}px)`;
            }
        };
        const handleUp = (ev: PointerEvent) => {
            if (isDraggingRef.current) {
                setPosition({ x: initialElementPosRef.current.x + (ev.clientX - dragStartPosRef.current.x), y: initialElementPosRef.current.y + (ev.clientY - dragStartPosRef.current.y) });
            }
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    return createPortal(
        <div className="trendify-ai-portal-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            <div ref={wrapperRef} style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: 'none', position: 'absolute', bottom: '96px', right: '24px', pointerEvents: 'auto' }} className={`flex items-end justify-end flex-col gap-2 transition-all duration-300 ${isOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <button ref={buttonRef} onPointerDown={handlePointerDown} onClick={() => !isDraggingRef.current && setIsOpen(true)} className="group relative cursor-move hover:scale-110 transition-transform">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-900 overflow-hidden relative ${isAdmin ? 'bg-gradient-to-tr from-red-600 to-orange-600' : 'bg-gradient-to-tr from-blue-600 to-purple-600'}`}>
                        <Robot className="w-10 h-10 text-white" />
                        <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full border-2 border-indigo-600 animate-pulse"></div>
                    </div>
                </button>
            </div>

            <div style={{ pointerEvents: isOpen ? 'auto' : 'none' }} className={`fixed transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col bg-white dark:bg-[#131314] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 inset-0 ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10'} ${isExpanded ? 'md:inset-[30px] md:rounded-3xl' : 'md:top-auto md:left-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[650px] md:rounded-3xl'}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 backdrop-blur-md sticky top-0 z-10 ${isAdmin ? 'bg-red-50/90 dark:bg-red-900/20' : 'bg-white/80 dark:bg-[#131314]/80'}`}>
                    <span className={`text-xl font-bold bg-clip-text text-transparent ${isAdmin ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-pink-600'}`}>
                        {isAdmin ? 'Admin Copilot' : agentIdentity} {isAdmin && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded ml-2 uppercase font-black tracking-tighter">System Manager</span>}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="hidden md:flex p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">{isExpanded ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}</button>
                        <button onClick={() => {setIsOpen(false); onToggle();}} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-white dark:bg-[#131314]">
                    {(messages || []).map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="flex gap-4 max-w-[85%]">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isAdmin ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}><Sparkles className="w-5 h-5 text-white"/></div>
                                    <div className="flex flex-col gap-2">
                                        <MarkdownRenderer content={msg.content} />
                                        {msg.type === 'product' && msg.data && <ChatProductCard data={msg.data} onPurchase={onPurchase}/>}
                                        {msg.type === 'admin_action' && <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-600"/> <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300">System Command Executed</span></div>}
                                    </div>
                                </div>
                            )}
                            {msg.role === 'user' && (
                                <div className={`max-w-[80%] px-5 py-3 rounded-[20px] rounded-tr-sm text-[15px] shadow-sm break-words ${isAdmin ? 'bg-red-600 text-white font-bold' : 'bg-[#f0f4f9] dark:bg-[#1e1f20] text-gray-900 dark:text-gray-100'}`}>
                                    {msg.content}
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && <div className="flex gap-4 p-2"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div></div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-[#131314]">
                    <div className={`flex items-end gap-2 rounded-[28px] px-2 py-2 border transition-all ${isAdmin ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30' : 'bg-[#f0f4f9] dark:bg-[#1e1f20] border-transparent focus-within:bg-white focus-within:shadow-md'}`}>
                        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 py-3 max-h-32 min-h-[44px] resize-none text-[15px] px-4" placeholder={isAdmin ? "System Command or Data Request..." : "Ask Trendify AI..."} rows={1}/>
                        <button onClick={() => handleSend()} className={`p-3 text-white rounded-full transition-all shadow-sm ${isAdmin ? 'bg-red-600' : 'bg-blue-600'} hover:scale-105 active:scale-95`}>
                            <Send className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
