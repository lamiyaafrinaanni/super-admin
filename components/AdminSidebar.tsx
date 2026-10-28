
import React, { useState } from 'react';
import { LayoutDashboard, Users, Video, CreditCard, Megaphone, Settings, Wallet, X, LogOut, ShoppingBag, PlusCircle, Package, ClipboardList, CheckSquare, ChevronDown, ChevronUp, ClipboardList as ListIcon, Briefcase, Inbox, Bell, Sliders, Brain } from './Icons';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  pendingRequestsCount: number;
  pendingPaymentsCount: number;
  pendingAdsCount: number;
  onOpenNotify: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  mobileOpen, 
  setMobileOpen,
  pendingRequestsCount,
  pendingPaymentsCount,
  pendingAdsCount,
  onOpenNotify
}) => {
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [adsMenuOpen, setAdsMenuOpen] = useState(false);

  const totalPending = pendingRequestsCount + pendingPaymentsCount + pendingAdsCount;

  React.useEffect(() => {
    if (activeTab.startsWith('store_') || activeTab === 'store_categories' || activeTab === 'store_variations') {
      setStoreMenuOpen(true);
    }
    if (activeTab === 'ad_requests' || activeTab === 'all_ads') {
        setAdsMenuOpen(true);
    }
  }, [activeTab]);

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900/50 backdrop-blur-xl border-r border-gray-200 dark:border-white/10
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white cursor-pointer" onClick={() => onTabChange('dashboard')}>
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              AdWallet
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <button
              onClick={() => { onTabChange('dashboard'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><LayoutDashboard className="w-5 h-5" /> Dashboard</div>
            </button>

            <button
              onClick={() => { onTabChange('unified_requests'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'unified_requests' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><Inbox className="w-5 h-5" /> Request Center</div>
              {totalPending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md shadow-red-500/30">{totalPending}</span>
              )}
            </button>

            <button
              onClick={() => { onTabChange('clients'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'clients' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><Users className="w-5 h-5" /> Client List</div>
            </button>

            <div>
                <button
                  onClick={() => setAdsMenuOpen(!adsMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'ad_requests' || activeTab === 'all_ads'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-white/5' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3"><Megaphone className="w-5 h-5" /> Ad Campaigns</div>
                  <div className="flex items-center gap-2">
                      {pendingAdsCount > 0 && !adsMenuOpen && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingAdsCount}</span>
                      )}
                      {adsMenuOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </div>
                </button>
                
                {adsMenuOpen && (
                    <div className="ml-4 pl-4 border-l border-gray-200 dark:border-white/10 space-y-1 mt-1 animate-fade-in">
                        <button
                            onClick={() => { onTabChange('all_ads'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'all_ads' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <ListIcon className="w-4 h-4"/> All Ads
                        </button>
                        <button
                            onClick={() => { onTabChange('ad_requests'); setMobileOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'ad_requests' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3"><PlusCircle className="w-4 h-4"/> Requests</div>
                            {pendingAdsCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingAdsCount}</span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div>
                <button
                  onClick={() => setStoreMenuOpen(!storeMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab.startsWith('store_') 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-white/5' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3"><ShoppingBag className="w-5 h-5" /> Pro Store</div>
                  {storeMenuOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </button>
                
                {storeMenuOpen && (
                    <div className="ml-4 pl-4 border-l border-gray-200 dark:border-white/10 space-y-1 mt-1 animate-fade-in">
                        <button
                            onClick={() => { onTabChange('store_categories'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_categories' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <ListIcon className="w-4 h-4"/> Categories
                        </button>
                        <button
                            onClick={() => { onTabChange('store_variations'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_variations' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Sliders className="w-4 h-4"/> Variations
                        </button>
                        <button
                            onClick={() => { onTabChange('store_add'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_add' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <PlusCircle className="w-4 h-4"/> Add Item
                        </button>
                        <button
                            onClick={() => { onTabChange('store_products'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_products' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Package className="w-4 h-4"/> All Items
                        </button>
                        <button
                            onClick={() => { onTabChange('store_orders'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_orders' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <ClipboardList className="w-4 h-4"/> Orders
                        </button>
                        <button
                            onClick={() => { onTabChange('store_history'); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'store_history' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/10' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <CheckSquare className="w-4 h-4"/> Completed
                        </button>
                    </div>
                )}
            </div>

            <button
              onClick={() => { onTabChange('social_requests'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'social_requests' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><Video className="w-5 h-5" /> Social Pages</div>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">{pendingRequestsCount}</span>
              )}
            </button>

            <button
              onClick={() => { onTabChange('pending_payments'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'pending_payments' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><CreditCard className="w-5 h-5" /> Payments</div>
              {pendingPaymentsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">{pendingPaymentsCount}</span>
              )}
            </button>

            <button
              onClick={() => { onOpenNotify(); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors`}
            >
              <Bell className="w-5 h-5" /> Broadcast
            </button>

            <button
              onClick={() => { onTabChange('ai_rules'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'ai_rules' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><Brain className="w-5 h-5" /> AI Intelligence</div>
            </button>

            <button
              onClick={() => { onTabChange('settings'); setMobileOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings' 
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3"><Settings className="w-5 h-5" /> System Setup</div>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
