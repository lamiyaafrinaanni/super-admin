
import React, { useState } from 'react';
import { User, Ad, AdStatus, UserRole, SocialPageRequest, SocialRequestStatus, AIKnowledge } from '../types';
import { Search, Users, Wallet, Plus, CreditCard, ExternalLink, X, Settings, Phone, UserPlus, Cpu, Brain, Save } from './Icons';
import { db } from '../services/db';

interface AdminClientListProps {
    clients: User[];
    ads: Ad[];
    socialRequests: SocialPageRequest[];
    onAccess: (client: User) => void;
    onUpdateBalance: (userId: string, amount: number, type: 'DEPOSIT' | 'SPEND', note: string) => void;
    onUpdateClient: (updatedClient: User) => void;
    onAddClient: () => void;
}

export const AdminClientList: React.FC<AdminClientListProps> = ({ 
    clients, ads, socialRequests, onAccess, onUpdateBalance, onUpdateClient, onAddClient
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [modalType, setModalType] = useState<'ADD' | 'DEDUCT' | 'RATE' | 'FORCE_MODEL' | 'KNOWLEDGE' | null>(null);
    const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
    
    // States
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [customRate, setCustomRate] = useState('');
    const [forcedModel, setForcedModel] = useState('');
    const [knowledgeText, setKnowledgeText] = useState('');

    const filteredClients = clients.filter(c => {
        if (c.role !== UserRole.USER) return false;
        const query = (searchQuery || '').toLowerCase();
        return (c.name || '').toLowerCase().includes(query) || (c.username || '').includes(query);
    });

    const openActionModal = async (user: User, type: 'ADD' | 'DEDUCT' | 'RATE' | 'FORCE_MODEL' | 'KNOWLEDGE') => {
        setSelectedUserForAction(user);
        setModalType(type);
        setAmount(''); setNote('');
        setCustomRate(user.customExchangeRate ? user.customExchangeRate.toString() : '');
        setForcedModel(user.forcedModel || '');

        if (type === 'KNOWLEDGE') {
            const kb = await db.get<AIKnowledge>('ai_knowledge', user.id);
            setKnowledgeText(kb?.businessProfile || '');
        }
    };

    const handleConfirmAction = async () => {
        if (!selectedUserForAction) return;

        if (modalType === 'KNOWLEDGE') {
            const kb = await db.get<AIKnowledge>('ai_knowledge', selectedUserForAction.id);
            const updatedKb: AIKnowledge = {
                userId: selectedUserForAction.id,
                identitySummary: kb?.identitySummary || `User: ${selectedUserForAction.name}`,
                businessProfile: knowledgeText,
                marketingStrategy: kb?.marketingStrategy || "Custom",
                lastUpdated: new Date().toISOString(),
                insights: kb?.insights || []
            };
            await db.put('ai_knowledge', updatedKb);
            alert("Business Intelligence Updated!");
        } else if (modalType === 'RATE') {
            const rate = parseFloat(customRate);
            onUpdateClient({ ...selectedUserForAction, customExchangeRate: rate > 0 ? rate : undefined });
            alert('Exchange rate updated!');
        } else if (modalType === 'FORCE_MODEL') {
            onUpdateClient({ ...selectedUserForAction, forcedModel: forcedModel || undefined });
            alert('AI Model preference updated!');
        } else {
            const val = parseFloat(amount);
            if (val <= 0) return;
            onUpdateBalance(selectedUserForAction.id, val, modalType === 'ADD' ? 'DEPOSIT' : 'SPEND', note || `Admin adjusted funds`);
            alert('Balance updated!');
        }

        setModalType(null);
        setSelectedUserForAction(null);
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {modalType && selectedUserForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className={`px-6 py-4 flex justify-between items-center border-b ${
                            modalType === 'KNOWLEDGE' ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
                        }`}>
                            <h3 className="font-bold flex items-center gap-2">
                                {modalType === 'KNOWLEDGE' ? <Brain className="w-5 h-5"/> : <Settings className="w-5 h-5"/>}
                                {modalType === 'KNOWLEDGE' ? 'Business Intelligence' : 'User Settings'}
                            </h3>
                            <button onClick={() => setModalType(null)} className="hover:bg-black/10 dark:hover:bg-white/10 p-1 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Target: <span className="font-bold text-gray-900 dark:text-white">{selectedUserForAction.name}</span></p>
                            
                            {modalType === 'KNOWLEDGE' ? (
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Business/User Info for AI</label>
                                    <textarea 
                                        rows={8}
                                        value={knowledgeText}
                                        onChange={e => setKnowledgeText(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                                        placeholder="ইউজার বা তার বিজনেস সম্পর্কে নোট লিখুন। এআই চ্যাট বা এড ক্রিয়েট করার সময় এই তথ্যগুলোকে সর্বচ্চ গুরুত্ব দিবে..."
                                    />
                                    <p className="text-[10px] text-gray-400 italic">Example: "ইউজার একজন ক্লদিং বিজনেস মালিক, তার টার্গেট অডিয়েন্স ফিমেল ১৮-৩৫, সে ক্যাশ অন ডেলিভারি সার্ভিস দেয়।"</p>
                                </div>
                            ) : modalType === 'FORCE_MODEL' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Select Model</label>
                                    <select value={forcedModel} onChange={e => setForcedModel(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white">
                                        <option value="">Default (Auto)</option>
                                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                                    </select>
                                </div>
                            ) : modalType === 'RATE' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Rate (1 USD = ? BDT)</label>
                                    <input type="number" value={customRate} onChange={e => setCustomRate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold" placeholder="Default"/>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Amount ($)</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold" placeholder="0.00"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Note</label>
                                        <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-sm" placeholder="Reason..."/>
                                    </div>
                                </>
                            )}

                            <button onClick={handleConfirmAction} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${modalType === 'KNOWLEDGE' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                {modalType === 'KNOWLEDGE' ? <><Save className="w-4 h-4 inline mr-2"/> Save Intelligence</> : 'Confirm Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-500"/> Client Management
                </h2>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search client..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <button onClick={onAddClient} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 active:scale-95"><UserPlus className="w-5 h-5"/> Add</button>
                </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Name & Contact</th>
                            <th className="px-6 py-4">Wallet</th>
                            <th className="px-6 py-4">AI Intelligence</th>
                            <th className="px-6 py-4 text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={client.avatar} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10"/>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{client.name || 'Unnamed User'}</p>
                                            <p className="text-xs text-gray-500">{client.username || 'No Username'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">${client.balance?.toFixed(2) || '0.00'}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => openActionModal(client, 'KNOWLEDGE')} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all">
                                        <Brain className="w-4 h-4"/> 
                                        <span className="text-xs font-bold">Intelligence</span>
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openActionModal(client, 'ADD')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><Plus className="w-4 h-4"/></button>
                                        <button onClick={() => openActionModal(client, 'DEDUCT')} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><CreditCard className="w-4 h-4"/></button>
                                        <button onClick={() => openActionModal(client, 'FORCE_MODEL')} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Cpu className="w-4 h-4"/></button>
                                        <button onClick={() => onAccess(client)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={client.avatar} className="w-10 h-10 rounded-full"/>
                                <h4 className="font-bold text-gray-900 dark:text-white">{client.name || 'Unnamed User'}</h4>
                            </div>
                            <span className="font-bold text-green-600">${client.balance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            <button onClick={() => openActionModal(client, 'KNOWLEDGE')} className="flex flex-col items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600"><Brain className="w-5 h-5"/><span className="text-[8px] font-bold mt-1">Brain</span></button>
                            <button onClick={() => openActionModal(client, 'ADD')} className="flex flex-col items-center p-2 bg-green-50 rounded-lg text-green-600"><Plus className="w-5 h-5"/><span className="text-[8px] font-bold mt-1">Add</span></button>
                            <button onClick={() => openActionModal(client, 'DEDUCT')} className="flex flex-col items-center p-2 bg-red-50 rounded-lg text-red-600"><CreditCard className="w-5 h-5"/><span className="text-[8px] font-bold mt-1">Cut</span></button>
                            <button onClick={() => openActionModal(client, 'FORCE_MODEL')} className="flex flex-col items-center p-2 bg-blue-50 rounded-lg text-blue-600"><Cpu className="w-5 h-5"/><span className="text-[8px] font-bold mt-1">Model</span></button>
                            <button onClick={() => onAccess(client)} className="flex flex-col items-center p-2 bg-indigo-50 rounded-lg text-indigo-600"><ExternalLink className="w-5 h-5"/><span className="text-[8px] font-bold mt-1">Access</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
