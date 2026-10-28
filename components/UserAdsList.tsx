
import React, { useState } from 'react';
import { Ad, AdStatus, SocialPlatform } from '../types';
import { PlusCircle, Megaphone, Search, Sliders, Facebook, Instagram, Banknote, Clock, CheckCircle, AlertCircle, X, ChevronDown } from './Icons';

interface UserAdsListProps {
    ads: Ad[];
    onCreateNew: () => void;
}

export const UserAdsList: React.FC<UserAdsListProps> = ({ ads, onCreateNew }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<AdStatus | 'ALL'>('ALL');

    const filteredAds = ads.filter(ad => {
        if (!ad) return false;
        const query = (searchQuery || '').toLowerCase();
        const matchesSearch = (ad.title || '').toLowerCase().includes(query) ||
                              (ad.content || '').toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'ALL' || ad.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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

    return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Advertisements</h2>
             
             <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaign..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 transition-all shadow-sm"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Sliders className="w-4 h-4 text-gray-500" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AdStatus | 'ALL')}
                        className="w-full sm:w-40 pl-10 pr-8 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="ALL" className="bg-white dark:bg-slate-900">All Status</option>
                        {Object.values(AdStatus).map(status => (
                            <option key={status} value={status} className="bg-white dark:bg-slate-900">{status}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                </div>
             </div>
          </div>

          {filteredAds.length === 0 ? (
              <div className="bg-white dark:bg-white/5 p-12 rounded-2xl border border-gray-200 dark:border-white/10 text-center flex flex-col items-center justify-center animate-fade-in-up">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Megaphone className="w-10 h-10 text-gray-400 dark:text-gray-500"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Campaigns Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                      {searchQuery || statusFilter !== 'ALL' 
                        ? "Try adjusting your search or filters to find what you're looking for." 
                        : "You haven't created any ad campaigns yet. Start your first campaign today!"}
                  </p>
                  <button 
                    onClick={onCreateNew}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
                  >
                      <PlusCircle className="w-5 h-5"/> Create New Ad
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {filteredAds.map(ad => (
                      <div key={ad.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex flex-col md:flex-row gap-5 items-start">
                              
                              {/* Platform Icon */}
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                                  ad.platform === SocialPlatform.FACEBOOK 
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                  : 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400'
                              }`}>
                                  {ad.platform === SocialPlatform.FACEBOOK ? <Facebook className="w-8 h-8"/> : <Instagram className="w-8 h-8"/>}
                              </div>

                              <div className="flex-1 w-full">
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                      <div>
                                          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{ad.title}</h3>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">ID: {ad.id.slice(-8).toUpperCase()}</p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(ad.status)}`}>
                                          {ad.status}
                                      </span>
                                  </div>

                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                                      {ad.content}
                                  </p>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                      <div>
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Start Date</p>
                                          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                                              <Clock className="w-4 h-4 text-gray-400"/> {ad.date}
                                          </div>
                                      </div>
                                      <div>
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Budget</p>
                                          <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                                              <Banknote className="w-4 h-4 text-green-500"/> ${(ad.budget || 0).toFixed(2)}
                                          </div>
                                      </div>
                                      <div>
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Duration</p>
                                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{ad.duration} Days</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Spent</p>
                                          <p className="text-sm font-bold text-red-500 dark:text-red-400">
                                              {ad.spent !== undefined ? `$${(ad.spent || 0).toFixed(2)}` : '-'}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>
    );
};
