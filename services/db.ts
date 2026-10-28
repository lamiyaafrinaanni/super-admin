
import { User, Ad, Transaction, SocialPageRequest, Product, Order, AppSetting, Notification, ApiKeyConfig, AILog, AITrainingData, AuditLog, AIKnowledge, AIMissedQuery, SystemFAQ, BusinessTip, StoreCategory, GlobalVariation, DynamicTool } from '../types';

const DB_NAME = 'AdWalletProDB';
const DB_VERSION = 14; // Incremented for Dynamic Tools Store

interface DBSchema {
  users: User;
  ads: Ad;
  transactions: Transaction;
  socialRequests: SocialPageRequest;
  products: Product;
  orders: Order;
  settings: AppSetting;
  categories: StoreCategory;
  global_variations: GlobalVariation;
  notifications: Notification;
  api_keys: ApiKeyConfig;
  ai_logs: AILog;
  ai_training: AITrainingData;
  audit_logs: AuditLog;
  ai_knowledge: AIKnowledge;
  missed_queries: AIMissedQuery;
  system_faqs: SystemFAQ;
  business_tips: BusinessTip;
  dynamic_tools: DynamicTool;
}

type StoreName = keyof DBSchema;

class DBService {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ads')) db.createObjectStore('ads', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('socialRequests')) db.createObjectStore('socialRequests', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('global_variations')) db.createObjectStore('global_variations', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('notifications')) db.createObjectStore('notifications', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('api_keys')) db.createObjectStore('api_keys', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ai_logs')) db.createObjectStore('ai_logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ai_training')) db.createObjectStore('ai_training', { keyPath: 'userId' });
        if (!db.objectStoreNames.contains('audit_logs')) db.createObjectStore('audit_logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ai_knowledge')) db.createObjectStore('ai_knowledge', { keyPath: 'userId' });
        if (!db.objectStoreNames.contains('missed_queries')) db.createObjectStore('missed_queries', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('system_faqs')) db.createObjectStore('system_faqs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('business_tips')) db.createObjectStore('business_tips', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('dynamic_tools')) db.createObjectStore('dynamic_tools', { keyPath: 'id' });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private getTransaction(storeName: StoreName, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T>(storeName: StoreName, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: StoreName, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.put(item); 
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: StoreName): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DBService();
