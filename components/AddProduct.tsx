
import React, { useState, useEffect, useRef } from 'react';
import { Product, StoreAttribute, StoreCategory, ProductRequirement, RequirementFieldType } from '../types';
import { db } from '../services/db';
/* Fix: Added missing icon imports Package, Type, and CheckSquare */
import { Image, Sliders, Save, List, CheckCircle, Plus, Trash, Edit, X, Info, ChevronDown, ChevronUp, FileText, Phone, Mail, Globe, Hash, Package, Type, CheckSquare } from './Icons';

export interface AddProductProps {
    onAddProduct: (product: Product) => void;
    onUpdateProduct?: (product: Product) => void;
    initialProduct?: Product | null;
    onCancel?: () => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ onAddProduct, onUpdateProduct, initialProduct, onCancel }) => {
    // Basic Info
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [productType, setProductType] = useState<'Digital Product' | 'Subscription' | 'Service'>('Digital Product');
    const [basePrice, setBasePrice] = useState<number>(0);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
    const editorRef = useRef<HTMLDivElement>(null);

    // Attribute Selection Logic
    const [attributesPool, setAttributesPool] = useState<StoreAttribute[]>([]);
    const [selectedAttributes, setSelectedAttributes] = useState<StoreAttribute[]>([]);
    const [categoriesPool, setCategoriesPool] = useState<StoreCategory[]>([]);

    // Requirements Builder States
    const [requirements, setRequirements] = useState<ProductRequirement[]>([]);
    const [editingReqId, setEditingReqId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const attrs = await db.getAll<StoreAttribute>('global_variations' as any);
        const cats = await db.getAll<StoreCategory>('categories');
        setAttributesPool(attrs);
        setCategoriesPool(cats);

        if (initialProduct) {
            setName(initialProduct.name);
            setCategory(initialProduct.category);
            setProductType(initialProduct.productType);
            setBasePrice(initialProduct.basePrice);
            setMinPrice(initialProduct.minPrice);
            setImage(initialProduct.image);
            setDescription(initialProduct.description);
            setStatus(initialProduct.status);
            setSelectedAttributes(initialProduct.attributes || []);
            setRequirements(initialProduct.requirements || []);
            if (editorRef.current) editorRef.current.innerHTML = initialProduct.description;
        }
    };

    const toggleAttribute = (attr: StoreAttribute) => {
        const exists = selectedAttributes.find(a => a.id === attr.id);
        if (exists) {
            setSelectedAttributes(selectedAttributes.filter(a => a.id !== attr.id));
        } else {
            setSelectedAttributes([...selectedAttributes, attr]);
        }
    };

    // Requirements Helper Functions
    const addRequirement = (type: RequirementFieldType) => {
        const newReq: ProductRequirement = {
            id: `req-${Date.now()}`,
            label: `New ${type} field`,
            type,
            placeholder: `Enter ${type}...`,
            isRequired: true,
            options: (type === 'dropdown' || type === 'checkbox') ? ['Option 1'] : undefined
        };
        setRequirements([...requirements, newReq]);
        setEditingReqId(newReq.id);
    };

    const updateRequirement = (id: string, updates: Partial<ProductRequirement>) => {
        setRequirements(requirements.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const removeRequirement = (id: string) => {
        setRequirements(requirements.filter(r => r.id !== id));
        if (editingReqId === id) setEditingReqId(null);
    };

    const moveRequirement = (index: number, direction: 'up' | 'down') => {
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= requirements.length) return;
        const updated = [...requirements];
        const temp = updated[index];
        updated[index] = updated[nextIndex];
        updated[nextIndex] = temp;
        setRequirements(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) return alert("Please select a category.");

        const productData: Product = {
            id: initialProduct?.id || `prod-${Date.now()}`,
            name,
            productType,
            basePrice,
            price: basePrice,
            minPrice: minPrice || basePrice,
            category,
            image: image || 'https://via.placeholder.com/150',
            description,
            status,
            attributes: selectedAttributes,
            requirements,
            rules: [],
            stock: 999
        };

        if (initialProduct && onUpdateProduct) {
            onUpdateProduct(productData);
        } else {
            onAddProduct(productData);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-32">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Package className="w-7 h-7 text-indigo-600"/>
                    {initialProduct ? 'Edit Catalog Item' : 'New Catalog Item'}
                </h2>
                {onCancel && (
                    <button 
                        onClick={onCancel} 
                        className="px-5 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Product Identity</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-gray-900 dark:text-white shadow-inner" 
                                    placeholder="e.g. Amazon AWS Account 1 Year"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category Group</label>
                                <select 
                                    required 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl outline-none font-bold text-sm text-gray-900 dark:text-white appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="">Choose Category...</option>
                                    {categoriesPool.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fulfillment Type</label>
                                <select 
                                    required 
                                    value={productType} 
                                    onChange={e => setProductType(e.target.value as any)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl outline-none font-bold text-sm text-gray-900 dark:text-white appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="Digital Product">Digital Product</option>
                                    <option value="Subscription">Subscription</option>
                                    <option value="Service">Agency Service</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-white/5">
                            <div>
                                <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 ml-1">Base Price (৳)</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={basePrice} 
                                    onChange={e => setBasePrice(parseFloat(e.target.value))} 
                                    className="w-full px-5 py-4 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-2xl text-indigo-700 dark:text-indigo-400 shadow-sm" 
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-red-500 uppercase tracking-widest mb-2 ml-1">Minimum Floor (৳)</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={minPrice} 
                                    onChange={e => setMinPrice(parseFloat(e.target.value))} 
                                    className="w-full px-5 py-4 bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-black text-2xl text-red-700 dark:text-red-400 shadow-sm" 
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Requirement Builder Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="p-6 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                             <div>
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600"/>
                                    Requirement for Buy This
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">কেনার আগে গ্রাহককে যে তথ্যগুলো দিতে হবে তা এখান থেকে তৈরি করুন</p>
                             </div>
                             <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">{requirements.length} Fields Built</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[400px]">
                            {/* Panel: Elements */}
                            <div className="md:col-span-1 border-r border-gray-100 dark:border-white/5 p-5 space-y-4 bg-gray-50/50 dark:bg-black/20">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Elements Library</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <button type="button" onClick={() => addRequirement('text')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><Type className="w-4 h-4 text-indigo-500"/> Short Text</button>
                                    <button type="button" onClick={() => addRequirement('textarea')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><FileText className="w-4 h-4 text-purple-500"/> Text Area</button>
                                    <button type="button" onClick={() => addRequirement('email')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><Mail className="w-4 h-4 text-red-500"/> Email Address</button>
                                    <button type="button" onClick={() => addRequirement('tel')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><Phone className="w-4 h-4 text-green-500"/> Mobile No</button>
                                    <button type="button" onClick={() => addRequirement('url')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><Globe className="w-4 h-4 text-blue-500"/> Link / URL</button>
                                    <button type="button" onClick={() => addRequirement('dropdown')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><ChevronDown className="w-4 h-4 text-orange-500"/> Dropdown</button>
                                    <button type="button" onClick={() => addRequirement('checkbox')} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"><CheckSquare className="w-4 h-4 text-pink-500"/> Checkboxes</button>
                                </div>
                            </div>

                            {/* Panel: Form Preview/Config */}
                            <div className="md:col-span-3 p-8 bg-white dark:bg-transparent">
                                {requirements.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Plus className="w-8 h-8 text-gray-400"/>
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Drag or Click elements to start building your purchase form.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {requirements.map((req, idx) => (
                                            <div key={req.id} className={`p-4 rounded-2xl border transition-all ${editingReqId === req.id ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/5' : 'border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-indigo-100 dark:bg-white/10 rounded text-[10px] flex items-center justify-center font-black text-indigo-600">{idx + 1}</div>
                                                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded">{req.type}</span>
                                                        {req.isRequired && <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button type="button" onClick={() => moveRequirement(idx, 'up')} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400"><ChevronUp className="w-4 h-4"/></button>
                                                        <button type="button" onClick={() => moveRequirement(idx, 'down')} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400"><ChevronDown className="w-4 h-4"/></button>
                                                        <button type="button" onClick={() => setEditingReqId(editingReqId === req.id ? null : req.id)} className={`p-1.5 rounded-lg transition-colors ${editingReqId === req.id ? 'text-indigo-600 bg-white' : 'text-gray-400 hover:text-indigo-600'}`}><Edit className="w-4 h-4"/></button>
                                                        <button type="button" onClick={() => removeRequirement(req.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"><Trash className="w-4 h-4"/></button>
                                                    </div>
                                                </div>

                                                {editingReqId === req.id ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Field Label</label>
                                                            <input type="text" value={req.label} onChange={e => updateRequirement(req.id, { label: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"/>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Placeholder</label>
                                                            <input type="text" value={req.placeholder} onChange={e => updateRequirement(req.id, { placeholder: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                                                        </div>
                                                        <div className="flex items-end pb-1">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input type="checkbox" checked={req.isRequired} onChange={e => updateRequirement(req.id, { isRequired: e.target.checked })} className="w-4 h-4 accent-indigo-600 rounded"/>
                                                                <span className="text-xs font-black uppercase text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">Is Mandatory?</span>
                                                            </label>
                                                        </div>
                                                        {(req.type === 'dropdown' || req.type === 'checkbox') && (
                                                            <div className="md:col-span-2 space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block">Options (Comma separated)</label>
                                                                <textarea 
                                                                    rows={2} 
                                                                    value={req.options?.join(', ')} 
                                                                    onChange={e => updateRequirement(req.id, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} 
                                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                                                    placeholder="Basic, Premium, Enterprise"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-1">
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{req.label}</p>
                                                        <p className="text-xs text-gray-400 italic mt-0.5">{req.placeholder}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rich Description */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description & Details</span>
                        </div>
                        <div ref={editorRef} className="flex-1 px-8 py-6 outline-none text-gray-800 dark:text-gray-200 text-sm leading-relaxed" contentEditable onInput={(e) => setDescription(e.currentTarget.innerHTML)} suppressContentEditableWarning={true} />
                    </div>
                </div>

                {/* Right Column: Attribute Builder & Media */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Media */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Item Preview Media</label>
                        <div className="aspect-square w-full bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                            {image ? (
                                <img src={image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview"/>
                            ) : <Image className="w-16 h-16 text-gray-200 dark:text-gray-800"/>}
                        </div>
                        <input 
                            type="text" 
                            value={image} 
                            onChange={e => setImage(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-mono text-gray-600 dark:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                            placeholder="Paste Image URL here..."
                        />
                    </div>

                    {/* Attribute Selector */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-500"/> Global Variations
                            </label>
                            <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{selectedAttributes.length} Active</span>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {attributesPool.length === 0 ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-black/20 p-8 rounded-2xl text-center border border-dashed border-gray-200 dark:border-white/5">No global templates found.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {attributesPool.map(attr => (
                                        <div 
                                            key={attr.id} onClick={() => toggleAttribute(attr)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                                                selectedAttributes.find(a => a.id === attr.id)
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-x-1'
                                                : 'bg-gray-50 dark:bg-black/30 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${selectedAttributes.find(a => a.id === attr.id) ? 'bg-white/20' : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 shadow-sm'}`}>
                                                    <List className="w-4 h-4"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-tight">{attr.name}</p>
                                                    <p className={`text-[9px] font-black uppercase tracking-tighter mt-0.5 ${selectedAttributes.find(a => a.id === attr.id) ? 'text-indigo-100' : 'text-gray-400'}`}>{attr.type}</p>
                                                </div>
                                            </div>
                                            {selectedAttributes.find(a => a.id === attr.id) ? <CheckCircle className="w-5 h-5"/> : <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Publish Actions */}
                    <div className="space-y-4">
                        <button 
                            type="submit" 
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-600/30 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <Save className="w-5 h-5"/> {initialProduct ? 'Update Product' : 'Publish Product'}
                        </button>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
                            <button type="button" onClick={() => setStatus('Active')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'Active' ? 'bg-white dark:bg-white/10 text-green-600 shadow-md' : 'text-gray-400'}`}>Public</button>
                            <button type="button" onClick={() => setStatus('Inactive')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'Inactive' ? 'bg-white dark:bg-white/10 text-red-500 shadow-md' : 'text-gray-400'}`}>Hidden</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
