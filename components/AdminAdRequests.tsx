
import React from 'react';
import { Ad, AdStatus, SocialPlatform } from '../types';
import { Megaphone, CheckCircle, X, Facebook, Instagram, Clock, Banknote, Users, PlusCircle } from './Icons';

interface AdminAdRequestsProps {
    ads: Ad[];
    onUpdateStatus: (adId: string, status: AdStatus) => void;
    onCreateAd: () => void;
}

export const AdminAdRequests: React.FC<AdminAdRequestsProps> = ({ ads = [], onUpdateStatus, onCreateAd }) => {
    const pendingAds = ads.filter(ad => ad && ad.status === AdStatus.PENDING);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Requests</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                        onClick={onCreateAd}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5"/>
                        Create Ad
                    </button>
                    <div className="bg-indigo-500/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold border border-indigo-500/20 dark:border-indigo-500/30 whitespace-nowrap text-center">
                        Pending: {pendingAds.length}
                    </div>
                </div>
            </div>

            {pendingAds.length === 0 ? (
                <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-gray-500">
                    <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                    <p>No pending campaign requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingAds.map(ad => (
                        <div key={ad.id} className="bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                            <div className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                                {/* Left Info */}
                                <div className="flex gap-5 w-full lg:w-auto">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                                        ad.platform === SocialPlatform.FACEBOOK ? 'bg-blue-600/20 text-blue-600 dark:text-blue-50' : 'bg-pink-600/20 text-pink-600 dark:text-pink-50'
                                    }`}>
                                        {ad.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-8 h-8"/> : <Instagram className="w-8 h-8"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{ad.title || 'Untitled Campaign'}</h3>
                                            <span className="text-gray-500 dark:text-gray-400 font-mono text-xs bg-gray-100 dark:bg-black/20 px-2 py-0.5 rounded">#{ad.id?.slice(-6).toUpperCase() || 'N/A'}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{ad.content || 'No description provided.'}</p>
                                        
                                        <div className="flex flex-wrap gap-4 text-xs font-bold">
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                                                <Users className="w-3 h-3 text-indigo-500 dark:text-indigo-400"/> {ad.userName || 'Anonymous'}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                                                <Banknote className="w-3 h-3 text-green-600 dark:text-green-400"/> Budget: ${(ad.budget || 0).toFixed(2)}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                                                <Clock className="w-3 h-3 text-yellow-500 dark:text-yellow-400"/> {ad.date || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 dark:border-white/10 pt-4 lg:pt-0">
                                    <button 
                                        onClick={() => onUpdateStatus(ad.id, AdStatus.ACTIVE)}
                                        className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5"/> Approve
                                    </button>
                                    <button 
                                        onClick={() => onUpdateStatus(ad.id, AdStatus.REJECTED)}
                                        className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-white/5 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-5 h-5"/> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
