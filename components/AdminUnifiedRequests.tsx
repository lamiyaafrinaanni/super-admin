
import React, { useState } from 'react';
import { Ad, AdStatus, Order, SocialPageRequest, SocialRequestStatus, Transaction, User } from '../types';
import { Megaphone, Package, Video, CreditCard, Inbox, ChevronRight, Clock, Users } from './Icons';
import { AdminAdRequests } from './AdminAdRequests';
import { OrderList } from './Store/OrderList';
import { AdminSocialRequests } from './AdminSocialRequests';
import { AdminPendingPayments } from './AdminPendingPayments';

interface AdminUnifiedRequestsProps {
    ads: Ad[];
    orders: Order[];
    socialRequests: SocialPageRequest[];
    transactions: Transaction[];
    users: User[];
    
    // Handlers
    onUpdateAdStatus: (adId: string, status: AdStatus) => void;
    onCreateAd: () => void;
    onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
    onUpdateSocialStatus: (request: SocialPageRequest, status: SocialRequestStatus, updatedData?: Partial<SocialPageRequest>) => void;
    onApprovePayment: (id: string) => void;
    onRejectPayment: (id: string) => void;
}

export const AdminUnifiedRequests: React.FC<AdminUnifiedRequestsProps> = ({
    ads,
    orders,
    socialRequests,
    transactions,
    users,
    onUpdateAdStatus,
    onCreateAd,
    onUpdateOrder,
    onUpdateSocialStatus,
    onApprovePayment,
    onRejectPayment
}) => {
    const [activeTab, setActiveTab] = useState<'all' | 'campaigns' | 'orders' | 'socials' | 'funds'>('all');

    // Filtered Pending Data
    const pendingAds = ads.filter(a => a.status === AdStatus.PENDING);
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
    const pendingSocials = socialRequests.filter(r => r.status === SocialRequestStatus.PENDING);
    const pendingFunds = transactions.filter(t => t.status === 'Pending');

    const totalPending = pendingAds.length + pendingOrders.length + pendingSocials.length + pendingFunds.length;

    // Consolidate All Pending Requests for the 'All' Tab
    const consolidatedRequests = [
        ...pendingAds.map(ad => ({ id: ad.id, type: 'Campaign', title: ad.title, user: ad.userName, date: ad.date, platform: ad.platform, original: ad, tab: 'campaigns' })),
        ...pendingOrders.map(ord => ({ id: ord.id, type: 'Order', title: ord.items[0]?.productName || 'Store Order', user: ord.userName, date: ord.date, original: ord, tab: 'orders' })),
        ...pendingSocials.map(soc => ({ id: soc.id, type: 'Social', title: `${soc.platform} Page: ${soc.pageName}`, user: soc.userName, date: soc.date, original: soc, tab: 'socials' })),
        ...pendingFunds.map(fund => ({ id: fund.id, type: 'Fund', title: `Deposit Request: $${fund.amount}`, user: fund.userId, date: fund.date, original: fund, tab: 'funds' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Campaign': return <Megaphone className="w-5 h-5 text-indigo-500"/>;
            case 'Order': return <Package className="w-5 h-5 text-purple-500"/>;
            case 'Social': return <Video className="w-5 h-5 text-pink-500"/>;
            case 'Fund': return <CreditCard className="w-5 h-5 text-green-500"/>;
            default: return <Inbox className="w-5 h-5 text-gray-500"/>;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Campaign': return 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20';
            case 'Order': return 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20';
            case 'Social': return 'bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20';
            case 'Fund': return 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20';
            default: return 'bg-gray-50 dark:bg-white/5 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto pb-1 gap-2 custom-scrollbar">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                        activeTab === 'all'
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                    <Inbox className="w-4 h-4"/>
                    All Requests
                    {totalPending > 0 && <span className={`${activeTab === 'all' ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'} px-2 py-0.5 rounded-full text-[10px] ml-1`}>{totalPending}</span>}
                </button>

                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                        activeTab === 'campaigns'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                    <Megaphone className="w-4 h-4"/>
                    Campaigns
                    {pendingAds.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{pendingAds.length}</span>}
                </button>

                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                        activeTab === 'orders'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                    <div className="relative">
                        <Package className="w-4 h-4"/>
                    </div>
                    Orders
                    {pendingOrders.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{pendingOrders.length}</span>}
                </button>

                <button
                    onClick={() => setActiveTab('socials')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                        activeTab === 'socials'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-500/20'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                    <Video className="w-4 h-4"/>
                    Social Pages
                    {pendingSocials.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{pendingSocials.length}</span>}
                </button>

                <button
                    onClick={() => setActiveTab('funds')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                        activeTab === 'funds'
                        ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                    <CreditCard className="w-4 h-4"/>
                    Fund Requests
                    {pendingFunds.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{pendingFunds.length}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-transparent rounded-2xl">
                {activeTab === 'all' && (
                    <div className="space-y-4 animate-fade-in">
                        {consolidatedRequests.length === 0 ? (
                            <div className="bg-white dark:bg-white/5 p-16 rounded-3xl border border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
                                <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-full mb-4">
                                    <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Clear!</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-xs mt-2">There are no pending requests across any category right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {consolidatedRequests.map((req, idx) => (
                                    <div 
                                        key={`${req.type}-${req.id}`}
                                        onClick={() => setActiveTab(req.tab as any)}
                                        className={`group p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] flex items-center justify-between ${getTypeColor(req.type)}`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="p-3 bg-white dark:bg-black/20 rounded-xl shadow-sm border border-black/5">
                                                {getTypeIcon(req.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 opacity-70">{req.type}</span>
                                                    <span className="text-[10px] font-mono text-gray-400">#{req.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-base leading-tight">{req.title}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-400"><Users className="w-3 h-3"/> {req.user}</span>
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500"><Clock className="w-3 h-3"/> {req.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Take Action</span>
                                            <div className="p-2 bg-white/50 dark:bg-white/5 rounded-full group-hover:translate-x-1 transition-transform border border-black/5">
                                                <ChevronRight className="w-4 h-4 text-gray-400"/>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'campaigns' && (
                    <AdminAdRequests 
                        ads={ads}
                        onUpdateStatus={onUpdateAdStatus}
                        onCreateAd={onCreateAd}
                    />
                )}

                {activeTab === 'orders' && (
                    <OrderList 
                        orders={orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Delivered')}
                        onUpdateOrder={onUpdateOrder}
                    />
                )}

                {activeTab === 'socials' && (
                    <AdminSocialRequests 
                        requests={socialRequests}
                        users={users}
                        onUpdateStatus={onUpdateSocialStatus}
                    />
                )}

                {activeTab === 'funds' && (
                    <AdminPendingPayments 
                        payments={transactions.filter(t => t.status === 'Pending')}
                        onApprove={onApprovePayment}
                        onReject={onRejectPayment}
                    />
                )}
            </div>
        </div>
    );
};
