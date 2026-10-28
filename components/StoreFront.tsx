
import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, StoreAttribute, StoreAttributeOption, AttributeType, PriceImpactType, StoreCategory, ProductRequirement } from '../types';
import { Search, ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, Package, Clock, X, Sliders, AlertCircle, CheckSquare, Sparkles, Plus, ArrowLeft, Filter, Globe, CreditCard, Briefcase, Zap, Check, FileText, Mail, Phone, Type } from './Icons';
import { db } from '../services/db';

interface StoreFrontProps {
    products: Product[];
    user: User;
    onAddToCart: (product: Product, selectedOptions: Record<string, any>, finalPriceBDT: number, customerInput?: Record<string, any>) => void;
    socialRequests: any[];
    pageTitle?: string;
    onNavigate?: (path: string) => void;
    exchangeRate: number;
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const HERO_SLIDES = [
    { id: 1, title: "Boost Your Business", subtitle: "Professional Ad Management", bg: "bg-indigo-600", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop" },
    { id: 2, title: "Verified Accounts", subtitle: "Global Ready Assets", bg: "bg-slate-800", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop" }
];

export const StoreFront: React.FC<StoreFrontProps> = ({ products, user, onAddToCart, exchangeRate, showToast }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [priceFilter, setPriceFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'GRID' | 'DETAIL'>('GRID');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selections, setSelections] = useState<Record<string, any>>({});
    const [customerInput, setCustomerInput] = useState<Record<string, any>>({});
    const [finalPrice, setFinalPrice] = useState<number>(0);

    useEffect(() => {
        const loadCategories = async () => { setCategories(await db.getAll<StoreCategory>('categories') || []); };
        loadCategories();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => { setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length); }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Helper to calculate Min and Max price for a product based on its variations
    const getProductPriceRange = (product: Product) => {
        let min = Number(product.basePrice || 0);
        let max = Number(product.basePrice || 0);
        const attrs = Array.isArray(product.attributes) ? product.attributes : [];

        attrs.forEach(attr => {
            const opts = Array.isArray(attr.options) ? attr.options : [];
            if (opts.length === 0) return;

            const impacts = opts.map(o => {
                const impactVal = Number(o.priceImpact || 0);
                if (o.impactType === 'fixed') return impactVal;
                return (Number(product.basePrice) * impactVal) / 100;
            });

            if (attr.isRequired) {
                min += Math.min(...impacts);
                max += Math.max(...impacts);
            } else {
                // If not required, user can choose none (0 impact)
                min += Math.min(0, ...impacts);
                max += Math.max(0, ...impacts);
            }
        });

        return { min, max };
    };

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return (products || []).filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(query);
            const catObj = (categories || []).find(c => c.id === p.category);
            const matchesCategory = selectedCategory === 'All' || catObj?.name === selectedCategory || p.category === selectedCategory;
            
            const { min } = getProductPriceRange(p);
            let matchesPrice = true;
            if (priceFilter === 'Low') matchesPrice = min < 500;
            else if (priceFilter === 'Mid') matchesPrice = min >= 500 && min <= 2000;
            else if (priceFilter === 'High') matchesPrice = min > 2000;
            
            return matchesSearch && matchesCategory && matchesPrice && p.status === 'Active';
        });
    }, [products, searchQuery, selectedCategory, priceFilter, categories]);

