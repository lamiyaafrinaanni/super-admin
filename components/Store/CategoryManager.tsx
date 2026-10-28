
import React, { useState, useEffect } from 'react';
import { StoreCategory } from '../../types';
import { db } from '../../services/db';
import { Plus, Trash, Search, List, Edit, Save, X } from '../Icons';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await db.getAll<StoreCategory>('categories');
    setCategories(data);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      const existing = categories.find(c => c.id === isEditing);
      if (existing) {
        await db.put('categories', {
          ...existing,
          name: name.trim(),
          description: description.trim()
        });
      }
    } else {
      const newCat: StoreCategory = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        description: description.trim()
      };
      await db.add('categories', newCat);
    }

    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await db.delete('categories', id);
    load();
  };

  const filtered = categories.filter(c =>
    (c.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <List className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Store Categories
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Category' : 'Create Category'}
          </h3>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
              placeholder="Games, Accounts"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 border border-gray-300 dark:border-white/10 rounded-md text-sm text-gray-600"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" /> Update
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create
                </>
              )}
            </button>
          </div>
        </form>

        {/* LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
              placeholder="Search categories..."
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 text-xs border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {filtered.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cat.name || 'Unnamed Category'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cat.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      0 Items
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(cat.id);
                            setName(cat.name || '');
                            setDescription(cat.description || '');
                          }}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-gray-500 text-sm"
                    >
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
