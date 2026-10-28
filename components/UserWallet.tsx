
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { User, Ad, Transaction, SocialPageRequest, SocialPlatform, SocialRequestStatus, AdStatus, Product, Order, ProductVariation, AppSetting, Notification, PagePostPreview, StoreCategory, GlobalVariation } from '../types';
import { Wallet, WhatsApp, LogOut, ShieldCheck, LayoutDashboard, Megaphone, Plus, Users, Banknote, Zap, Video, ShoppingBag, Home, CreditCard, Package, Sun, Moon, ChevronRight, Briefcase, Bell, X, Sparkles, Facebook } from './Icons';
import { SocialLoginModal } from './SocialLoginModal';
import { AddFundsModal } from './AddFundsModal';
import { UserDashboard } from './UserDashboard';
import { UserCreateAd } from './UserCreateAd';
import { UserAdsList } from './UserAdsList';
import { UserTransactions } from './UserTransactions';
import { UserProfile } from './UserProfile';
import { StoreFront } from './StoreFront';
import { OrderHistory } from './Store/OrderHistory';
import { OrderSuccess } from './Store/OrderSuccess';
import { NotificationPanel } from './NotificationPanel';
import { db } from '../services/db';
import { updateKnowledgeBase } from '../services/geminiService';
import { fetchPageDetails } from '../services/socialScraper';

const TrendifyAIChat = lazy(() => import('./TrendifyAIChat').then(module => ({ default: module.TrendifyAIChat })));

const getExchangeRate = (user: User, globalRateBD: number, globalRateOther: number) => {
    if (user?.customExchangeRate && user.customExchangeRate > 0) return user.customExchangeRate;
    
    // Consistent Standardized Logic
    const countryStr = (user?.country ?? '').toLowerCase();
    const usernameStr = (user?.username ?? '');
    const isBD = countryStr.includes('bangladesh') || 
                 usernameStr.startsWith('+880') || 
                 usernameStr.startsWith('01');
                 
    return isBD ? globalRateBD : globalRateOther;
};