    useEffect(() => {
        if (!selectedProduct) return;
        
        let calculatedPrice = Number(selectedProduct.basePrice || 0);
        const attrs = Array.isArray(selectedProduct.attributes) ? selectedProduct.attributes : [];

        attrs.forEach(attr => {
            const selectedVal = selections[attr.id];
            if (selectedVal === undefined || selectedVal === null || selectedVal === '') return;

            const opts = Array.isArray(attr.options) ? attr.options : [];
            if (attr.type === 'dropdown' || attr.type === 'radio') {
                const option = opts.find(o => o.id === selectedVal);
                if (option) {
                    const impact = Number(option.priceImpact || 0);
                    if (option.impactType === 'fixed') calculatedPrice += impact;
                    else calculatedPrice += (Number(selectedProduct.basePrice) * (impact / 100));
                }
            } else if (attr.type === 'checkbox' && Array.isArray(selectedVal)) {
                selectedVal.forEach(optId => {
                    const option = opts.find(o => o.id === optId);
                    if (option) {
                        const impact = Number(option.priceImpact || 0);
                        if (option.impactType === 'fixed') calculatedPrice += impact;
                        else calculatedPrice += (Number(selectedProduct.basePrice) * (impact / 100));
                    }
                });
            } else if (attr.type === 'number') {
                const qty = Number(selectedVal) || 0;
                if (attr.unitPrice) calculatedPrice += (qty * Number(attr.unitPrice));
            } else if (attr.type === 'toggle' && selectedVal === true) {
                const option = opts[0];
                if (option) {
                    const impact = Number(option.priceImpact || 0);
                    if (option.impactType === 'fixed') calculatedPrice += impact;
                    else calculatedPrice += (Number(selectedProduct.basePrice) * (impact / 100));
                }
            }
        });
        
        setFinalPrice(calculatedPrice);
    }, [selections, selectedProduct]);

