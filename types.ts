
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum AdStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  PAUSED = 'Paused',
  COMPLETED = 'Completed'
}

export enum SocialPlatform {
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok'
}

export enum SocialRequestStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected'
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export interface User {
  id: string;
  name: string;
  username: string; 
  country?: string;
  role: UserRole;
  avatar: string;
  balance?: number;
  kycStatus?: 'Verified' | 'Pending' | 'Unverified';
  password?: string;
  customExchangeRate?: number;
  businessCategory?: string;
  forcedModel?: string;
  secondaryMobile?: string;
  address?: string;
  companyName?: string;
  businessCountry?: string;
  businessDescription?: string;
  paymentSystemDesc?: string;
  website?: string;
}

export interface Ad {
  id: string;
  userId: string;
  title: string;
  content: string;
  platform: SocialPlatform;
  status: AdStatus;
  userName: string;
  date: string;
  budget: number;
  dailyBudget?: number;
  duration?: number;
  spent?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'SPEND' | 'REFUND';
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  note?: string;
  paymentMethod?: 'MANUAL' | 'AUTO';
  bdtAmount?: number;
  transactionProof?: string;
}

// --- ADVANCED STORE INFRASTRUCTURE ---

export type AttributeType = 'dropdown' | 'radio' | 'checkbox' | 'number' | 'toggle' | 'text';
export type PriceImpactType = 'fixed' | 'percentage';

export interface StoreAttributeOption {
    id: string;
    label: string;
    priceImpact: number; // e.g. +500 or -10
    impactType: PriceImpactType;
    isDefault?: boolean;
}

export interface StoreAttribute {
    id: string;
    name: string;
    type: AttributeType;
    options: StoreAttributeOption[];
    isRequired: boolean;
    minValue?: number; // for number type
    maxValue?: number; // for number type
    unitPrice?: number; // for number type multiplication
    placeholder?: string;
}

export interface StoreRule {
    id: string;
    conditionAttrId: string;
    conditionValue: string; // The option ID that triggers this
    action: 'show' | 'hide' | 'enable' | 'disable';
    targetAttrId: string;
}

export interface StoreCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

export type RequirementFieldType = 'text' | 'email' | 'tel' | 'dropdown' | 'checkbox' | 'textarea' | 'url';

export interface ProductRequirement {
    id: string;
    label: string;
    type: RequirementFieldType;
    placeholder?: string;
    isRequired: boolean;
    options?: string[]; // For dropdown/checkbox
}

export interface Product {
  id: string;
  name: string;
  productType: 'Digital Product' | 'Subscription' | 'Service';
  basePrice: number; // Base price in BDT
  minPrice: number;  // Floor price for AI
  category: string;  // Category ID
  image: string;
  description: string;
  status: 'Active' | 'Inactive';
  attributes: StoreAttribute[]; // Linked attributes for this product
  rules: StoreRule[]; // Pricing/Visibility rules
  stock: number;
  /* Added price as alias for components */
  price: number;
  /* Added variations */
  variations?: ProductVariation[];
  /* Added features */
  features?: ServiceFeature[];
  /* Added requirementType */
  requirementType?: string;
  /* Added processingEndTime */
  processingEndTime?: string;
  /* Added custom requirements builder */
  requirements?: ProductRequirement[];
}

export interface ProductVariation {
    id: string;
    name: string;
    price: number;
}

export interface GlobalVariation extends StoreAttribute {}

export interface ServiceFeature {
    text: string;
    icon: 'check' | 'cross';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  selectedOptions: Record<string, any>; // AttrId -> Selected Value(s)
  productType?: 'Digital Product' | 'Subscription' | 'Service';
  /* Added price */
  price: number;
  /* Added variation info */
  variationId?: string;
  variationName?: string;
  /* Added customer input */
  customerInput?: Record<string, any>;
  /* Added subscription expiry */
  subscriptionExpiryDate?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmountUSD: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'On Hold' | 'Delivered';
  date: string;
  paymentStatus: 'Paid' | 'Unpaid';
  deliveryContent?: string;
  deliveryNote?: string;
  /* Added totalAmount and processingEndTime */
  totalAmount: number;
  processingEndTime?: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
}

export interface AIKnowledge {
    userId: string;
    identitySummary: string;
    businessProfile: string;
    marketingStrategy: string;
    lastUpdated: string;
    insights: { source: string; note: string; timestamp: string }[];
}

export interface ApiKeyConfig {
    id: string;
    provider: 'google' | 'openrouter';
    key: string;
    label: string;
    dailyLimit: number;
    usedToday: number;
    errorCount: number;
    status: 'active' | 'cooldown' | 'quota_exceeded' | 'error';
    /* Added createdDate */
    createdDate?: string;
}

export interface AppSetting {
    id: string;
    value: any;
}

export interface AIActionPayload {
    type: string;
    data: any;
}

export interface SocialPageRequest {
  id: string;
  userId: string;
  userName: string;
  platform: SocialPlatform;
  pageName: string;
  pageId?: string;
  pageUrl: string;
  status: SocialRequestStatus;
  date: string;
  loginId?: string;
  loginPassword?: string;
  pageProfilePhoto?: string;
  pageCategory?: string;
  pageBio?: string;
  pageCoverPhoto?: string;
  followersCount?: number;
  isVerifiedBadge?: boolean;
  recentPosts?: any[];
  recentPhotos?: string[];
  pageCountry?: string;
}

export interface PagePostPreview {
    id: string;
    type: 'IMAGE' | 'VIDEO' | 'text' | 'image' | 'video';
    thumbnail: string;
    caption: string;
    date: string;
    url: string;
    likes?: number;
    comments?: number;
}

export interface AILog {
    id: string;
    userId?: string;
    model: string;
    provider: string;
    latency: number;
    success: boolean;
    timestamp: string;
    prompt?: string;
    response?: string;
}

export interface AITrainingData {
    userId: string;
    data: any;
}

export interface SimulationConfig {
    id: string;
    value: any;
}

export interface AuditLog {
    id: string;
    action: string;
    timestamp: string;
}

export interface AIConfig {
    id: string;
    value: any;
}

export interface AIMissedQuery {
    id: string;
    query: string;
    timestamp: string;
}

export interface SystemFAQ {
    id: string;
    question: string;
    answer: string;
}

export interface BusinessTip {
    id: string;
    tip: string;
}

export interface ChatSessionState {
    id: string;
    history: any[];
}

export interface ScraperApiConfig {
    id: string;
    label: string;
    rapidApiKey: string;
    rapidApiHost: string;
    baseUrl: string;
    status: 'active' | 'inactive';
}

export interface DynamicTool {
    id: string;
    name: string;
    description: string;
    baseUrl: string;
    host: string;
    queryParams: string[];
    lastStatus?: 'idle' | 'success' | 'error';
}

export interface ScraperAssignment {
    task: 'PAGE_DETAILS' | 'PAGE_POSTS';
    toolId: string;
}

export enum AIAutoActionType {
    NAVIGATE = 'NAVIGATE',
    OPEN_ADD_FUNDS = 'OPEN_ADD_FUNDS',
    CONNECT_SOCIAL = 'CONNECT_SOCIAL'
}

export interface AIAutoAction {
    type: AIAutoActionType;
    data?: any;
    target?: string;
}
