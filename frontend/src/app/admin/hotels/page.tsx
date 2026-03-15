'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import type { AdminHotel } from '@/lib/api';
import { tanzaniaRegions } from '@/data/tanzania-wards';
import SearchableSelect from '@/components/SearchableSelect';

export default function AdminHotelsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  const fetchHotels = () => {
    if (!user || user.role !== 'admin') return;
    admin.hotels.list().then((r) => setHotels(r.hotels)).catch(() => {});
  };

  useEffect(() => {
    fetchHotels();
  }, [user]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const matchesSearch = !search || 
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.location?.toLowerCase().includes(search.toLowerCase())) ||
        (h.city?.toLowerCase().includes(search.toLowerCase())) ||
        (h.region?.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && h.active !== false) ||
        (statusFilter === 'inactive' && h.active === false);
      
      const matchesRegion = !regionFilter || 
        h.region?.toLowerCase() === regionFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [hotels, search, statusFilter, regionFilter]);

  const handleDelete = async (h: AdminHotel) => {
    if (!confirm(`Delete "${h.name}"? This cannot be undone.`)) return;
    try {
      await admin.hotels.delete(h.id);
      setHotels((prev) => prev.filter((x) => x.id !== h.id));
    } catch {
      alert('Failed to delete hotel');
    }
  };

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Manage Hotels</h1>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          Add Hotel
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-black dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="min-w-[180px]">
          <SearchableSelect
            value={regionFilter}
            options={['', ...tanzaniaRegions.map((r) => r.region)]}
            onChange={(value) => setRegionFilter(value)}
            placeholder="All Regions"
            searchPlaceholder="Search regions..."
            optionLabel={(region) => region || 'All Regions'}
            searchFirst
          />
        </div>
        {(search || statusFilter !== 'all' || regionFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setRegionFilter(''); }}
            className="rounded-lg border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Clear Filters
          </button>
        )}
        <span className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
          {filteredHotels.length} of {hotels.length} hotels
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-white dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Location</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Managed by</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Discount</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Limit</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredHotels.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {hotels.length === 0 ? 'No hotels found' : 'No hotels match your filters'}
                </td>
              </tr>
            ) : (
              filteredHotels.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-100">{h.name}</td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.region ? `${h.region}${h.city ? ', ' + h.city : ''}` : h.location ?? '-'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${h.active !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200'}`}>
                    {h.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400" title={h.managing_account ? `${h.managing_account.name} (${h.managing_account.approved ? 'Approved' : 'Pending'})` : undefined}>
                  {h.managing_account ? h.managing_account.email : '—'}
                </td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.coupon_discount_value}</td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.coupon_limit} / {h.limit_period}</td>
                <td className="px-4 py-2 flex items-center gap-3">
                  <Link
                    href={`/admin/hotels/${h.id}`}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(h)}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