interface UserWalletProps {
    user: User; 
    onLogout: () => void; 
    socialRequests: SocialPageRequest[]; 
    onAddSocialRequest: (req: SocialPageRequest) => void;
    userAds: Ad[];
    userTransactions: Transaction[];
    onAddFundsRequest: (bdt: number, usd: number, method: 'MANUAL' | 'AUTO', proof: string) => void;
    globalExchangeRateBD: number;
    globalExchangeRateOther: number;
    onCreateAd: (newAd: Ad, cost: number) => boolean;
    isAdminSession?: boolean;
    onOpenChat?: () => void;
    products?: Product[];
    orders?: Order[];
    onPurchase?: (product: Product, finalPriceBDT?: number, customerInput?: any) => Promise<Order | void>;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onClearAllNotifications?: () => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserWallet: React.FC<UserWalletProps> = React.memo(({ 
    user, onLogout, socialRequests, onAddSocialRequest, userAds, userTransactions, onAddFundsRequest, globalExchangeRateBD, globalExchangeRateOther, onCreateAd, isAdminSession, products = [], orders = [], onPurchase, isDarkMode, toggleTheme, notifications = [], onMarkAsRead, onClearAllNotifications, showToast
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socialModalPlatform, setSocialModalPlatform] = useState<SocialPlatform | null>(null);
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [mobileQuickMenuOpen, setMobileQuickMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('01642832777'); 
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [prefillAdData, setPrefillAdData] = useState<any>(null);
  const [prefillFundAmount, setPrefillFundAmount] = useState<number | undefined>(undefined);
  
  const [allCategories, setAllCategories] = useState<StoreCategory[]>([]);
  const [allVariations, setAllVariations] = useState<GlobalVariation[]>([]);

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

  const activeAdsCount = userAds.filter(a => a.status === AdStatus.ACTIVE).length;
  const totalSpend = userTransactions.filter(t => t.type === 'SPEND').reduce((acc, t) => acc + t.amount, 0);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const gen = await db.get<AppSetting>('settings', 'general');
              if (gen?.value?.paymentNumber) setPaymentNumber(gen.value.paymentNumber);

              const brandingSettings = await db.get<AppSetting>('settings', 'general_branding');
              if (brandingSettings) setBranding(brandingSettings.value);
              
              setAllCategories(await db.getAll<StoreCategory>('categories'));
              setAllVariations(await db.getAll<GlobalVariation>('global_variations'));
          } catch (e) { console.error("Failed to load settings", e); }
      };
      fetchSettings();
  }, []);

  const handleNavigation = (tab: string, data?: any) => {
      setMobileQuickMenuOpen(false);
      if (tab === 'add_funds') {
          setPrefillFundAmount(data?.amount);
          setAddFundsModalOpen(true);
      } else if (tab === 'connect_social') {
          setSocialModalPlatform(SocialPlatform.FACEBOOK);
      } else {
          setActiveTab(tab);
          if (tab === 'create_ad' && data) setPrefillAdData(data);
      }
  };

  const exchangeRate = getExchangeRate(user, globalExchangeRateBD, globalExchangeRateOther);

  const handleSocialLogin = async (identifier: string, password?: string) => {
      if (!socialModalPlatform) return;
      let pageUrl = identifier;
      let pageName = identifier;
      let pageId: string | undefined = undefined;
      let fetchedProfilePhoto, fetchedCoverPhoto, fetchedCategory, fetchedBio, fetchedFollowers, fetchedVerified;
      let fetchedPosts: PagePostPreview[] = [];
      let fetchedPhotos: string[] = [];

      if (!identifier.startsWith('http')) pageUrl = `https://${socialModalPlatform.toLowerCase()}.com/${identifier.replace('@', '')}`;
      else {
          const parts = identifier.split('/');
          pageName = parts[parts.length - 1] || parts[parts.length - 2] || identifier;
      }

      try {
          if (socialModalPlatform === SocialPlatform.FACEBOOK) {
              const data = await fetchPageDetails(pageUrl);
              if (data?.results) {
                  const res = data.results;
                  pageName = res.name || pageName;
                  pageId = res.page_id || res.id;
                  fetchedProfilePhoto = res.image || res.profile_pic;
                  fetchedCoverPhoto = res.cover_image;
                  fetchedFollowers = res.followers;
                  fetchedVerified = res.verified;
                  fetchedCategory = res.categories?.join(', ') || res.category;
                  fetchedBio = res.about || res.intro || res.best_description?.text;
              }
          } else { 
              await new Promise((resolve) => setTimeout(resolve, 1500)); 
          }

          const newRequest: SocialPageRequest = {
              id: `req-${Date.now()}`, userId: user.id, userName: user.name, platform: socialModalPlatform, pageName: decodeURIComponent(pageName), pageId, pageUrl, status: SocialRequestStatus.PENDING, date: new Date().toISOString().split('T')[0], loginId: identifier, loginPassword: password, pageProfilePhoto: fetchedProfilePhoto, pageCategory: fetchedCategory, pageBio: fetchedBio, pageCoverPhoto: fetchedCoverPhoto, followersCount: fetchedFollowers, isVerifiedBadge: fetchedVerified, recentPosts: fetchedPosts, recentPhotos: fetchedPhotos
          };
          onAddSocialRequest(newRequest);
          updateKnowledgeBase(user.id, 'SOCIAL', `Platform: ${socialModalPlatform}\nPage: ${pageName}\nBio: ${fetchedBio}`);
          setSocialModalPlatform(null);
          showToast?.(`Successfully connected to ${socialModalPlatform}!`, 'success');
      } catch (error: any) { showToast?.(`Connection Failed: ${error.message}`, 'error'); }
  };

  const handleBuyProduct = async (product: Product, selectedOptions: Record<string, any>, finalPriceBDT: number, inputData?: Record<string, any>) => {
      const priceUSD = finalPriceBDT / exchangeRate;
      if ((user.balance || 0) < priceUSD) { showToast?.("Insufficient balance.", "error"); return; }
      
      if (onPurchase) {
          try {
              const order = await onPurchase(
                  product, 
                  finalPriceBDT, 
                  inputData
              );
              if (order) { 
                  setLastSuccessOrder(order); 
                  setActiveTab('order_success'); 
              }
          } catch (e) { 
              showToast?.("Transaction failed.", "error"); 
          }
      }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
      const isActive = activeTab === id;
      return (
        <button onClick={() => setActiveTab(id)} className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group">
            <div 
                className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ 
                    backgroundColor: isActive ? branding.primaryColor + '33' : 'transparent',
                    color: isActive ? branding.primaryColor : undefined,
                    border: isActive ? `1px solid ${branding.primaryColor}4D` : 'none',
                    boxShadow: isActive ? `0 0 15px ${branding.primaryColor}66` : 'none',
                    transform: isActive ? 'translateY(-4px)' : 'none'
                }}
            >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            </div>
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`} style={{ color: isActive ? branding.primaryColor : undefined }}>{label}</span>
        </button>
      );
  };
  
  return (
    <div 
        className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white pb-24 md:pb-0 overflow-hidden relative transition-colors duration-300"
        style={{ fontSize: `${branding.fontSize}px` }}
    >
      <SocialLoginModal 
        isOpen={!!socialModalPlatform}
        platform={socialModalPlatform}
        onClose={() => setSocialModalPlatform(null)}
        onConnect={handleSocialLogin}
        showToast={showToast}
        branding={branding}
      />
      
      <AddFundsModal isOpen={addFundsModalOpen} onClose={() => setAddFundsModalOpen(false)} user={user} exchangeRate={exchangeRate} onSubmit={onAddFundsRequest} paymentNumber={paymentNumber} initialAmount={prefillFundAmount} showToast={showToast} />
      <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} notifications={notifications} onMarkAsRead={(id) => onMarkAsRead && onMarkAsRead(id)} onClearAll={() => onClearAllNotifications && onClearAllNotifications()} />
      
      {isAdminSession && (
          <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
              <span className="font-bold text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Admin Mode: Viewing as {user.name}</span>
              <button onClick={onLogout} className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm">Return to Admin Panel</button>
          </div>
      )}

      <header className={`bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 sticky ${isAdminSession ? 'top-[52px]' : 'top-0'} z-30 transition-colors duration-300`}>
        <div className="w-full max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-2 lg:gap-4">
          <div className="flex items-center gap-2 lg:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
             {branding.appLogo ? (
                <img src={branding.appLogo} style={{ height: branding.logoSize + 'px', width: 'auto' }} className="object-contain rounded-lg" alt="Logo" />
             ) : (
                <div 
                    className="p-2 rounded-lg shadow-lg"
                    style={{ backgroundColor: branding.primaryColor, width: branding.logoSize + 'px', height: branding.logoSize + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Wallet className="text-white w-full h-full" />
                </div>
             )}
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 hidden xl:block">{branding.appName}</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shrink-0">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`} style={{ backgroundColor: activeTab === 'dashboard' ? branding.primaryColor : 'transparent' }}><Home className="w-4 h-4"/> <span className="hidden lg:inline">Home</span></button>
              <button onClick={() => setActiveTab('store')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'store' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><ShoppingBag className="w-4 h-4"/> <span className="hidden lg:inline">Store</span></button>
              <button onClick={() => setActiveTab('my_orders')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'my_orders' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Package className="w-4 h-4"/> <span className="hidden lg:inline">My Orders</span></button>
              <button onClick={() => setActiveTab('my_ads')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'my_ads' || activeTab === 'create_ad' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Megaphone className="w-4 h-4"/> <span className="hidden lg:inline">Campaigns</span></button>
              <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><CreditCard className="w-4 h-4"/> <span className="hidden lg:inline">Wallet</span></button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
             <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-1 pr-2">
                <button 
                    onClick={() => setAddFundsModalOpen(true)} 
                    className="text-white p-1.5 rounded-md transition-colors shadow-sm"
                    style={{ backgroundColor: branding.primaryColor }}
                >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <span className="font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-100" style={{ color: branding.primaryColor }}>${user.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
             </div>

             <a href={`https://wa.me/${branding.supportPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors hidden sm:flex"><WhatsApp className="w-5 h-5" /><span className="text-sm font-medium hidden xl:inline">Support</span></a>

             {toggleTheme && (
                 <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
             )}

             <button onClick={() => setNotificationPanelOpen(!isNotificationPanelOpen)} className="p-2 rounded-lg transition-colors bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>}
             </button>

             <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-lg transition-colors group" onClick={() => setActiveTab('profile')}><img src={user.avatar} alt="Profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 object-cover group-hover:border-indigo-400" style={{ borderColor: branding.primaryColor + '80' }} /></div>
             <button onClick={onLogout} className={`p-2 rounded-full transition-colors ${isAdminSession ? 'text-red-400' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}><LogOut className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-6 relative z-10">
        {activeTab === 'dashboard' && <UserDashboard user={user} activeAdsCount={activeAdsCount} totalSpend={totalSpend} recentTransactions={userTransactions} onNavigate={handleNavigation} onAddFunds={() => setAddFundsModalOpen(true)} onOpenChat={() => setIsChatOpen(true)} />}
        {activeTab === 'create_ad' && <UserCreateAd user={user} socialRequests={socialRequests} onCreateAd={onCreateAd} exchangeRate={exchangeRate} onSuccess={() => { setActiveTab('my_ads'); setPrefillAdData(null); }} initialData={prefillAdData} showToast={showToast} />}
        {activeTab === 'my_ads' && <UserAdsList ads={userAds} onCreateNew={() => setActiveTab('create_ad')} />}
        {activeTab === 'store' && <StoreFront products={products} user={user} onAddToCart={handleBuyProduct} socialRequests={socialRequests} pageTitle="Trendify Store" onNavigate={handleNavigation} exchangeRate={exchangeRate} showToast={showToast} />}
        {activeTab === 'services' && <StoreFront products={products.filter(p => p.productType === 'Service')} user={user} onAddToCart={handleBuyProduct} socialRequests={socialRequests} pageTitle="Professional Services" onNavigate={handleNavigation} exchangeRate={exchangeRate} showToast={showToast} />}
        {activeTab === 'my_orders' && <OrderHistory orders={orders} />}
        {activeTab === 'order_success' && lastSuccessOrder && <OrderSuccess order={lastSuccessOrder} onNavigate={handleNavigation} />}
        {activeTab === 'transactions' && <UserTransactions transactions={userTransactions} user={user} onAddFunds={() => setAddFundsModalOpen(true)} />}
        {activeTab === 'profile' && <UserProfile user={user} onLogout={onLogout} onConnectSocial={(platform) => setSocialModalPlatform(platform)} socialRequests={socialRequests} showToast={showToast} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 md:hidden z-40 pb-safe-area rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-colors duration-300">
        <div className="flex justify-around items-center h-20 px-2 pb-2 relative">
          <NavItem id="dashboard" icon={Home} label="Home" />
          <NavItem id="store" icon={ShoppingBag} label="Store" />
          <div className="relative -top-6">
              <button 
                onClick={() => setMobileQuickMenuOpen(!mobileQuickMenuOpen)} 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all duration-300 border-4 border-white dark:border-slate-900 z-50 ${mobileQuickMenuOpen ? 'rotate-90 scale-90' : 'rotate-0'}`}
                style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}CC)`, boxShadow: `0 0 20px ${branding.primaryColor}80` }}
              >
                {mobileQuickMenuOpen ? <X className="w-8 h-8"/> : <Plus className="w-8 h-8"/>}
              </button>
          </div>
          <NavItem id="transactions" icon={Wallet} label="Wallet" />
          <NavItem id="profile" icon={Users} label="Profile" />
        </div>
      </div>
      
       {/* MOBILE QUICK ACTION OVERLAY */}
       {mobileQuickMenuOpen && (
           <>
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setMobileQuickMenuOpen(false)}></div>
               <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6 animate-fade-in-up">
                   <div className="grid grid-cols-2 gap-4 w-[280px]">
                       <button onClick={() => handleNavigation('add_funds')} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-gray-100 dark:border-white/10 transition-transform active:scale-90 group">
                           <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Banknote className="w-6 h-6"/></div>
                           <span className="text-xs font-bold dark:text-white">Add Funds</span>
                       </button>
                       <button onClick={() => handleNavigation('create_ad')} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-gray-100 dark:border-white/10 transition-transform active:scale-90 group">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6"/></div>
                           <span className="text-xs font-bold dark:text-white">Create Ad</span>
                       </button>
                       <button onClick={() => handleNavigation('connect_social')} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-gray-100 dark:border-white/10 transition-transform active:scale-90 group">
                           <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Facebook className="w-6 h-6"/></div>
                           <span className="text-xs font-bold dark:text-white">Connect FB</span>
                       </button>
                       <button onClick={() => handleNavigation('store')} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-gray-100 dark:border-white/10 transition-transform active:scale-90 group">
                           <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingBag className="w-6 h-6"/></div>
                           <span className="text-xs font-bold dark:text-white">Shop Now</span>
                       </button>
                   </div>
                   
                   <button 
                        onClick={() => setIsChatOpen(true)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-bounce-slow"
                   >
                       <Sparkles className="w-5 h-5"/>
                       Ask AI Expert
                   </button>
               </div>
           </>
       )}

       <Suspense fallback={null}>
            <TrendifyAIChat 
                isGlobalOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(false)} 
                storeProducts={products} 
                onPurchase={(p) => handleBuyProduct(p, {}, p.basePrice)} 
                userData={user} 
                userAds={userAds} 
                userSocials={socialRequests.filter(r => r.userId === user.id)} 
                userTransactions={userTransactions} 
                userOrders={orders} 
                allUsers={[user]}
                allAds={userAds}
                allOrders={orders}
                allProducts={products}
                allTransactions={userTransactions}
                allCategories={allCategories}
                allVariations={allVariations}
                onNavigate={handleNavigation} 
                onCreateAd={onCreateAd} 
                onOpenAddFunds={() => setAddFundsModalOpen(true)} 
                onOpenConnectSocial={() => setSocialModalPlatform(SocialPlatform.FACEBOOK)} 
                showToast={showToast} 
            />
       </Suspense>
    </div>
  );
});
