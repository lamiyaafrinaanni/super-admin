
import React, { useState, useEffect } from 'react';
import { Product, StoreCategory } from '../../types';
import { Package, Search, Clock, Edit, Trash } from '../Icons';
import { db } from '../../services/db';

interface ProductListProps {
    products: Product[];
    onUpdateProduct?: (product: Product) => void;
    onDeleteProduct?: (id: string) => void;
    onEditProduct?: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
    products,
    onDeleteProduct,
    onEditProduct
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    
    // Average reference rate for Admin display
    const REF_RATE = 120; 

    useEffect(() => {
        db.getAll<StoreCategory>('categories').then(setCategories);
    }, []);

    const uniqueCategories = ['All', ...categories.map(c => c.name || 'Uncategorized')];

    const filteredProducts = products.filter(p => {
        const query = (searchQuery || '').toLowerCase();
        const matchesSearch =
            (p.name || '').toLowerCase().includes(query) ||
            (p.id || '').includes(searchQuery);
        const matchesType = filterType === 'All' || p.productType === filterType;
        const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product & Service List</h2>
                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                        <option value="All">All Types</option>
                        <option value="Digital Product">Digital</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Service">Service</option>
                    </select>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-xl shadow border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-black/40 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 text-left">Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Base Price (BDT/USD)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-400">
                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    No items found
                                </td>
                            </tr>
                        )}
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 group transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900 dark:text-white">{product.name || 'Unnamed Product'}</p>
                                    <p className="text-xs text-gray-500">ID: {product.id?.slice(-6) || 'N/A'}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold">
                                    {product.productType === 'Subscription' ? (
                                        <span className="text-purple-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Subscription</span>
                                    ) : (
                                        <span className="text-indigo-600 flex items-center gap-1"><Package className="w-4 h-4" /> {product.productType}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{product.category || 'General'}</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white">৳{(product.basePrice || 0).toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">≈ ${((product.basePrice || 0) / REF_RATE).toFixed(2)} USD</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {onEditProduct && <button onClick={() => onEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"><Edit className="w-4 h-4" /></button>}
                                        {onDeleteProduct && <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"><Trash className="w-4 h-4" /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