    const handleProductClick = (p: Product) => {
        if (p.stock <= 0) { showToast?.("স্টক আউট।", "warning"); return; }
        setSelectedProduct(p);
        
        // Setup default selections for variations
        const defaults: Record<string, any> = {};
        const attrs = Array.isArray(p.attributes) ? p.attributes : [];
        attrs.forEach(a => {
            const def = Array.isArray(a.options) ? a.options.find(o => o.isDefault) : null;
            if (def) defaults[a.id] = def.id;
            else if (a.type === 'checkbox') defaults[a.id] = [];
            else if (a.type === 'number') defaults[a.id] = a.minValue || 1;
            else if (a.type === 'toggle') defaults[a.id] = false;
            else if (a.type === 'text') defaults[a.id] = '';
        });
        setSelections(defaults);

        // Setup empty requirements input
        const initialReqs: Record<string, any> = {};
        const reqs = p.requirements || [];
        reqs.forEach(r => {
            if (r.type === 'checkbox') initialReqs[r.id] = [];
            else initialReqs[r.id] = '';
        });
        setCustomerInput(initialReqs);

        setViewMode('DETAIL');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectionChange = (attrId: string, value: any) => {
        setSelections(prev => ({ ...prev, [attrId]: value }));
    };

    const handleCustomerInputChange = (reqId: string, value: any) => {
        setCustomerInput(prev => ({ ...prev, [reqId]: value }));
    };

    const handlePurchase = () => {
        if (!selectedProduct) return;
        
        // 1. Check required attributes (variations)
        const attrs = Array.isArray(selectedProduct.attributes) ? selectedProduct.attributes : [];
        const missingAttr = attrs.some(attr => {
            if (!attr.isRequired) return false;
            const val = selections[attr.id];
            if (attr.type === 'checkbox') return !val || val.length === 0;
            if (attr.type === 'text') return !val || !val.trim();
            return val === undefined || val === null || val === '';
        });
        if (missingAttr) { showToast?.("সকল ভেরিয়েশন অপশন সিলেক্ট করুন।", "warning"); return; }

        // 2. Check required custom requirements
        const reqs = selectedProduct.requirements || [];
        const missingReq = reqs.some(r => {
            if (!r.isRequired) return false;
            const val = customerInput[r.id];
            if (r.type === 'checkbox') return !val || val.length === 0;
            if (typeof val === 'string') return !val.trim();
            return !val;
        });
        if (missingReq) { showToast?.("অনুগ্রহ করে সকল রিকোয়ারমেন্ট তথ্য প্রদান করুন।", "warning"); return; }

        onAddToCart(selectedProduct, selections, finalPrice, customerInput);
        setViewMode('GRID');
    };

    const RequirementField = ({ req }: { req: ProductRequirement }) => {
        const val = customerInput[req.id];
        
        switch (req.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                return (
                    <input 
                        type={req.type}
                        value={val || ''}
                        onChange={e => handleCustomerInputChange(req.id, e.target.value)}
                        placeholder={req.placeholder}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                );
            case 'textarea':
                return (
                    <textarea 
                        rows={3}
                        value={val || ''}
                        onChange={e => handleCustomerInputChange(req.id, e.target.value)}
                        placeholder={req.placeholder}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                );
            case 'dropdown':
                return (
                    <select 
                        value={val || ''}
                        onChange={e => handleCustomerInputChange(req.id, e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="">Choose an option...</option>
                        {req.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {req.options?.map(opt => {
                            const isChecked = (val || []).includes(opt);
                            return (
                                <button 
                                    key={opt}
                                    onClick={() => {
                                        const next = isChecked ? val.filter((v:any) => v !== opt) : [...(val || []), opt];
                                        handleCustomerInputChange(req.id, next);
                                    }}
                                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                        {isChecked && <Check className="w-2.5 h-2.5"/>}
                                    </div>
                                    <span className="text-xs font-bold">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            default: return null;
        }
    };

    if (viewMode === 'DETAIL' && selectedProduct) {
        const attrs = Array.isArray(selectedProduct.attributes) ? selectedProduct.attributes : [];
        const reqs = selectedProduct.requirements || [];

        return (
            <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4">
                <div className="flex items-center gap-4 mb-8 pt-4">
                    <button onClick={() => setViewMode('GRID')} className="p-2 border border-gray-200 dark:border-white/10 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2 font-bold active:scale-95 text-xs"><ArrowLeft className="w-4 h-4"/> Back</button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-white/10"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{selectedProduct.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="aspect-square bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-white/5 overflow-hidden rounded-2xl">
                            <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name}/>
                        </div>
                        <div className="p-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedProduct.name}</h1>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-indigo-200 dark:border-indigo-500/20">{selectedProduct.category}</span>
                                <span className="text-xs text-gray-400 font-bold ml-auto">Stock: {selectedProduct.stock}</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: selectedProduct.description}}></div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-white/5 pb-4">Configuration</h3>
                            <div className="space-y-8">
                                {/* CUSTOM REQUIREMENTS FORM */}
                                {reqs.length > 0 && (
                                    <div className="bg-gray-50/50 dark:bg-black/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-indigo-600"/>
                                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Requirement Information</span>
                                        </div>
                                        {reqs.map(r => (
                                            <div key={r.id} className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter block ml-1">
                                                    {r.label} {r.isRequired && <span className="text-red-500 font-bold">*</span>}
                                                </label>
                                                <RequirementField req={r} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* VARIATIONS / ATTRIBUTES */}
                                {attrs.length > 0 ? (
                                    <div className="space-y-8">
                                        {attrs.map(attr => {
                                            const opts = Array.isArray(attr.options) ? attr.options : [];
                                            return (
                                                <div key={attr.id} className="space-y-3">
                                                    <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                                        {attr.name} {attr.isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
                                                    </label>
                                                    
                                                    {attr.type === 'dropdown' && (
                                                        <select 
                                                            value={selections[attr.id] || ''} 
                                                            onChange={e => handleSelectionChange(attr.id, e.target.value)} 
                                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                                        >
                                                            <option value="">Select Option...</option>
                                                            {opts.map(opt => (
                                                                <option key={opt.id} value={opt.id}>
                                                                    {opt.label} ({opt.priceImpact > 0 ? '+' : ''}{opt.priceImpact}{opt.impactType === 'fixed' ? '৳' : '%'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {attr.type === 'radio' && (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {opts.map(opt => (
                                                                <button 
                                                                    key={opt.id} 
                                                                    onClick={() => handleSelectionChange(attr.id, opt.id)} 
                                                                    className={`p-4 border rounded-xl text-left transition-all flex justify-between items-center ${selections[attr.id] === opt.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/20' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600'}`}
                                                                >
                                                                    <span className="font-bold text-sm">{opt.label}</span>
                                                                    <span className="text-xs font-mono opacity-60">{opt.priceImpact > 0 ? '+' : ''}{opt.priceImpact}{opt.impactType === 'fixed' ? '৳' : '%'}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {attr.type === 'checkbox' && (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {opts.map(opt => {
                                                                const current = selections[attr.id] || [];
                                                                const isSelected = current.includes(opt.id);
                                                                return (
                                                                    <button 
                                                                        key={opt.id} 
                                                                        onClick={() => {
                                                                            const newVal = isSelected ? current.filter((i:any) => i !== opt.id) : [...current, opt.id];
                                                                            handleSelectionChange(attr.id, newVal);
                                                                        }} 
                                                                        className={`p-4 border rounded-xl text-left transition-all flex justify-between items-center ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-700'}`}>{isSelected && <Check className="w-3.5 h-3.5"/>}</div>
                                                                            <span className="font-bold text-sm">{opt.label}</span>
                                                                        </div>
                                                                        <span className="text-xs font-mono opacity-60">{opt.priceImpact > 0 ? '+' : ''}{opt.priceImpact}{opt.impactType === 'fixed' ? '৳' : '%'}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {attr.type === 'text' && (
                                                        <input 
                                                            type="text" 
                                                            value={selections[attr.id] || ''} 
                                                            onChange={e => handleSelectionChange(attr.id, e.target.value)} 
                                                            placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}...`} 
                                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        />
                                                    )}

                                                    {attr.type === 'number' && (
                                                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2">
                                                            <button onClick={() => handleSelectionChange(attr.id, Math.max(attr.minValue || 0, (Number(selections[attr.id]) || 0) - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center font-bold text-xl hover:bg-gray-100 transition-colors">-</button>
                                                            <input 
                                                                type="number" 
                                                                value={selections[attr.id] || 0} 
                                                                onChange={e => handleSelectionChange(attr.id, Number(e.target.value) || 0)} 
                                                                className="flex-1 bg-transparent text-center font-black text-lg outline-none"
                                                            />
                                                            <button onClick={() => handleSelectionChange(attr.id, Math.min(attr.maxValue || 9999, (Number(selections[attr.id]) || 0) + 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center font-bold text-xl hover:bg-gray-100 transition-colors">+</button>
                                                        </div>
                                                    )}

                                                    {attr.type === 'toggle' && (
                                                        <button onClick={() => handleSelectionChange(attr.id, !selections[attr.id])} className="flex items-center gap-3 group">
                                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${selections[attr.id] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${selections[attr.id] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selections[attr.id] ? 'Enabled' : 'Disabled'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    reqs.length === 0 && <p className="text-sm text-gray-500 italic">No variations or info needed for this item.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-900 dark:bg-white p-6 rounded-3xl text-white dark:text-black flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">Total Payable</p>
                                <h4 className="text-3xl font-black">৳{Math.round(finalPrice || 0).toLocaleString()}</h4>
                                <p className="text-[10px] font-mono opacity-60 mt-1">${((finalPrice || 0) / (exchangeRate || 1)).toFixed(2)} USD</p>
                            </div>
                            <button onClick={handlePurchase} className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white border-none rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Order Now</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="relative w-full h-[240px] md:h-[350px] overflow-hidden bg-gray-100 mb-8 rounded-3xl">
                {HERO_SLIDES.map((slide, index) => (
                    <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 flex items-center px-8 md:px-20 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={slide.image} className="absolute inset-0 w-full h-full object-cover opacity-60" alt=""/>
                        <div className="relative z-20 max-w-lg">
                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.3em] mb-3">{slide.subtitle}</p>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">{slide.title}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(filteredProducts || []).map(p => {
                    const { min, max } = getProductPriceRange(p);
                    const isRange = min !== max;

                    return (
                        <div key={p.id} onClick={() => handleProductClick(p)} className={`bg-white dark:bg-slate-900 p-4 rounded-3xl cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full relative border border-gray-200 dark:border-white/10 ${p.stock <= 0 ? 'opacity-70 grayscale' : ''}`}>
                            {p.stock <= 0 && (
                                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-lg">Out of Stock</div>
                            )}
                            <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 mb-4 rounded-2xl overflow-hidden">
                                <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt=""/>
                            </div>
                            <div className="flex-1 space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">{p.name}</h4>
                                <div className="flex flex-col">
                                    {isRange ? (
                                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                            ৳{min.toLocaleString()} - {max.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                            ৳{min.toLocaleString()}
                                        </p>
                                    )}
                                    {((p.attributes && p.attributes.length > 0) || (p.requirements && p.requirements.length > 0)) && (
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Variations Available</span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                                 <button className="w-full py-2 bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all rounded-xl">View Details</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
