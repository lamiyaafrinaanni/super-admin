import React, { useState, useEffect } from 'react';
import {
    Product,
    ProductVariation,
    ServiceFeature,
    StoreCategory
} from '../../types';
import {
    Briefcase,
    Image,
    X,
    CheckCircle,
    AlertCircle
} from '../Icons';
import { db } from '../../services/db';

interface AddServiceProps {
    onAddProduct: (product: Product) => void;
    onUpdateProduct?: (product: Product) => void;
    initialProduct?: Product | null;
    onCancel?: () => void;
}

export const AddService: React.FC<AddServiceProps> = ({
    onAddProduct,
    onUpdateProduct,
    initialProduct,
    onCancel
}) => {

    const [name, setName] = useState('');
    const [priceBDT, setPriceBDT] = useState('');
    const [minPriceBDT, setMinPriceBDT] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

    const [features, setFeatures] = useState<ServiceFeature[]>([]);
    const [featureInput, setFeatureInput] = useState('');

    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [categories, setCategories] = useState<StoreCategory[]>([]);

    /* Load categories from DB */
    useEffect(() => {
        db.getAll<StoreCategory>('categories').then(cats => {
            setCategories(cats);
            if (!category && cats.length > 0) {
                setCategory(cats[0].name);
            }
        });
    }, []);

    /* Populate edit data */
    useEffect(() => {
        if (!initialProduct) return;

        setName(initialProduct.name);
        setPriceBDT(initialProduct.basePrice.toString());
        setMinPriceBDT(initialProduct.minPrice.toString());
        setCategory(initialProduct.category);
        setDescription(initialProduct.description);
        setImage(initialProduct.image);
        setFeatures(initialProduct.features || []);
        setVariations(initialProduct.variations || []);
        setStatus(initialProduct.status);
    }, [initialProduct]);

    const handleAddFeature = (type: 'check' | 'cross') => {
        if (!featureInput.trim()) return;
        setFeatures([...features, { text: featureInput.trim(), icon: type }]);
        setFeatureInput('');
    };

    const removeFeature = (i: number) => {
        setFeatures(features.filter((_, idx) => idx !== i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !priceBDT || !category) {
            alert('Please fill required fields');
            return;
        }

        const price = parseFloat(priceBDT);
        const minPrice = parseFloat(minPriceBDT) || price;

        const productData: Product = {
            id: initialProduct ? initialProduct.id : `service-${Date.now()}`,
            name,
            productType: 'Service',
            price,
            basePrice: price,
            minPrice,
            stock: 999,
            category,
            variations,
            features,
            description,
            image: image || 'https://via.placeholder.com/300',
            status,
            requirementType: 'none',
            attributes: [],
            rules: []
        };

        if (initialProduct && onUpdateProduct) {
            onUpdateProduct(productData);
            alert('Service updated successfully');
            onCancel?.();
        } else {
            onAddProduct(productData);
            alert('Service added successfully');

            setName('');
            setPriceBDT('');
            setMinPriceBDT('');
            setDescription('');
            setImage('');
            setFeatures([]);
            setVariations([]);
            setStatus('Active');
        }
    };

 return (
    <div className="max-w-4xl mx-auto space-y-5">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            {initialProduct ? 'Edit Service' : 'Add New Service'}
        </h2>

        <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white p-6 border border-gray-200"
        >

            {/* Service Name */}
            <input
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Service Name"
                value={name}
                onChange={e => setName(e.target.value)}
            />

            {/* Category */}
            <select
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-indigo-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
            >
                {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="number"
                    className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Starting Price (BDT)"
                    value={priceBDT}
                    onChange={e => setPriceBDT(e.target.value)}
                />
                <input
                    type="number"
                    className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Minimum Price (BDT)"
                    value={minPriceBDT}
                    onChange={e => setMinPriceBDT(e.target.value)}
                />
            </div>

            {/* Features */}
            <div>
                <div className="flex gap-2 mb-2">
                    <input
                        className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        placeholder="Service feature"
                    />
                    <button type="button" onClick={() => handleAddFeature('check')}>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </button>
                    <button type="button" onClick={() => handleAddFeature('cross')}>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </button>
                </div>

                <div className="space-y-1">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center text-sm px-2 py-1 border border-gray-200"
                        >
                            <span>{f.text}</span>
                            <button type="button" onClick={() => removeFeature(i)}>
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <textarea
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Service description"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />

            {/* Image */}
            <input
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Image URL"
                value={image}
                onChange={e => setImage(e.target.value)}
            />

            {/* Status */}
            {initialProduct && (
                <select
                    className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-indigo-500"
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                    {initialProduct ? 'Update Service' : 'Add Service'}
                </button>

                {initialProduct && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 border border-gray-300 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>

        </form>
    </div>
);

};
