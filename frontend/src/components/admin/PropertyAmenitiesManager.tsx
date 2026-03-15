'use client';

import { useEffect, useState } from 'react';
import { admin, PropertyAmenityCategory } from '@/lib/api';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) return <div className={`h-4 w-4 rounded-full bg-zinc-300 dark:bg-zinc-700 ${className || ''}`} />;
    return <IconComponent className={className || 'h-4 w-4'} />;
};

export default function PropertyAmenitiesManager({ hotelId }: { hotelId: number }) {
    const [categories, setCategories] = useState<PropertyAmenityCategory[]>([]);
    const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // We load the full catalog and the selected ones for this hotel
    useEffect(() => {
        let active = true;
        const loadData = async () => {
            try {
                setLoading(true);
                // Load all available amenities via admin endpoint
                const { categories: allCats } = await admin.amenityCategories.list(true);
                // Load the currently selected ones
                const { amenities: selectedData } = await admin.propertyAmenities.get(hotelId);

                if (!active) return;

                // Map all categories exactly as they exist globally
                setCategories(allCats as any);

                // Pre-fill the selected set
                const selectedIds = new Set<number>();
                selectedData.forEach((cat) => {
                    cat.amenities.forEach((am) => selectedIds.add(am.id));
                });
                setSelectedAmenityIds(selectedIds);

            } catch (err: any) {
                if (active) setError(err.message || 'Failed to load amenities');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadData();
        return () => { active = false; };
    }, [hotelId]);

    const toggleAmenity = (id: number) => {
        setSuccess('');
        setError('');
        setSelectedAmenityIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await admin.propertyAmenities.update(hotelId, Array.from(selectedAmenityIds));
            setSuccess('Amenities successfully updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update amenities');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-zinc-500 py-4">Loading amenities catalog...</div>;

    return (
        <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Property Amenities</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Select the amenities available at this property.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Amenities'}
                </button>
            </div>

            {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
            {success && <div className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{success}</div>}

            <div className="space-y-6">
                {categories.length === 0 ? (
                    <p className="text-sm italic text-zinc-500">No amenities defined in the system yet.</p>
                ) : (
                    categories.map((cat) => (
                        <div key={cat.category_id} className="border-t border-zinc-100 dark:border-zinc-800 pt-4 first:border-0 first:pt-0">
                            <h3 className="mb-3 font-medium text-black dark:text-zinc-200">{cat.category_name}</h3>
                            {cat.amenities && cat.amenities.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {cat.amenities.map((amenity) => (
                                        <label
                                            key={amenity.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 dark:border-zinc-700 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAmenityIds.has(amenity.id)}
                                                onChange={() => toggleAmenity(amenity.id)}
                                                className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-emerald-600"
                                            />
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500">
                                                    <DynamicIcon name={amenity.icon || 'Check'} className="h-4 w-4" />
                                                </div>
                                                <span className="truncate text-sm text-gray-900 dark:text-zinc-100">{amenity.name}</span>
                                            </div>                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-400">No amenities in this category</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
