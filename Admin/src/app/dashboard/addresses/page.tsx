"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  MapPin,
  Home,
  Building,
  Navigation,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Phone,
  Mail,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Calendar,
  Compass
} from 'lucide-react';

interface LinkedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AddressItem {
  _id: string;
  user?: LinkedUser | string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: 'HOME' | 'OFFICE' | 'OTHER' | string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AddressStats {
  totalAddresses: number;
  homeAddresses: number;
  officeAddresses: number;
  otherAddresses: number;
  defaultAddresses: number;
  distinctUsers: number;
}

export default function AddressesManagementPage() {
  // Stats
  const [stats, setStats] = useState<AddressStats>({
    totalAddresses: 0,
    homeAddresses: 0,
    officeAddresses: 0,
    otherAddresses: 0,
    defaultAddresses: 0,
    distinctUsers: 0,
  });

  // Data
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [defaultFilter, setDefaultFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals & Action States
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<AddressItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchApi('/api/addresses/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load address stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load addresses
  const loadAddresses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('all', 'true');
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter !== 'ALL') params.append('addressType', typeFilter);
      if (defaultFilter !== 'ALL') params.append('isDefault', defaultFilter);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/api/addresses?${params.toString()}`);
      if (res.success) {
        if (res.data && res.data.items) {
          setAddresses(res.data.items);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.items.length);
        } else if (Array.isArray(res.data)) {
          setAddresses(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setAddresses([]);
        }
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [search, typeFilter, defaultFilter, sortBy, page, limit]);

  // Handle Delete Address
  const handleDeleteSubmit = async () => {
    if (!addressToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/api/addresses/${addressToDelete._id}`, { method: 'DELETE' });
      if (res.success) {
        setAddressToDelete(null);
        if (selectedAddress?._id === addressToDelete._id) {
          setSelectedAddress(null);
        }
        loadAddresses();
        loadStats();
      } else {
        alert(res.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting address');
    } finally {
      setActionLoading(false);
    }
  };

  // Type badge helper
  const getTypeBadge = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'HOME') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Home className="w-3 h-3" /> Home
        </span>
      );
    }
    if (t === 'OFFICE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Building className="w-3 h-3" /> Office
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Navigation className="w-3 h-3" /> Other
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-[#57c5cc]" />
            Addresses Management
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            View, search, and audit user shipping & billing addresses across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadAddresses();
            }}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 text-foreground/70 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Addresses */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Total Addresses</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats.totalAddresses.toLocaleString()}
            </p>
            <p className="text-xs text-foreground/50">Across {stats.distinctUsers} active users</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* Home Addresses */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Home Locations</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsLoading ? '...' : stats.homeAddresses.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Residential addresses</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
        </div>

        {/* Office Addresses */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Office / Commercial</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statsLoading ? '...' : stats.officeAddresses.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Corporate / workplace</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Default Primary */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Default Primary</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsLoading ? '...' : stats.defaultAddresses.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Primary checkout targets</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Search by recipient, phone, street, city, state, or zip code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#57c5cc] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Types</option>
              <option value="HOME">Home</option>
              <option value="OFFICE">Office</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Default Status Filter */}
            <select
              value={defaultFilter}
              onChange={(e) => {
                setDefaultFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Defaults</option>
              <option value="true">Default Only</option>
              <option value="false">Non-Default</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="city_asc">City A-Z</option>
              <option value="name_asc">Recipient Name A-Z</option>
            </select>

            {/* Rows Per Page */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border">
          <RefreshCw className="w-8 h-8 text-[#57c5cc] animate-spin mx-auto mb-3" />
          <p className="text-sm text-foreground/60 font-medium">Loading addresses catalog...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Addresses Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            No addresses match your filter settings. Try clearing the search or changing criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('ALL');
              setDefaultFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-medium transition"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/2 text-foreground/60 text-xs font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Linked User</th>
                  <th className="px-6 py-4">Street & Landmark</th>
                  <th className="px-6 py-4">City / State / Zip</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Default</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {addresses.map((addr) => {
                  const userObj =
                    typeof addr.user === 'object' && addr.user !== null ? (addr.user as LinkedUser) : null;

                  return (
                    <tr
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr)}
                      className="hover:bg-foreground/2 transition group cursor-pointer"
                    >
                      {/* Recipient */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{addr.fullName}</p>
                          <p className="text-xs text-foreground/60 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-foreground/40" />
                            {addr.phone}
                          </p>
                        </div>
                      </td>

                      {/* Linked User */}
                      <td className="px-6 py-4">
                        {userObj ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#57c5cc]" />
                              {userObj.name || 'User'}
                            </p>
                            <p className="text-2xs text-foreground/50">{userObj.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/40 font-mono">
                            ID: {typeof addr.user === 'string' ? addr.user.slice(-6) : '—'}
                          </span>
                        )}
                      </td>

                      {/* Street Address */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-foreground font-medium truncate">{addr.addressLine1}</p>
                        {addr.addressLine2 && (
                          <p className="text-2xs text-foreground/50 truncate">{addr.addressLine2}</p>
                        )}
                        {addr.landmark && (
                          <p className="text-2xs text-[#57c5cc] truncate">Near: {addr.landmark}</p>
                        )}
                      </td>

                      {/* City, State, Postal */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-foreground">
                          {addr.city}, {addr.state}
                        </p>
                        <p className="text-2xs text-foreground/50 font-mono">
                          PIN: {addr.postalCode} · {addr.country}
                        </p>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4">{getTypeBadge(addr.addressType)}</td>

                      {/* Default Badge */}
                      <td className="px-6 py-4">
                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                            Default
                          </span>
                        ) : (
                          <span className="text-foreground/40 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAddress(addr)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition"
                            title="View Full Address Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAddressToDelete(addr)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => {
            const userObj =
              typeof addr.user === 'object' && addr.user !== null ? (addr.user as LinkedUser) : null;

            return (
              <div
                key={addr._id}
                onClick={() => setSelectedAddress(addr)}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between hover:border-[#57c5cc]/40 transition space-y-4 cursor-pointer"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(addr.addressType)}
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Star className="w-2.5 h-2.5 fill-emerald-500" />
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-2xs text-foreground/40 font-mono">ID: {addr._id.slice(-6)}</span>
                  </div>

                  {/* Recipient info */}
                  <div className="mt-3">
                    <h4 className="font-semibold text-foreground text-sm">{addr.fullName}</h4>
                    <p className="text-xs text-foreground/60 flex items-center gap-1 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-foreground/40" />
                      {addr.phone}
                    </p>
                  </div>

                  {/* Address info */}
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs text-foreground/70">
                    <p className="font-medium text-foreground">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-foreground/60">{addr.addressLine2}</p>}
                    {addr.landmark && (
                      <p className="text-2xs text-[#57c5cc]">Landmark: {addr.landmark}</p>
                    )}
                    <p className="font-semibold text-foreground pt-1">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-foreground/50">{addr.country}</p>
                  </div>
                </div>

                {/* Bottom Bar with User & Actions */}
                <div
                  className="pt-3 border-t border-border flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="truncate max-w-45">
                    {userObj ? (
                      <p className="text-2xs text-foreground/60 truncate">User: {userObj.name || userObj.email}</p>
                    ) : (
                      <p className="text-2xs text-foreground/40">User: #{typeof addr.user === 'string' ? addr.user.slice(-6) : '—'}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAddress(addr)}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAddressToDelete(addr)}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && addresses.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> addresses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-medium text-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADDRESS DETAILS MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-foreground/2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{selectedAddress.fullName}</h3>
                    {getTypeBadge(selectedAddress.addressType)}
                  </div>
                  <p className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-foreground/40" />
                    {selectedAddress.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAddress(null)}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Linked User */}
              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Associated User Account
                </p>
                {typeof selectedAddress.user === 'object' && selectedAddress.user !== null ? (
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#57c5cc]" />
                      {(selectedAddress.user as LinkedUser).name}
                    </p>
                    <p className="text-foreground/70 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-foreground/40" />
                      {(selectedAddress.user as LinkedUser).email}
                    </p>
                  </div>
                ) : (
                  <p className="font-mono text-foreground/70">
                    User ID: {typeof selectedAddress.user === 'string' ? selectedAddress.user : 'Unknown'}
                  </p>
                )}
              </div>

              {/* Address details */}
              <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
                <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Delivery Destination
                </p>
                <div className="space-y-1.5 text-foreground">
                  <div className="flex items-start justify-between">
                    <span className="text-foreground/50">Address Line 1:</span>
                    <span className="font-semibold text-right">{selectedAddress.addressLine1}</span>
                  </div>
                  {selectedAddress.addressLine2 && (
                    <div className="flex items-start justify-between">
                      <span className="text-foreground/50">Address Line 2:</span>
                      <span className="font-medium text-right">{selectedAddress.addressLine2}</span>
                    </div>
                  )}
                  {selectedAddress.landmark && (
                    <div className="flex items-start justify-between">
                      <span className="text-foreground/50">Landmark:</span>
                      <span className="font-medium text-[#57c5cc] text-right">{selectedAddress.landmark}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-foreground/50">City & State:</span>
                    <span className="font-semibold text-right">
                      {selectedAddress.city}, {selectedAddress.state}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-foreground/50">Postal Code (PIN):</span>
                    <span className="font-mono font-bold text-right">{selectedAddress.postalCode}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-foreground/50">Country:</span>
                    <span className="font-medium text-right">{selectedAddress.country}</span>
                  </div>
                  <div className="flex items-start justify-between pt-2 border-t border-border">
                    <span className="text-foreground/50">Default Preference:</span>
                    <span className="font-bold text-right">
                      {selectedAddress.isDefault ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Yes (Primary Default)</span>
                      ) : (
                        'No'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-2xs text-foreground/40 px-1">
                <span>
                  Created: {new Date(selectedAddress.createdAt).toLocaleString()}
                </span>
                <span className="font-mono">
                  ID: {selectedAddress._id}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-foreground/2 flex items-center justify-between">
              <button
                onClick={() => {
                  setAddressToDelete(selectedAddress);
                }}
                className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Address
              </button>
              <button
                onClick={() => setSelectedAddress(null)}
                className="px-5 py-2 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white text-xs font-semibold shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ADDRESS CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete Saved Address</h3>
              <p className="text-xs text-foreground/60">
                Are you sure you want to remove address belonging to <span className="font-semibold text-foreground">{addressToDelete.fullName}</span> ({addressToDelete.city}, {addressToDelete.postalCode})?
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setAddressToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-semibold text-foreground/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
