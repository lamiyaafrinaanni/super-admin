
import React, { useState, useEffect, useCallback } from 'react';
import { User, Ad, Transaction, SocialPageRequest, Product, Order, Notification, UserRole, AdStatus, SocialPlatform, SocialRequestStatus, AppSetting, ProductVariation, AIActionPayload, Toast as ToastType, StoreCategory, GlobalVariation, OrderItem, StoreAttribute } from './types';
import { db } from './services/db';
import { Login } from './components/Login';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminUnifiedRequests } from './components/AdminUnifiedRequests';
import { AdminClientList } from './components/AdminClientList';
import { AdminAllAds } from './components/AdminAllAds';
import { AdminSettings } from './components/AdminSettings';
import { AdminAIRules } from './components/AdminAIRules';
import { UserWallet } from './components/UserWallet';
import { AddProduct } from './components/AddProduct';
import { AddService } from './components/Store/AddService';
import { ProductList } from './components/Store/ProductList';
import { OrderList } from './components/Store/OrderList';
import { OrderHistory } from './components/Store/OrderHistory';
import { CategoryManager } from './components/Store/CategoryManager';
import { VariationManager } from './components/Store/VariationManager';
import { NotificationPanel } from './components/NotificationPanel';
import { TrendifyAIChat } from './components/TrendifyAIChat';
import { AdminSocialRequests } from './components/AdminSocialRequests';
import { AdminAdRequests } from './components/AdminAdRequests';
import { AdminPendingPayments } from './components/AdminPendingPayments';
import { CreateAdForm } from './components/CreateAdForm';
import { AddClientForm } from './components/AddClientForm';
import { AdminSendNotification } from './components/AdminSendNotification';
import { ToastContainer } from './components/Toast';
import { LayoutDashboard, Users, Megaphone, Inbox, Menu, Wallet, Bell, Search, Plus, Sparkles } from './components/Icons';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [realAdminUser, setRealAdminUser] = useState<User | null>(null); 
  const [clients, setClients] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [socialRequests, setSocialRequests] = useState<SocialPageRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [globalVariations, setGlobalVariations] = useState<GlobalVariation[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdminCreateAdOpen, setIsAdminCreateAdOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);

  // --- PERSISTENT SETTINGS ---
  const [exchangeRates, setExchangeRates] = useState({ bd: 120, other: 110 });

  // --- GLOBAL TOAST STATE ---
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...(prev || []), { id, message, type }]);
  }, []);

  const closeToast = (id: string) => {
      setToasts(prev => (prev || []).filter(t => t.id !== id));
  };

  useEffect(() => {
    const initData = async () => {
        try {
            await db.open();
            
            // Load Users
            const loadedUsers = await db.getAll<User>('users') || [];
            const hasAdmin = loadedUsers.some(u => u.role === UserRole.ADMIN || u.username === 'admin');
            
            if (!hasAdmin) {
                const admin: User = { 
                    id: 'admin-1', 
                    name: 'Super Admin', 
                    username: 'admin', 
                    role: UserRole.ADMIN, 
                    avatar: 'https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff', 
                    country: 'Bangladesh', 
                    balance: 0, 
                    password: '123' 
                };
                await db.put('users', admin);
                const finalUsers = [...loadedUsers, admin];
                setClients(finalUsers);
            } else {
                setClients(loadedUsers);
            }

            // Load Global Settings
            const rateSetting = await db.get<AppSetting>('settings', 'exchange_rates');
            if (rateSetting) {
                setExchangeRates(rateSetting.value);
            } else {
                await db.put('settings', { id: 'exchange_rates', value: { bd: 120, other: 110 } });
            }

            setAds(await db.getAll<Ad>('ads') || []);
            setTransactions(await db.getAll<Transaction>('transactions') || []);
            setSocialRequests(await db.getAll<SocialPageRequest>('socialRequests') || []);
            setOrders(await db.getAll<Order>('orders') || []);
            setNotifications(await db.getAll<Notification>('notifications') || []);
            setProducts(await db.getAll<Product>('products') || []);
            setCategories(await db.getAll<StoreCategory>('categories') || []);
            setGlobalVariations(await db.getAll<GlobalVariation>('global_variations') || []);
        } catch (e) { console.error("DB Init Error", e); }
    };
    initData();
  }, []);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      if (loggedInUser.role === UserRole.ADMIN) setRealAdminUser(loggedInUser);
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
  };

  const handleLogout = () => {
      if (realAdminUser && user?.id !== realAdminUser.id) {
          setUser(realAdminUser);
          showToast("Exited client view.", "info");
      } else {
          setUser(null);
          setRealAdminUser(null);
          setActiveTab('dashboard');
          showToast("Logged out successfully.", "info");
      }
  };

  const handleUpdateAdStatus = async (adId: string, status: AdStatus, spentAmount?: number) => {
      const ad = (ads || []).find(a => a.id === adId);
      if (!ad) return;
      if (spentAmount !== undefined) {
          const refundAmount = ad.budget - spentAmount;
          if (refundAmount > 0) {
              const client = (clients || []).find(c => c.id === ad.userId);
              if (client) {
                  const newBalance = (client.balance || 0) + refundAmount;
                  const updatedClient = { ...client, balance: newBalance };
                  await db.put('users', updatedClient);
                  setClients(prev => (prev || []).map(c => c.id === ad.userId ? updatedClient : c));
                  if (user?.id === ad.userId) setUser(updatedClient);
                  const tx: Transaction = { id: `tx-refund-${Date.now()}`, userId: ad.userId, type: 'REFUND', amount: refundAmount, date: new Date().toISOString().split('T')[0], status: 'Completed', note: `Refund from Ad: ${ad.title}` };
                  await db.add('transactions', tx);
                  setTransactions(prev => [tx, ...(prev || [])]);
                  showToast(`Refund of $${refundAmount.toFixed(2)} added.`, 'success');
              }
          }
      }
      const updatedAd = { ...ad, status, spent: spentAmount !== undefined ? spentAmount : ad.spent };
      await db.put('ads', updatedAd);
      setAds(prev => (prev || []).map(a => a.id === adId ? updatedAd : a));
      showToast(`Ad updated to ${status}.`, 'success');
  };

  const handleUpdateBalance = async (userId: string, amount: number, type: 'DEPOSIT' | 'SPEND' | 'REFUND', note: string) => {
      const client = (clients || []).find(c => c.id === userId);
      if (!client) return;
      let newBalance = client.balance || 0;
      if (type === 'DEPOSIT' || type === 'REFUND') newBalance += amount;
      else if (type === 'SPEND') newBalance -= amount;
      const updatedClient = { ...client, balance: newBalance };
      await db.put('users', updatedClient);
      setClients(prev => (prev || []).map(c => c.id === userId ? updatedClient : c));
      if (user?.id === userId) setUser(updatedClient);
      const tx: Transaction = { id: `tx-${Date.now()}`, userId, type, amount, date: new Date().toISOString().split('T')[0], status: 'Completed', note };
      await db.add('transactions', tx);
      setTransactions(prev => [tx, ...(prev || [])]);
  };

  const handleApprovePayment = async (transactionId: string) => {
      const tx = (transactions || []).find(t => t.id === transactionId);
      if (!tx) return;
      const updatedTx: Transaction = { ...tx, status: 'Completed' };
      await db.put('transactions', updatedTx);
      setTransactions(prev => (prev || []).map(t => t.id === transactionId ? updatedTx : t));
      const client = (clients || []).find(c => c.id === tx.userId);
      if (client) {
          const newBalance = (client.balance || 0) + tx.amount;
          const updatedClient = { ...client, balance: newBalance };
          await db.put('users', updatedClient);
          setClients(prev => (prev || []).map(c => c.id === tx.userId ? updatedClient : c));
          if (user?.id === tx.userId) setUser(updatedClient);
      }
      showToast("Payment approved.", "success");
  };

  const handleRejectPayment = async (transactionId: string) => {
      const tx = (transactions || []).find(t => t.id === transactionId);
      if (!tx) return;
      const updatedTx: Transaction = { ...tx, status: 'Failed' };
      await db.put('transactions', updatedTx);
      setTransactions(prev => (prev || []).map(t => t.id === transactionId ? updatedTx : t));
      showToast("Payment rejected.", "warning");
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
      const order = (orders || []).find(o => o.id === orderId);
      if (!order) return;
      const updatedOrder = { ...order, ...updates };
      await db.put('orders', updatedOrder);
      setOrders(prev => (prev || []).map(o => o.id === orderId ? updatedOrder : o));
      showToast("Order status updated.", "success");
  };

  const handleUpdateSocialStatus = async (request: SocialPageRequest, status: SocialRequestStatus, updatedData?: Partial<SocialPageRequest>) => {
      const updatedReq = { ...request, status, ...updatedData };
      await db.put('socialRequests', updatedReq);
      setSocialRequests(prev => (prev || []).map(r => r.id === request.id ? updatedReq : r));
      showToast(`Social status ${(status || '').toLowerCase()}.`, 'success');
  };

  const handleSendNotification = async (targetUserId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
      const newNotifications: Notification[] = [];
      const now = new Date().toLocaleString();
      if (targetUserId === 'ALL') {
          (clients || []).filter(c => c.role === UserRole.USER).forEach(u => {
              newNotifications.push({ id: `notif-${Date.now()}-${u.id}`, userId: u.id, title, message, date: now, read: false, type });
          });
      } else {
          newNotifications.push({ id: `notif-${Date.now()}`, userId: targetUserId, title, message, date: now, read: false, type });
      }
      for (const n of newNotifications) await db.add('notifications', n);
      setNotifications(prev => [...newNotifications, ...(prev || [])]);
      setIsSendNotificationOpen(false);
      showToast("Sent!", "success");
  };

  const handleAIAdminAction = async (action: AIActionPayload) => {
      try {
          switch (action.type) {
              case 'ADMIN_NAVIGATE':
                  setActiveTab(String(action.data));
                  break;
              case 'ADMIN_ADD_FUNDS':
                  const targetId = action.data.userId || action.data.username;
                  const targetUser = clients.find(c => c.id === targetId || c.username === targetId);
                  if (targetUser && action.data.amount) {
                      await handleUpdateBalance(targetUser.id, parseFloat(action.data.amount), 'DEPOSIT', 'AI Managed Funding');
                      showToast(`Funds added to ${targetUser.name}!`, 'success');
                  } else {
                      showToast("Target user not found for funding.", "error");
                  }
                  break;
              case 'ADMIN_CREATE_USER':
                  const newUser: User = {
                    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    name: action.data.name || "New Client",
                    username: action.data.username || `client_${Date.now()}`,
                    role: UserRole.USER,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(action.data.name || "U")}&background=random&color=fff`,
                    balance: parseFloat(action.data.balance || action.data.initial_balance) || 0,
                    password: action.data.password || '123',
                    kycStatus: 'Unverified',
                    country: action.data.country || 'International'
                  };
                  await db.add('users', newUser);
                  setClients(prev => [...(prev || []), newUser]);
                  showToast(`User ${newUser.name} created!`, 'success');
                  break;
              case 'ADMIN_BATCH_CREATE_USERS':
                  const count = parseInt(action.data.user_count || action.data.count || 1);
                  const initialBal = parseFloat(action.data.initial_balance || action.data.balance || 0);
                  const createdUsers: User[] = [];
                  for(let i = 1; i <= count; i++) {
                      const batchUser: User = {
                          id: `user-batch-${Date.now()}-${i}`,
                          name: `Demo User ${i}`,
                          username: `demo_user_${Date.now()}_${i}`,
                          role: UserRole.USER,
                          avatar: `https://ui-avatars.com/api/?name=Demo+${i}&background=random&color=fff`,
                          balance: initialBal,
                          password: '123',
                          kycStatus: 'Unverified',
                          country: 'Demo Country'
                      };
                      await db.add('users', batchUser);
                      createdUsers.push(batchUser);
                  }
                  setClients(prev => [...(prev || []), ...createdUsers]);
                  showToast(`${count} users created with $${initialBal} balance each!`, 'success');
                  break;
              case 'ADMIN_CREATE_VARIATION':
                  const newVar: GlobalVariation = {
                      id: `attr-${Date.now()}`,
                      name: action.data.name,
                      type: action.data.type || 'dropdown',
                      options: (Array.isArray(action.data.options) ? action.data.options : []).map((o: any) => ({
                          id: o.id || `opt-${Math.random().toString(36).substr(2, 5)}`,
                          ...o
                      })),
                      isRequired: action.data.isRequired ?? true
                  };
                  await db.add('global_variations', newVar);
                  setGlobalVariations(prev => [...(prev || []), newVar]);
                  showToast(`Attribute "${newVar.name}" created!`, 'success');
                  break;
              case 'ADMIN_CREATE_PRODUCT':
                  // Smart Category Detection/Creation
                  let categoryId = "";
                  const providedCatName = String(action.data.categoryName || '');
                  if (providedCatName) {
                      const cats = await db.getAll<StoreCategory>('categories') || [];
                      const catLower = providedCatName.toLowerCase();
                      const existing = cats.find(c => (c.name || '').toLowerCase() === catLower);
                      if (existing) categoryId = existing.id;
                      else {
                          categoryId = `cat-${Date.now()}`;
                          const newCat = { id: categoryId, name: providedCatName, description: `Auto-created for ${action.data.name}` };
                          await db.add('categories', newCat);
                          setCategories(prev => [...(prev || []), newCat]);
                      }
                  }

                  const newProd: Product = {
                      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                      status: 'Active',
                      stock: 999,
                      rules: [],
                      productType: action.data.productType || 'Digital Product',
                      ...action.data,
                      category: categoryId || action.data.category || "General",
                      attributes: Array.isArray(action.data.attributes) ? action.data.attributes : [],
                      price: action.data.basePrice || action.data.price
                  };
                  await db.add('products', newProd);
                  setProducts(prev => [...(prev || []), newProd]);
                  showToast(`Product "${newProd.name}" created!`, 'success');
                  break;
          }
      } catch (e) { showToast("AI Action failed.", "error"); }
  };

  if (!user) return <Login onLogin={handleLogin} onRegister={async (u) => { await db.add('users', u); setClients(prev => [...(prev || []), u]); setUser(u); showToast("Registered!", "success"); }} clients={clients} showToast={showToast} />;

  if (user.role === UserRole.ADMIN) {
      const unreadNotifications = (notifications || []).filter(n => !n.read).length;
      return (
          <div className="flex bg-gray-50 dark:bg-slate-950 min-h-screen text-gray-900 dark:text-white transition-colors duration-300">
              <ToastContainer toasts={toasts} onClose={closeToast} />
              
              {isAdminCreateAdOpen && <CreateAdForm clients={clients} socialRequests={socialRequests} onCreateAd={async (a, c) => { await db.add('ads', a); setAds(prev => [...prev, a]); return true; }} onClose={() => setIsAdminCreateAdOpen(false)} />}
              {isAddClientOpen && <AddClientForm onSave={async (u) => { await db.add('users', u); setClients(prev => [...(prev || []), u]); setIsAddClientOpen(false); }} onCancel={() => setIsAddClientOpen(false)} existingClients={clients} />}
              {isSendNotificationOpen && <AdminSendNotification isOpen={isSendNotificationOpen} onClose={() => setIsSendNotificationOpen(false)} users={clients} onSend={handleSendNotification} />}

              <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} pendingRequestsCount={(socialRequests || []).filter(r => r.status === 'Pending').length} pendingPaymentsCount={(transactions || []).filter(t => t.status === 'Pending').length} pendingAdsCount={(ads || []).filter(a => a.status === 'Pending').length} onOpenNotify={() => setIsSendNotificationOpen(true)} />
              
              <main className="flex-1 min-0 h-screen overflow-y-auto">
                  <header className="fixed top-0 left-0 lg:left-64 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 z-40 px-4 md:px-8 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"><Menu className="w-6 h-6"/></button>
                        <div className="flex items-center gap-2" onClick={() => setActiveTab('dashboard')}>
                            <div className="bg-indigo-600 p-2 rounded-xl hidden sm:block shadow-lg shadow-indigo-600/20 cursor-pointer"><LayoutDashboard className="w-5 h-5 text-white"/></div>
                            <span className="text-base md:text-lg font-bold capitalize text-gray-900 dark:text-white cursor-pointer">
                                {typeof activeTab === 'string' ? activeTab.replace('_', ' ') : ''}
                            </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-6">
                        <button onClick={() => setIsChatOpen(true)} className="p-2.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:scale-105 active:scale-95 transition-all relative">
                          <Sparkles className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setNotificationPanelOpen(true)} className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl relative">
                          <Bell className="w-5 h-5"/>
                          {unreadNotifications > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>}
                        </button>
                        <div className="flex items-center gap-3">
                             <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Super Admin</p>
                                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider mt-1">Status: Online</p>
                             </div>
                             <div className="w-10 h-10 rounded-xl border-2 border-indigo-500/50 overflow-hidden bg-indigo-50">
                                <img src={user.avatar} className="w-full h-full object-cover" alt="Admin"/>
                             </div>
                        </div>
                      </div>
                  </header>

                  <div className="p-4 lg:p-8 pt-24 lg:pt-24 max-w-[1600px] mx-auto pb-24">
                      {activeTab === 'dashboard' && <AdminDashboard clientCount={(clients || []).filter(c => c.role === UserRole.USER).length} onOpenChat={() => setIsChatOpen(true)} />}
                      {activeTab === 'unified_requests' && <AdminUnifiedRequests ads={ads} orders={orders} socialRequests={socialRequests} transactions={transactions} users={clients} onUpdateAdStatus={handleUpdateAdStatus} onCreateAd={() => setIsAdminCreateAdOpen(true)} onUpdateOrder={handleUpdateOrder} onUpdateSocialStatus={handleUpdateSocialStatus} onApprovePayment={handleApprovePayment} onRejectPayment={handleRejectPayment} />}
                      {activeTab === 'clients' && <AdminClientList clients={clients} ads={ads} socialRequests={socialRequests} onAccess={(t) => setUser({ ...t, role: UserRole.USER })} onUpdateBalance={handleUpdateBalance} onUpdateClient={(u) => { db.put('users', u); setClients(prev => prev.map(c => c.id === u.id ? u : c)); showToast("Updated!"); }} onAddClient={() => setIsAddClientOpen(true)} />}
                      {activeTab === 'all_ads' && <AdminAllAds ads={ads} clients={clients} onUpdateStatus={handleUpdateAdStatus} onDeleteAd={async (id) => { await db.delete('ads', id); setAds(prev => (prev || []).filter(a => a.id !== id)); }} onCreateAd={() => setIsAdminCreateAdOpen(true)} />}
                      {activeTab === 'ad_requests' && <AdminAdRequests ads={ads} onUpdateStatus={handleUpdateAdStatus} onCreateAd={() => setIsAdminCreateAdOpen(true)} />}
                      {activeTab === 'store_categories' && <CategoryManager />}
                      {activeTab === 'store_variations' && <VariationManager />}
                      {activeTab === 'store_products' && <ProductList products={products} onEditProduct={(p) => { setEditingProduct(p); setActiveTab('store_add'); }} onDeleteProduct={async (id) => { await db.delete('products', id); setProducts(prev => (prev || []).filter(p => p.id !== id)); }} />}
                      {activeTab === 'store_add' && <AddProduct onAddProduct={async (p) => { await db.add('products', p); setProducts(prev => [...(prev || []), p]); setActiveTab('store_products'); }} onUpdateProduct={async (p) => { await db.put('products', p); setProducts(prev => (prev || []).map(pr => pr.id === p.id ? p : pr)); setEditingProduct(null); setActiveTab('store_products'); }} initialProduct={editingProduct} onCancel={() => { setEditingProduct(null); setActiveTab('store_products'); }} />}
                      {activeTab === 'store_orders' && <OrderList orders={(orders || []).filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Delivered')} onUpdateOrder={handleUpdateOrder} />}
                      {activeTab === 'store_history' && <OrderHistory orders={(orders || []).filter(o => o.status === 'Completed' || o.status === 'Cancelled' || o.status === 'Delivered')} />}
                      {activeTab === 'social_requests' && <AdminSocialRequests requests={socialRequests} users={clients} onUpdateStatus={handleUpdateSocialStatus} />}
                      {activeTab === 'pending_payments' && <AdminPendingPayments payments={(transactions || []).filter(t => t.status === 'Pending')} onApprove={handleApprovePayment} onReject={handleRejectPayment} />}
                      {activeTab === 'ai_rules' && <AdminAIRules />}
                      {activeTab === 'settings' && <AdminSettings userData={user} />}
                  </div>
              </main>

              <TrendifyAIChat isGlobalOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} userData={user} allUsers={clients} allAds={ads} allOrders={orders} allProducts={products} allTransactions={transactions} allCategories={categories} allVariations={globalVariations} onAdminAction={handleAIAdminAction} />
              <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} notifications={notifications} onMarkAsRead={(id) => setNotifications(prev => (prev || []).map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications([])} />
          </div>
      );
  }

  // Consistent Exchange Rate logic (Shared across UI)
  const isUserFromBD = (user?.country ?? '').toLowerCase().includes('bangladesh') || 
                   (user?.username ?? '').startsWith('+880') || 
                   (user?.username ?? '').startsWith('01');

  const userExchangeRate = (user?.customExchangeRate && user.customExchangeRate > 0) 
        ? user.customExchangeRate 
        : (isUserFromBD ? exchangeRates.bd : exchangeRates.other);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <UserWallet 
          user={user} 
          isAdminSession={!!realAdminUser && user?.id !== realAdminUser?.id} 
          onLogout={handleLogout} 
          socialRequests={socialRequests || []} 
          onAddSocialRequest={async (r) => { await db.add('socialRequests', r); setSocialRequests(prev => [...(prev || []), r]); }} 
          userAds={(ads || []).filter(a => a.userId === user?.id)} 
          userTransactions={(transactions || []).filter(t => t.userId === user?.id)} 
          onAddFundsRequest={(b, u, m, p) => { 
              if(!user) return;
              const tx: Transaction = { id: `tx-${Date.now()}`, userId: user.id, type: 'DEPOSIT', amount: u, date: new Date().toISOString(), status: 'Pending', bdtAmount: b, paymentMethod: m, transactionProof: p }; 
              db.add('transactions', tx); 
              setTransactions(prev => [tx, ...(prev || [])]); 
          }} 
          globalExchangeRateBD={exchangeRates.bd} 
          globalExchangeRateOther={exchangeRates.other} 
          onCreateAd={(a, c) => { 
              if(!user) return false;
              if ((user.balance || 0) < c) { showToast("Insufficient balance.", "error"); return false; } 
              db.add('ads', a); 
              setAds(prev => [...(prev || []), a]); 
              handleUpdateBalance(user.id, c, 'SPEND', `Ad: ${a.title}`); 
              return true; 
          }} 
          products={products || []} 
          orders={(orders || []).filter(o => o.userId === user?.id)} 
          onPurchase={async (p, finalPriceBDT, i) => { 
              if(!user) return;
              // If finalPriceBDT is provided, it's the dynamic price from StoreFront.
              // Otherwise fallback to p.basePrice
              const price = typeof finalPriceBDT === 'number' ? finalPriceBDT : p.basePrice;
              const priceUsd = price / userExchangeRate; 
              
              if ((user.balance || 0) < priceUsd) { showToast("Insufficient balance.", "error"); return; } 
              if (p.stock <= 0) { showToast("Out of stock.", "error"); return; }

              const dbProduct = await db.get<Product>('products', p.id);
              if (dbProduct) {
                  const updatedProd = { ...dbProduct, stock: Math.max(0, dbProduct.stock - 1) };
                  await db.put('products', updatedProd);
                  setProducts(prev => (prev || []).map(prod => prod.id === p.id ? updatedProd : prod));
              }

              const order: Order = { 
                  id: `ord-${Date.now()}`, 
                  userId: user.id, 
                  userName: user.name, 
                  items: [{ productId: p.id, productName: p.name, quantity: 1, basePrice: p.basePrice, finalPrice: price, price: price, variationId: undefined, variationName: undefined, selectedOptions: {}, customerInput: i }], 
                  totalAmountUSD: priceUsd, 
                  totalAmount: price, 
                  status: 'Pending', 
                  date: new Date().toISOString(), 
                  paymentStatus: 'Paid' 
              }; 
              await db.add('orders', order); 
              setOrders(prev => [order, ...(prev || [])]); 
              handleUpdateBalance(user.id, priceUsd, 'SPEND', `Order: ${p.name}`); 
              return order; 
          }} 
          notifications={(notifications || []).filter(n => n.userId === user?.id)} 
          showToast={showToast}
      />
    </>
  );
}
