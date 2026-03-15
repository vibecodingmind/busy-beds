'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin, AmenityCategory, Amenity } from '@/lib/api';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) return <div className={`h-4 w-4 rounded-full bg-zinc-300 dark:bg-zinc-700 ${className || ''}`} />;
    return <IconComponent className={className || 'h-4 w-4'} />;
};

export default function AmenitiesDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<AmenityCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AmenityCategory | null>(null);
    const [catName, setCatName] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [catOrder, setCatOrder] = useState<number>(0);

    const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
    const [amenityName, setAmenityName] = useState('');
    const [amenityIcon, setAmenityIcon] = useState('');
    const [amenityDesc, setAmenityDesc] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
    }, [user, authLoading, router]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await admin.amenityCategories.list(true);
            setCategories(res.categories);
        } catch (err: any) {
            setError(err.message || 'Failed to load amenities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') loadData();
    }, [user]);

    // --- Category Handlers ---
    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory?.category_id) {
                await admin.amenityCategories.update(editingCategory.category_id, {
                    name: catName,
                    description: catDesc,
                    display_order: catOrder,
                });
            } else {
                await admin.amenityCategories.create({
                    name: catName,
                    description: catDesc,
                    display_order: catOrder,
                });
            }
            setIsCategoryModalOpen(false);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Error saving category');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category? All its amenities will also be deleted.')) return;
        try {
            await admin.amenityCategories.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete category');
        }
    };

    const openCategoryModal = (cat?: AmenityCategory) => {
        if (cat && cat.category_id) {
            setEditingCategory(cat);
            setCatName(cat.category_name || '');
            setCatDesc(cat.description || '');
            setCatOrder(cat.display_order || 0);
        } else {
            setEditingCategory(null);
            setCatName('');
            setCatDesc('');
            setCatOrder(0);
        }
        setIsCategoryModalOpen(true);
    };

    // --- Amenity Handlers ---
    const handleSaveAmenity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAmenity?.id) {
                await admin.amenities.update(editingAmenity.id, {
                    category_id: selectedCategoryId,
                    name: amenityName,
                    icon: amenityIcon,
                    description: amenityDesc,
                });
            } else {
                await admin.amenities.create({
                    category_id: selectedCategoryId,
                    name: amenityName,
                    icon: amenityIcon,
                    description: amenityDesc,
                });
            }
            setIsAmenityModalOpen(false);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Error saving amenity');
        }
    };

    const handleDeleteAmenity = async (id: number) => {
        if (!confirm('Are you sure you want to delete this amenity?')) return;
        try {
            await admin.amenities.delete(id);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete amenity');
        }
    };

    const openAmenityModal = (categoryId: number, amenity?: Amenity) => {
        setSelectedCategoryId(categoryId);
        if (amenity) {
            setEditingAmenity(amenity);
            setAmenityName(amenity.name);
            setAmenityIcon(amenity.icon || '');
            setAmenityDesc(amenity.description || '');
        } else {
            setEditingAmenity(null);
            setAmenityName('');
            setAmenityIcon('Check'); // Default
            setAmenityDesc('');
        }
        setIsAmenityModalOpen(true);
    };

    if (authLoading || !user || user.role !== 'admin') return <div className="p-8">Loading...</div>;

    return (
        <div className="mx-auto max-w-5xl py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amenities Management</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Manage categories and their individual amenities.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin">
                        <button className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
                            Back to Dashboard
                        </button>
                    </Link>
                    <button
                        onClick={() => openCategoryModal()}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Add Category
                    </button>
                </div>
            </div>

            {error && <div className="mb-6 rounded bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

            {loading ? (
                <div className="py-8 text-center text-zinc-500">Loading amenities...</div>
            ) : categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
                    <p className="text-zinc-500">No amenity categories found. Create one to get started.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories.map((cat) => (
                        <div key={cat.category_id} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {cat.category_name}
                                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Order: {cat.display_order}</span>
                                    </h2>
                                    {cat.description && <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{cat.description}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openAmenityModal(cat.category_id!)}
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        + Add Amenity
                                    </button>
                                    <button
                                        onClick={() => openCategoryModal(cat)}
                                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white ml-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.category_id!)}
                                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {cat.amenities && cat.amenities.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {cat.amenities.map((amenity) => (
                                        <div key={amenity.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                                    <DynamicIcon name={amenity.icon || 'Check'} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{amenity.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-2 ml-2">
                                                <button onClick={() => openAmenityModal(cat.category_id!, amenity)} className="text-zinc-500 hover:text-blue-600">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteAmenity(amenity.id)} className="text-zinc-500 hover:text-red-600">
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500 mt-4 italic">No amenities in this category.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                            {editingCategory ? 'Edit Category' : 'New Category'}
                        </h2>
                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    placeholder="e.g. Room Amenities"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Description (optional)</label>
                                <input
                                    type="text"
                                    value={catDesc}
                                    onChange={(e) => setCatDesc(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Display Order</label>
                                <input
                                    type="number"
                                    value={catOrder}
                                    onChange={(e) => setCatOrder(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="rounded-md px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                                >
                                    Save Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Amenity Modal */}
            {isAmenityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                            {editingAmenity ? 'Edit Amenity' : 'New Amenity'}
                        </h2>
                        <form onSubmit={handleSaveAmenity} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={amenityName}
                                    onChange={(e) => setAmenityName(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    placeholder="e.g. Free WiFi"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Lucide Icon name (optional)</label>
                                <input
                                    type="text"
                                    value={amenityIcon}
                                    onChange={(e) => setAmenityIcon(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                    placeholder="e.g. Wifi, Tv, Coffee"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Use valid Lucide-React icon names. E.g. `Check`, `Wifi`, `Pool`, `Coffee`.</p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Description (optional)</label>
                                <input
                                    type="text"
                                    value={amenityDesc}
                                    onChange={(e) => setAmenityDesc(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAmenityModalOpen(false)}
                                    className="rounded-md px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                                >
                                    Save Amenity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
