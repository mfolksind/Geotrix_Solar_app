"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../utils/api';
import {
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Eye,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  X,
  Tag,
  Box,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';

interface Family {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  requiresAdminApproval: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  categoriesCount?: number;
  categoriesPreview?: string[];
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FamilyStats {
  totalFamilies: number;
  activeFamilies: number;
  totalCategories: number;
  totalProducts: number;
}

interface LinkedItemCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  status: string;
  sortOrder: number;
}

interface LinkedItemProduct {
  _id: string;
  name: string;
  status: string;
  category?: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export default function FamiliesPage() {
  const router = useRouter();

  // Data States
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Stats (Catalog-wide, unfiltered)
  const [globalStats, setGlobalStats] = useState<FamilyStats>({
    totalFamilies: 0,
    activeFamilies: 0,
    totalCategories: 0,
    totalProducts: 0,
  });

  // Filter & Query States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    requiresAdminApproval: false,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Linked Items Modal States
  const [linkedModalFamily, setLinkedModalFamily] = useState<Family | null>(null);
  const [linkedCategories, setLinkedCategories] = useState<LinkedItemCategory[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<LinkedItemProduct[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [linkedActiveTab, setLinkedActiveTab] = useState<'categories' | 'products'>('categories');

  // Delete Confirm Modal
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick action feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: autoSlug ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug,
    }));
  };

  // 1. Fetch Global Stats
  const loadGlobalStats = useCallback(async () => {
    try {
      const res = await fetchApi('/api/families/stats');
      if (res && res.success && res.data) {
        setGlobalStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load global family stats:', err);
    }
  }, []);

  // 2. Fetch Families List
  const loadFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedApproval !== 'ALL') params.append('requiresAdminApproval', selectedApproval);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/api/families?${params.toString()}`);
      if (res && res.success) {
        setFamilies(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotal(res.data?.length || 0);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch families:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedApproval, sortBy, page, limit]);

  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handleApprovalFilter = (val: string) => {
    setSelectedApproval(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setPage(1);
  };

  const handleLimitChange = (val: number) => {
    setLimit(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedApproval('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || selectedStatus !== 'ALL' || selectedApproval !== 'ALL' || sortBy !== 'newest';

  // Copy slug helper
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Quick Status Toggle
  const handleQuickStatusToggle = async (family: Family) => {
    const nextStatus = family.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdatingId(family._id);
    try {
      const res = await fetchApi(`/api/families/${family._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res && res.success) {
        setFamilies(prev => prev.map(f => f._id === family._id ? { ...f, status: nextStatus } : f));
        loadGlobalStats();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingFamily(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      requiresAdminApproval: false,
      status: 'ACTIVE',
    });
    setAutoSlug(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (family: Family) => {
    setEditingFamily(family);
    setFormData({
      name: family.name,
      slug: family.slug,
      description: family.description || '',
      requiresAdminApproval: family.requiresAdminApproval,
      status: family.status || 'ACTIVE',
    });
    setAutoSlug(false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Family
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Family name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      let res;
      if (editingFamily) {
        res = await fetchApi(`/api/families/${editingFamily._id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetchApi('/api/families', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      if (res && res.success) {
        setIsModalOpen(false);
        loadFamilies();
        loadGlobalStats();
      } else {
        setFormError(res?.message || 'Failed to save family');
      }
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || 'Error saving family');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Family
  const handleConfirmDelete = async () => {
    if (!deletingFamily) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/api/families/${deletingFamily._id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setDeletingFamily(null);
        loadFamilies();
        loadGlobalStats();
      } else {
        alert(res?.message || 'Failed to delete family');
      }
    } catch (err) {
      alert('Error deleting family');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Linked Items Modal
  const handleOpenLinkedModal = async (family: Family, defaultTab: 'categories' | 'products' = 'categories') => {
    setLinkedModalFamily(family);
    setLinkedActiveTab(defaultTab);
    setLoadingLinked(true);
    try {
      const res = await fetchApi(`/api/families/${family._id}/linked`);
      if (res && res.success && res.data) {
        setLinkedCategories(res.data.categories || []);
        setLinkedProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load linked items:', err);
    } finally {
      setLoadingLinked(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Product Families
            </h1>
            <span className="bg-[#57c5cc]/10 text-[#57c5cc] font-semibold text-xs px-2.5 py-1 rounded-full">
              {globalStats.totalFamilies} Total in Catalog
            </span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Manage high-level product classifications, approval workflows, and linked brand ecosystems
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Table View"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={loadFamilies}
            disabled={loading}
            className="p-2.5 bg-surface border border-border text-foreground/70 hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-[#57c5cc]' : ''} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#57c5cc] hover:bg-[#45a0a6] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Family</span>
          </button>
        </div>
      </div>

      {/* Global Stat Cards (Catalog Overview - Matching Products Page) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Families</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalFamilies}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Active Families</p>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">
                {globalStats.totalFamilies > 0
                  ? `${Math.round((globalStats.activeFamilies / globalStats.totalFamilies) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.activeFamilies}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <FolderTree size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Linked Categories</p>
              <span className="text-[10px] text-foreground/40 font-mono">(Mapped)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalCategories}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Box size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Linked Products</p>
              <span className="text-[10px] text-purple-600 font-mono font-bold">Catalog</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search family name, slug, or description..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Table Count Selector, View Mode & Reset Controls */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* Show per page dropdown */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground/70">
              <span className="font-medium">Show:</span>
              <select
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={0}>All rows</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RefreshCw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={e => handleStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Admin Approval</label>
            <select
              value={selectedApproval}
              onChange={e => handleApprovalFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Policies</option>
              <option value="true">Approval Required</option>
              <option value="false">Direct Setup (No Approval)</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Sort Order</label>
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="categories_desc">Most Categories</option>
              <option value="products_desc">Most Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-3"></div>
          <p className="text-sm font-medium text-foreground/60">Loading families...</p>
        </div>
      ) : families.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-foreground/40 mx-auto mb-3">
            <Layers size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No families found</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No families matched your active search or filter criteria. Try resetting filters.'
              : 'Get started by creating your first product family.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Add Family
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-border text-foreground/60 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Family Info</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Admin Approval</th>
                  <th className="py-3.5 px-4 text-center">Linked Categories</th>
                  <th className="py-3.5 px-4 text-center">Linked Products</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {families.map((family) => (
                  <tr key={family._id} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold shrink-0">
                          {family.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-[#57c5cc] transition-colors">
                            {family.name}
                          </div>
                          {family.description ? (
                            <div className="text-xs text-foreground/60 line-clamp-1 max-w-xs sm:max-w-md">
                              {family.description}
                            </div>
                          ) : (
                            <div className="text-xs text-foreground/40 italic">No description</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleCopySlug(family.slug)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background hover:bg-foreground/5 text-foreground/80 border border-border rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                        title="Click to copy slug"
                      >
                        <span>{family.slug}</span>
                        {copiedSlug === family.slug ? (
                          <Check size={12} className="text-[#57c5cc]" />
                        ) : (
                          <Copy size={12} className="text-foreground/40" />
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleQuickStatusToggle(family)}
                        disabled={statusUpdatingId === family._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                          family.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                            : family.status === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                            : 'bg-foreground/5 text-foreground/60 border border-border'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            family.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : family.status === 'SUSPENDED'
                              ? 'bg-amber-500'
                              : 'bg-foreground/40'
                          }`}
                        />
                        <span>{family.status}</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {family.requiresAdminApproval ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                          <ShieldCheck size={14} />
                          <span>Required</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-foreground/5 text-foreground/60">
                          <span>Direct</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenLinkedModal(family, 'categories')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 hover:bg-cyan-100 transition-colors cursor-pointer"
                        title="View linked categories"
                      >
                        <FolderTree size={14} />
                        <span>{family.categoriesCount ?? 0} Categories</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenLinkedModal(family, 'products')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 transition-colors cursor-pointer"
                        title="View linked products"
                      >
                        <Box size={14} />
                        <span>{family.productsCount ?? 0} Products</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenLinkedModal(family)}
                          className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                          title="View family details & linked items"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(family)}
                          className="p-1.5 text-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit Family"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingFamily(family)}
                          className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Family"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {families.map((family) => (
            <div
              key={family._id}
              className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#57c5cc]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold text-lg shrink-0">
                      {family.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">{family.name}</h3>
                      <button
                        onClick={() => handleCopySlug(family.slug)}
                        className="inline-flex items-center gap-1 text-xs font-mono text-foreground/60 hover:text-foreground cursor-pointer"
                        title="Click to copy slug"
                      >
                        <span>{family.slug}</span>
                        {copiedSlug === family.slug ? (
                          <Check size={12} className="text-[#57c5cc]" />
                        ) : (
                          <Copy size={12} className="text-foreground/40" />
                        )}
                      </button>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      family.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                        : family.status === 'SUSPENDED'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                        : 'bg-foreground/5 text-foreground/60 border border-border'
                    }`}
                  >
                    {family.status}
                  </span>
                </div>

                {family.description ? (
                  <p className="text-xs text-foreground/70 line-clamp-2 mb-4 leading-relaxed">
                    {family.description}
                  </p>
                ) : (
                  <p className="text-xs text-foreground/40 italic mb-4">No description provided</p>
                )}

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-background border border-border rounded-xl mb-4 text-xs">
                  <button
                    onClick={() => handleOpenLinkedModal(family, 'categories')}
                    className="flex items-center gap-2 text-left hover:text-cyan-600 transition-colors cursor-pointer"
                  >
                    <FolderTree size={16} className="text-cyan-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground">{family.categoriesCount ?? 0}</div>
                      <div className="text-[10px] text-foreground/50">Categories</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenLinkedModal(family, 'products')}
                    className="flex items-center gap-2 text-left hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    <Box size={16} className="text-purple-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground">{family.productsCount ?? 0}</div>
                      <div className="text-[10px] text-foreground/50">Products</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="text-[11px] text-foreground/60">
                  {family.requiresAdminApproval ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                      <ShieldCheck size={14} /> Approval Req.
                    </span>
                  ) : (
                    <span className="text-foreground/40">Direct Setup</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenLinkedModal(family)}
                    className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(family)}
                    className="p-1.5 text-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingFamily(family)}
                    className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-foreground/60">
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-foreground">{total}</span> families
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-foreground px-3 py-1.5 bg-background border border-border rounded-xl">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          CREATE / EDIT FAMILY MODAL
         ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingFamily ? 'Edit Family' : 'Add New Family'}
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Define family classification, slug url, and approval policies
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Family Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geotrix, Thermox, Industrial Series"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">
                    Slug URL
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-foreground/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="rounded border-border text-[#57c5cc] focus:ring-[#57c5cc]"
                    />
                    <span>Auto-generate</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. geotrix-series"
                  value={formData.slug}
                  disabled={autoSlug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 disabled:opacity-60 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of products and target industries under this family..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground font-medium cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Admin Approval
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground/80">
                      <input
                        type="checkbox"
                        checked={formData.requiresAdminApproval}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            requiresAdminApproval: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-border text-[#57c5cc] focus:ring-[#57c5cc]"
                      />
                      <span>Require Approval</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-border text-foreground/80 rounded-xl text-xs font-medium hover:bg-background transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{editingFamily ? 'Save Changes' : 'Create Family'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          LINKED ITEMS MODAL (Categories & Products in this family)
         ========================================================= */}
      {linkedModalFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold">
                  {linkedModalFamily.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{linkedModalFamily.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      {linkedModalFamily.status}
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-foreground/50">slug: {linkedModalFamily.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setLinkedModalFamily(null)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 pt-4 pb-2 shrink-0 border-b border-border">
              <button
                onClick={() => setLinkedActiveTab('categories')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  linkedActiveTab === 'categories'
                    ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40'
                    : 'text-foreground/60 hover:bg-background'
                }`}
              >
                <FolderTree size={16} />
                <span>Linked Categories ({linkedCategories.length})</span>
              </button>

              <button
                onClick={() => setLinkedActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  linkedActiveTab === 'products'
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40'
                    : 'text-foreground/60 hover:bg-background'
                }`}
              >
                <Box size={16} />
                <span>Linked Products ({linkedProducts.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4">
              {loadingLinked ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-2"></div>
                  <p className="text-xs text-foreground/60 font-medium">Fetching linked ecosystem data...</p>
                </div>
              ) : linkedActiveTab === 'categories' ? (
                linkedCategories.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-2xl border border-border">
                    <FolderOpen size={32} className="text-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No categories linked yet</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Assign categories to this family in the Categories dashboard.
                    </p>
                    <button
                      onClick={() => {
                        setLinkedModalFamily(null);
                        router.push('/dashboard/categories');
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Go to Categories
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {linkedCategories.map((cat) => (
                      <div
                        key={cat._id}
                        className="flex items-center justify-between p-3.5 bg-background hover:bg-foreground/[0.02] border border-border rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center font-bold text-sm shrink-0">
                              {cat.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground text-sm">{cat.name}</div>
                            <div className="text-xs text-foreground/50 font-mono">slug: {cat.slug}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cat.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-foreground/5 text-foreground/60 border border-border'
                            }`}
                          >
                            {cat.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Products Tab */
                linkedProducts.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-2xl border border-border">
                    <Box size={32} className="text-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No products linked yet</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Add products under this family in the Products dashboard.
                    </p>
                    <button
                      onClick={() => {
                        setLinkedModalFamily(null);
                        router.push('/dashboard/products/add');
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {linkedProducts.map((prod) => (
                      <div
                        key={prod._id}
                        className="flex items-center justify-between p-3.5 bg-background hover:bg-foreground/[0.02] border border-border rounded-xl transition-colors"
                      >
                        <div>
                          <div className="font-bold text-foreground text-sm">{prod.name}</div>
                          <div className="text-xs text-foreground/50 flex items-center gap-2 mt-0.5">
                            {prod.category && (
                              <span className="text-[#57c5cc] font-medium">
                                Cat: {prod.category.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              prod.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-foreground/5 text-foreground/60 border border-border'
                            }`}
                          >
                            {prod.status}
                          </span>
                          <button
                            onClick={() => {
                              setLinkedModalFamily(null);
                              router.push(`/dashboard/products/${prod._id}/edit`);
                            }}
                            className="p-1.5 text-foreground/40 hover:text-emerald-600 rounded-lg hover:bg-surface cursor-pointer"
                            title="Edit Product"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const famId = linkedModalFamily._id;
                  setLinkedModalFamily(null);
                  router.push(`/dashboard/products?family=${famId}`);
                }}
                className="text-xs font-semibold text-[#57c5cc] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Family Products in Products Table</span>
                <ExternalLink size={14} />
              </button>

              <button
                onClick={() => setLinkedModalFamily(null)}
                className="px-4 py-2 bg-surface border border-border hover:bg-background text-foreground rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION DIALOG
         ========================================================= */}
      {deletingFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Delete Family</h3>
            <p className="text-xs text-foreground/70 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">&quot;{deletingFamily.name}&quot;</strong>?
              This family will be archived. Linked categories and products will retain their existing data.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingFamily(null)}
                className="px-4 py-2 border border-border text-foreground/80 rounded-xl text-xs font-medium hover:bg-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Family'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
