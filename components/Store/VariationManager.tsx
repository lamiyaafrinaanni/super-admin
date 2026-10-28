
import React, { useState, useEffect } from 'react';
import {
    StoreAttribute,
    StoreAttributeOption,
    AttributeType,
    GlobalVariation
} from '../../types';
import { db } from '../../services/db';
import {
    Plus,
    Trash,
    Sliders,
    Edit,
    X,
    List,
    Hash,
    CheckSquare,
    ToggleLeft,
    Type,
    Search
} from '../Icons';

export const VariationManager: React.FC = () => {
    const [attributes, setAttributes] = useState<StoreAttribute[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<AttributeType>('dropdown');
    const [options, setOptions] = useState<StoreAttributeOption[]>([]);
    const [isRequired, setIsRequired] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const data = await db.getAll<GlobalVariation>('global_variations');
        setAttributes(data as StoreAttribute[]);
    };

    const resetForm = () => {
        setName('');
        setType('dropdown');
        setOptions([]);
        setIsRequired(true);
        setIsEditing(null);
    };

    const addOption = () => {
        const newOpt: StoreAttributeOption = {
            id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: '',
            priceImpact: 0,
            impactType: 'fixed',
            isDefault: options.length === 0
        };
        setOptions(prev => [...prev, newOpt]);
    };

    const updateOption = (
        id: string,
        field: keyof StoreAttributeOption,
        value: any
    ) => {
        setOptions(prev =>
            prev.map(o => (o.id === id ? { ...o, [field]: value } : o))
        );
    };

    const removeOption = (id: string) => {
        setOptions(prev => prev.filter(o => o.id !== id));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const attrData: StoreAttribute = {
            id: isEditing || `attr-${Date.now()}`,
            name: name.trim(),
            type,
            options,
            isRequired
        };

        if (isEditing) {
            await db.put('global_variations', attrData as GlobalVariation);
        } else {
            await db.add('global_variations', attrData as GlobalVariation);
        }

        resetForm();
        load();
    };

    const handleEdit = (attr: StoreAttribute) => {
        setIsEditing(attr.id);
        setName(attr.name || '');
        setType(attr.type);
        setOptions(attr.options || []);
        setIsRequired(attr.isRequired);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getTypeIcon = (t: AttributeType) => {
        switch (t) {
            case 'dropdown':
                return <List className="w-4 h-4" />;
            case 'radio':
            case 'checkbox':
                return <CheckSquare className="w-4 h-4" />;
            case 'number':
                return <Hash className="w-4 h-4" />;
            case 'toggle':
                return <ToggleLeft className="w-4 h-4" />;
            default:
                return <Type className="w-4 h-4" />;
        }
    };

    const filtered = attributes.filter(a =>
        (a.name || '').toLowerCase().includes((search || '').toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    Attribute Manager
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Builder */}
                <div className="lg:col-span-5">
                    <form
                        onSubmit={handleSave}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-6 sticky top-24"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Attribute' : 'Create Attribute'}
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                Attribute Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Storage Size"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Input Type
                                </label>
                                <select
                                    value={type}
                                    onChange={e =>
                                        setType(e.target.value as AttributeType)
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-md text-sm bg-white dark:bg-slate-900"
                                >
                                    <option value="dropdown">Dropdown</option>
                                    <option value="radio">Radio</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="number">Number</option>
                                    <option value="toggle">Toggle</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => setIsRequired(!isRequired)}
                                    className={`w-full py-3 rounded-md border text-sm font-medium ${
                                        isRequired
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-slate-900 text-gray-500 border-gray-300 dark:border-white/10'
                                    }`}
                                >
                                    {isRequired ? 'Required' : 'Optional'}
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        {type !== 'number' && type !== 'toggle' && (
                            <div className="space-y-3 border-t border-gray-200 dark:border-white/10 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">
                                        Options
                                    </span>
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="text-sm text-indigo-600 hover:underline"
                                    >
                                        + Add option
                                    </button>
                                </div>

                                {options.map(opt => (
                                    <div
                                        key={opt.id}
                                        className="border border-gray-200 dark:border-white/10 rounded-md p-3 space-y-2"
                                    >
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={opt.label}
                                                onChange={e =>
                                                    updateOption(
                                                        opt.id,
                                                        'label',
                                                        e.target.value
                                                    )
                                                }
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md text-sm"
                                                placeholder="Option label"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeOption(opt.id)}
                                                className="text-red-500"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={opt.priceImpact}
                                                onChange={e =>
                                                    updateOption(
                                                        opt.id,
                                                        'priceImpact',
                                                        parseFloat(e.target.value)
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md text-sm"
                                            />
                                            <select
                                                value={opt.impactType}
                                                onChange={e =>
                                                    updateOption(
                                                        opt.id,
                                                        'impactType',
                                                        e.target.value
                                                    )
                                                }
                                                className="px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md text-sm bg-white dark:bg-slate-900"
                                            >
                                                <option value="fixed">৳ Fixed</option>
                                                <option value="percentage">% Percent</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                {options.length === 0 && (
                                    <p className="text-xs text-gray-400 italic">
                                        No options added.
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition"
                        >
                            {isEditing ? 'Update Attribute' : 'Save Attribute'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border border-gray-300 dark:border-white/10 rounded-md text-sm bg-white dark:bg-slate-900"
                            placeholder="Search attributes..."
                        />
                    </div>

                    {filtered.map(attr => (
                        <div
                            key={attr.id}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-5"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="text-indigo-600 mt-1">
                                        {getTypeIcon(attr.type)}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {attr.name || 'Unnamed Attribute'}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {attr.type}
                                            {attr.isRequired && ' • Required'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(attr)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (
                                                confirm(
                                                    'Delete this attribute permanently?'
                                                )
                                            ) {
                                                await db.delete(
                                                    'global_variations',
                                                    attr.id
                                                );
                                                load();
                                            }
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {(attr.options || []).map(opt => (
                                    <span
                                        key={opt.id}
                                        className="px-2 py-1 text-xs border border-gray-200 dark:border-white/10 rounded-md"
                                    >
                                        {opt.label}{' '}
                                        <strong>
                                            {opt.priceImpact >= 0 ? '+' : ''}
                                            {opt.priceImpact}
                                            {opt.impactType === 'percentage'
                                                ? '%'
                                                : '৳'}
                                        </strong>
                                    </span>
                                ))}
                                {(!attr.options || attr.options.length === 0) && (
                                    <span className="text-xs text-gray-400 italic">
                                        No options
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
