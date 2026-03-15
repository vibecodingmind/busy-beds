'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import type { AdminHotel } from '@/lib/api';
import { tanzaniaRegions } from '@/data/tanzania-wards';
import SearchableSelect from '@/components/SearchableSelect';
import {
  Building2,
  Search,
  Plus,
  Trash2,
  Edit3,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Users,
  Percent
} from 'lucide-react';

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
    admin.hotels.list().then((r) => setHotels(r.hotels)).catch(() => { });
  };

  useEffect(() => {
    fetchHotels();
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: hotels.length,
      active: hotels.filter(h => h.active !== false).length,
      inactive: hotels.filter(h => h.active === false).length,
      pending: hotels.filter(h => h.managing_account && !h.managing_account.approved).length
    };
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const matchesSearch = !search ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.country?.toLowerCase().includes(search.toLowerCase())) ||
        (h.region?.toLowerCase().includes(search.toLowerCase())) ||
        (h.city?.toLowerCase().includes(search.toLowerCase())) ||
        (h.managing_account?.email.toLowerCase().includes(search.toLowerCase()));

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Manage Hotels
          </h1>
          <p className="text-muted text-sm mt-1">Directory of all properties registered in the system</p>
        </div>
        <Link
          href="/admin/hotels/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add Property
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Properites', value: stats.total, icon: <Building2 className="text-blue-500" />, bg: 'bg-blue-500/10' },
          { label: 'Active', value: stats.active, icon: <CheckCircle className="text-emerald-500" />, bg: 'bg-emerald-500/10' },
          { label: 'Inactive', value: stats.inactive, icon: <XCircle className="text-zinc-500" />, bg: 'bg-zinc-500/10' },
          { label: 'Pending Approval', value: stats.pending, icon: <Clock className="text-amber-500" />, bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.bg}`}>{stat.icon}</div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Area */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, country, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Combined Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

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
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <XCircle size={16} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between h-5">
          <span className="text-xs text-muted flex items-center gap-2">
            <Filter size={12} />
            Showing <b>{filteredHotels.length}</b> of {hotels.length} results
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Manager</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Policy</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-transparent">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="w-12 h-12 text-muted/30" />
                      <p className="text-muted font-medium">
                        {hotels.length === 0 ? 'No hotels found' : 'No results match your filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHotels.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {h.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-none">{h.name}</span>
                          <span className="text-[10px] text-muted mt-1 uppercase tracking-wider">ID: {h.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Globe size={14} className="text-zinc-400" />
                          {h.country || 'Tanzania'}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1.5">
                          <MapPin size={14} className="text-zinc-400" />
                          {h.region}{h.city ? `, ${h.city}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${h.active !== false
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${h.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {h.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {h.managing_account ? (
                        <div className="flex flex-col truncate max-w-[180px]">
                          <span className="text-sm font-medium text-foreground truncate">{h.managing_account.name}</span>
                          <span className="text-xs text-muted truncate">{h.managing_account.email}</span>
                          {!h.managing_account.approved && (
                            <span className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter bg-amber-500/10 px-1 rounded w-fit">Pending Approval</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">No manager assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                          <Percent size={12} />
                          {h.coupon_discount_value} OFF
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <Clock size={10} />
                          {h.coupon_limit} / {h.limit_period}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                          <Building2 size={10} />
                          Per {h.price_type || 'day'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/hotels/${h.id}`}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
