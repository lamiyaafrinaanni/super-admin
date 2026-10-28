
import React, { useState } from 'react';
import { Ad, AdStatus, SocialPlatform, User } from '../types';
import { Search, Sliders, Megaphone, Facebook, Instagram, Banknote, Clock, CheckCircle, X, Trash, Eye, Settings, Briefcase, PlusCircle, Users, Phone, Edit, CheckSquare } from './Icons';

interface AdminAllAdsProps {
    ads: Ad[];
    clients?: User[]; 
    onUpdateStatus: (adId: string, status: AdStatus, spentAmount?: number) => void;
    onDeleteAd: (adId: string) => void;
    onCreateAd: () => void;
    onEditAd?: (ad: Ad) => void;
}

export const AdminAllAds: React.FC<AdminAllAdsProps> = ({ ads = [], clients = [], onUpdateStatus, onDeleteAd, onCreateAd, onEditAd }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<AdStatus | 'ALL'>('ALL');
    const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'ALL'>('ALL');

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedAdForStatus, setSelectedAdForStatus] = useState<Ad | null>(null);
    const [newStatus, setNewStatus] = useState<AdStatus>(AdStatus.COMPLETED);
    const [spentAmount, setSpentAmount] = useState<string>('');
    const [hasSelectedStatus, setHasSelectedStatus] = useState(false);

    const filteredAds = ads.filter(ad => {
        if (!ad) return false;
        
        const title = ad.title || '';
        const userName = ad.userName || '';
        const id = ad.id || '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = 
            title.toLowerCase().includes(query) ||
            userName.toLowerCase().includes(query) ||
            id.toLowerCase().includes(query);
        
        const matchesStatus = statusFilter === 'ALL' || ad.status === statusFilter;
        const matchesPlatform = platformFilter === 'ALL' || ad.platform === platformFilter;

        return matchesSearch && matchesStatus && matchesPlatform;
    });

    const getClientMobile = (userId: string) => {
        return clients.find(c => c.id === userId)?.username || 'N/A';
    };

    const calculateEndDate = (startDate: string, duration?: number) => {
        if (!duration || !startDate) return 'N/A';
        try {
            const date = new Date(startDate);
            date.setDate(date.getDate() + duration);
            return date.toISOString().split('T')[0];
        } catch(e) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status: AdStatus) => {
        switch (status) {
            case AdStatus.ACTIVE: return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
            case AdStatus.PENDING: return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
            case AdStatus.REJECTED: return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
            case AdStatus.PAUSED: return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
            case AdStatus.COMPLETED: return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
            default: return 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300';
        }
    };

    const openStatusModal = (ad: Ad) => {
        setSelectedAdForStatus(ad);
        setNewStatus(ad.status === AdStatus.PENDING ? AdStatus.ACTIVE : ad.status);
        setSpentAmount(ad.spent && ad.spent > 0 ? ad.spent.toString() : '');
        setHasSelectedStatus(false);
        setStatusModalOpen(true);
    };

    const handleConfirmStatus = () => {
        if (!selectedAdForStatus) return;
        
        if (!hasSelectedStatus) {
            alert("Please select a status (Paused, Rejected, or Completed) to proceed.");
            return;
        }

        const spent = parseFloat(spentAmount);
        
        if ((newStatus === AdStatus.PAUSED || newStatus === AdStatus.REJECTED || newStatus === AdStatus.COMPLETED) && isNaN(spent)) {
            alert("Please enter the total spent amount to process refund calculation.");
            return;
        }

        onUpdateStatus(selectedAdForStatus.id, newStatus, isNaN(spent) ? undefined : spent);
        setStatusModalOpen(false);
        setSelectedAdForStatus(null);
    };

    const currentSpent = parseFloat(spentAmount) || 0;
    const refundPreview = selectedAdForStatus 
        ? Math.max(0, (selectedAdForStatus.budget || 0) - currentSpent) 
        : 0;

    return (
        <div className="space-y-6 animate-fade-in relative">
            
            {statusModalOpen && selectedAdForStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex justify-between items-center text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                            <h3 className="font-bold flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-300"/> Update Ad Status
                            </h3>
                            <button onClick={() => setStatusModalOpen(false)} className="hover:bg-gray-200 dark:hover:bg-white/10 p-1 rounded-full transition-colors text-gray-500 dark:text-gray-400"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Select New Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {[AdStatus.PAUSED, AdStatus.REJECTED, AdStatus.COMPLETED].map(st => (
                                        <button 
                                            key={st}
                                            onClick={() => { setNewStatus(st); setHasSelectedStatus(true); }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border ${
                                                hasSelectedStatus && newStatus === st 
                                                ? st === AdStatus.PAUSED ? 'bg-gray-600 text-white border-gray-500' :
                                                  st === AdStatus.REJECTED ? 'bg-red-600 text-white border-red-500' :
                                                  'bg-blue-600 text-white border-blue-500'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            {st === AdStatus.REJECTED ? 'Delete/Reject' : st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/5 pb-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Campaign Budget</span>
                                    <span className="text-gray-900 dark:text-white font-bold">${(selectedAdForStatus.budget || 0).toFixed(2)}</span>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase">Total Spent (Input)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={spentAmount}
                                            onChange={e => setSpentAmount(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-gray-900 dark:text-white font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-white/5 rounded-lg p-3 space-y-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Refund Calculation</p>
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                        <span>Budget Paid:</span>
                                        <span>${(selectedAdForStatus.budget || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-red-500 dark:text-red-300">
                                        <span>Actual Cost:</span>
                                        <span>- ${currentSpent.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-1 flex justify-between items-center">
                                        <span className="text-sm text-green-600 dark:text-green-400 font-bold">Refund Amount</span>
                                        <span className="text-xl font-extrabold text-green-600 dark:text-green-400">+ ${refundPreview.toFixed(2)}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 text-center">Amount will be added back to {selectedAdForStatus.userName}'s wallet.</p>
                            </div>

                            <button 
                                onClick={handleConfirmStatus}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Confirm Update & Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-indigo-500 dark:text-indigo-400"/> All Social Ads
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all client campaigns from one place</p>
                </div>
                
                <div className="grid grid-cols-2 sm:flex gap-2 items-center w-full sm:w-auto">
                    <button 
                        onClick={onCreateAd}
                        className="col-span-2 sm:col-span-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 mr-0 sm:mr-2"
                    >
                        <PlusCircle className="w-5 h-5"/> Create Ad
                    </button>

                    <div className="bg-green-100 dark:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-500/20 text-center min-w-[70px]">
                        <span className="block text-lg font-bold text-green-600 dark:text-green-400">{ads.filter(a => a.status === AdStatus.ACTIVE).length}</span>
                        <span className="text-[10px] text-green-700 dark:text-green-300 uppercase font-bold">Active</span>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-200 dark:border-yellow-500/20 text-center min-w-[70px]">
                        <span className="block text-lg font-bold text-yellow-600 dark:text-yellow-400">{ads.filter(a => a.status === AdStatus.PENDING).length}</span>
                        <span className="text-[10px] text-yellow-700 dark:text-yellow-300 uppercase font-bold">Pending</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-blue-100 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 text-center min-w-[70px]">
                        <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{ads.length}</span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-bold">Total</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by ID, User, or Title..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AdStatus | 'ALL')}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white cursor-pointer whitespace-nowrap"
                    >
                        <option value="ALL" className="bg-white dark:bg-slate-900">All Status</option>
                        {Object.values(AdStatus).map(status => (
                            <option key={status} value={status} className="bg-white dark:bg-slate-900">{status}</option>
                        ))}
                    </select>

                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as SocialPlatform | 'ALL')}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white cursor-pointer whitespace-nowrap"
                    >
                        <option value="ALL" className="bg-white dark:bg-slate-900">All Platforms</option>
                        {Object.values(SocialPlatform).map(p => (
                            <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 w-1/4">Campaign & Client Details</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Daily</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Spent</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                            {filteredAds.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No ads found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredAds.map(ad => (
                                    <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg mt-1 ${
                                                    ad.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'
                                                }`}>
                                                    {ad.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-6 h-6"/> : <Instagram className="w-6 h-6"/>}
                                                </div>
                                                
                                                <div className="space-y-1.5">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate max-w-[200px]" title={ad.title || ''}>{ad.title || 'Untitled'}</p>
                                                        <span className="text-[10px] text-gray-500 font-mono bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5">
                                                            ID: {ad.id?.slice(-8).toUpperCase() || 'N/A'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-0.5 text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
                                                            <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400"/> {ad.userName || 'Anonymous'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                            <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"/> {getClientMobile(ad.userId)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Start</p>
                                                    <p className="font-medium text-gray-700 dark:text-white text-xs">{ad.date || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">End</p>
                                                    <p className="font-medium text-gray-700 dark:text-white text-xs">{calculateEndDate(ad.date, ad.duration)}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 font-bold text-sm">
                                                <Clock className="w-4 h-4"/> 
                                                {ad.duration ? `${ad.duration} Days` : 'N/A'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold block mb-1">Daily</span>
                                            <span className="text-base font-bold text-gray-900 dark:text-white">${(ad.dailyBudget || 0).toFixed(2)}</span>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold block mb-1">Total</span>
                                            <span className="text-lg font-extrabold text-green-600 dark:text-green-400">${(ad.budget || 0).toFixed(2)}</span>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold block mb-1">Spent</span>
                                            <span className="text-lg font-extrabold text-red-500 dark:text-red-400">
                                                {ad.spent !== undefined ? `$${(ad.spent || 0).toFixed(2)}` : '-'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 align-top text-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider inline-block ${getStatusColor(ad.status)}`}>
                                                {ad.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 align-top text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => onEditAd && onEditAd(ad)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                                                    title="Edit Ad"
                                                >
                                                    <Edit className="w-5 h-5"/>
                                                </button>
                                                <button 
                                                    onClick={() => openStatusModal(ad)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Update Status"
                                                >
                                                    <Settings className="w-5 h-5"/>
                                                </button>
                                                <button 
                                                    onClick={() => onDeleteAd(ad.id)}
                                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete Ad"
                                                >
                                                    <Trash className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {filteredAds.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        No ads found matching your filters.
                    </div>
                ) : (
                    filteredAds.map(ad => (
                        <div key={ad.id} className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                        ad.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'
                                    }`}>
                                        {ad.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-6 h-6"/> : <Instagram className="w-6 h-6"/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1">{ad.title || 'Untitled'}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span className="font-mono bg-gray-100 dark:bg-white/5 px-1.5 rounded">#{ad.id?.slice(-4).toUpperCase() || 'N/A'}</span>
                                            <span>•</span>
                                            <span>{ad.userName || 'Anonymous'}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(ad.status)}`}>
                                    {ad.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Budget</p>
                                    <p className="text-gray-900 dark:text-white font-bold text-sm">${(ad.budget || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Spent</p>
                                    <p className="text-red-500 dark:text-red-400 font-bold text-sm">
                                        {ad.spent !== undefined ? `$${(ad.spent || 0).toFixed(2)}` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Duration</p>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">{ad.duration} Days</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">End Date</p>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">{calculateEndDate(ad.date, ad.duration)}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onEditAd && onEditAd(ad)}
                                    className="flex-1 bg-indigo-100 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-600/30 rounded-lg p-2 flex items-center justify-center gap-2 font-bold text-xs active:bg-indigo-200 dark:active:bg-indigo-600/20"
                                >
                                    <Edit className="w-4 h-4"/> Edit
                                </button>
                                <button 
                                    onClick={() => openStatusModal(ad)}
                                    className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg p-2 flex items-center justify-center gap-2 font-bold text-xs active:bg-gray-200 dark:active:bg-white/20"
                                >
                                    <Settings className="w-4 h-4"/> Update
                                </button>
                                <button 
                                    onClick={() => onDeleteAd(ad.id)}
                                    className="bg-red-100 dark:bg-red-600/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600/30 rounded-lg p-2 flex items-center justify-center active:bg-red-200 dark:active:bg-red-600/20"
                                >
                                    <Trash className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
