"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  FolderOpen,
  ArrowUpDown,
  ListOrdered
} from 'lucide-react';

interface Family {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  family?: Family | string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  familiesLinked: number;
  totalProducts: number;
}

interface LinkedItemProduct {
  _id: string;
  name: string;
  status: string;
  family?: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Stats (Catalog Overview, Unfiltered)
  const [globalStats, setGlobalStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    familiesLinked: 0,
    totalProducts: 0,
  });

  // Filter & Query States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('order_asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    family: '',
    sortOrder: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Linked Products Modal
  const [linkedModalCategory, setLinkedModalCategory] = useState<Category | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<LinkedItemProduct[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);

  // Delete Confirm Dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Action Feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Auto-generate slug from category name
  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug
        ? val
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : prev.slug,
    }));
  };

  // 1. Fetch Families for Dropdown
  const loadFamilies = useCallback(async () => {
    try {
      const res = await fetchApi('/api/families?limit=0');
      if (res && res.success && res.data) {
        setFamilies(res.data);
      }
    } catch (err) {
      console.error('Failed to load families:', err);
    }
  }, []);

  // 2. Fetch Global Stats
  const loadGlobalStats = useCallback(async () => {
    try {
      const res = await fetchApi('/admin/categories/stats');
      if (res && res.success && res.data) {
        setGlobalStats(res.data);
      } else {
        const fallbackRes = await fetchApi('/api/categories/stats');
        if (fallbackRes && fallbackRes.success && fallbackRes.data) {
          setGlobalStats(fallbackRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load category global stats:', err);
    }
  }, []);

  // 3. Fetch Categories List
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedFamily !== 'ALL') params.append('family', selectedFamily);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/admin/categories?${params.toString()}`);
      if (res && res.success) {
        setCategories(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotal(res.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        const fallbackRes = await fetchApi(`/api/categories?${params.toString()}`);
        if (fallbackRes && fallbackRes.success) {
          setCategories(fallbackRes.data || []);
          if (fallbackRes.pagination) {
            setTotal(fallbackRes.pagination.total);
            setTotalPages(fallbackRes.pagination.totalPages || 1);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFamily, selectedStatus, sortBy, page, limit]);

  useEffect(() => {
    loadFamilies();
    loadGlobalStats();
  }, [loadFamilies, loadGlobalStats]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filter Event Handlers
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleFamilyFilter = (val: string) => {
    setSelectedFamily(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setSelectedStatus(val);
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
    setSelectedFamily('ALL');
    setSelectedStatus('ALL');
    setSortBy('order_asc');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' || selectedFamily !== 'ALL' || selectedStatus !== 'ALL' || sortBy !== 'order_asc';

  // Copy slug helper
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Helper to extract family display
  const getFamilyName = (cat: Category) => {
    if (!cat.family) return null;
    if (typeof cat.family === 'object' && cat.family.name) return cat.family.name;
    const found = families.find((f) => f._id === cat.family);
    return found ? found.name : null;
  };

  const getFamilyId = (cat: Category) => {
    if (!cat.family) return '';
    if (typeof cat.family === 'object' && cat.family._id) return cat.family._id;
    return String(cat.family);
  };

  // Quick Status Toggle
  const handleQuickStatusToggle = async (cat: Category) => {
    const nextStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdatingId(cat._id);
    try {
      const res = await fetchApi(`/admin/categories/${cat._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res && res.success) {
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, status: nextStatus } : c))
        );
        loadGlobalStats();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Upload Image Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFormError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('http://localhost:4000/api/uploads', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
      } else {
        setFormError(data.message || 'Failed to upload image');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setFormError('Error uploading image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      family: selectedFamily !== 'ALL' ? selectedFamily : '',
      sortOrder: 0,
      status: 'ACTIVE',
    });
    setAutoSlug(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      family: getFamilyId(cat),
      sortOrder: cat.sortOrder || 0,
      status: cat.status || 'ACTIVE',
    });
    setAutoSlug(false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Category Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image.trim() || undefined,
        family: formData.family || undefined,
        sortOrder: Number(formData.sortOrder) || 0,
        status: formData.status,
      };

      let res;
      if (editingCategory) {
        res = await fetchApi(`/admin/categories/${editingCategory._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res && res.success) {
        setIsModalOpen(false);
        loadCategories();
        loadGlobalStats();
      } else {
        setFormError(res?.message || 'Failed to save category');
      }
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || 'Error saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/admin/categories/${deletingCategory._id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setDeletingCategory(null);
        loadCategories();
        loadGlobalStats();
      } else {
        alert(res?.message || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Linked Products Modal
  const handleOpenLinkedProducts = async (cat: Category) => {
    setLinkedModalCategory(cat);
    setLoadingLinked(true);
    try {
      const res = await fetchApi(`/admin/categories/${cat._id}/linked`);
      if (res && res.success && res.data) {
        setLinkedProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load linked products:', err);
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
              Product Categories
            </h1>
            <span className="bg-[#57c5cc]/10 text-[#57c5cc] font-semibold text-xs px-2.5 py-1 rounded-full">
              {globalStats.totalCategories} Total in Catalog
            </span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Organize catalog classifications, banner images, sort orders, and parent brand families
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
            onClick={loadCategories}
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
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Global Stat Cards (Catalog Overview - Matching Products Page) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FolderTree size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Categories</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalCategories}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Active Published</p>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">
                {globalStats.totalCategories > 0
                  ? `${Math.round((globalStats.activeCategories / globalStats.totalCategories) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.activeCategories}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Linked Families</p>
              <span className="text-[10px] text-foreground/40 font-mono">(Brands)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.familiesLinked}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Box size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Products</p>
              <span className="text-[10px] text-purple-600 font-mono font-bold">Categorized</span>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search category name, slug, or description..."
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
                onChange={(e) => handleLimitChange(Number(e.target.value))}
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
          {/* Family Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Parent Family</label>
            <select
              value={selectedFamily}
              onChange={(e) => handleFamilyFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Families</option>
              {families.map((fam) => (
                <option key={fam._id} value={fam._id}>
                  {fam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="order_asc">Sort Order (0-9)</option>
              <option value="order_desc">Sort Order (High-Low)</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="newest">Newest First</option>
              <option value="products_desc">Most Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-3"></div>
          <p className="text-sm font-medium text-foreground/60">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-foreground/40 mx-auto mb-3">
            <FolderTree size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No categories found</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No categories matched your active search or filter criteria. Try resetting filters.'
              : 'Get started by adding your first product category.'}
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
              Add Category
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
                  <th className="py-3.5 px-4 sm:px-6">Category Info</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Parent Family</th>
                  <th className="py-3.5 px-4 text-center">Sort Order</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Linked Products</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {categories.map((cat) => {
                  const familyName = getFamilyName(cat);
                  const familyId = getFamilyId(cat);

                  return (
                    <tr key={cat._id} className="hover:bg-foreground/[0.02] transition-colors group">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-11 h-11 rounded-xl object-cover border border-border shrink-0 bg-background"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#57c5cc]/10 border border-[#57c5cc]/20 flex items-center justify-center text-[#57c5cc] font-bold text-sm shrink-0">
                              {cat.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground group-hover:text-[#57c5cc] transition-colors">
                              {cat.name}
                            </div>
                            {cat.description ? (
                              <div className="text-xs text-foreground/60 line-clamp-1 max-w-xs sm:max-w-md">
                                {cat.description}
                              </div>
                            ) : (
                              <div className="text-xs text-foreground/40 italic">No description</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleCopySlug(cat.slug)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background hover:bg-foreground/5 text-foreground/80 border border-border rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                          title="Click to copy slug"
                        >
                          <span>{cat.slug}</span>
                          {copiedSlug === cat.slug ? (
                            <Check size={12} className="text-[#57c5cc]" />
                          ) : (
                            <Copy size={12} className="text-foreground/40" />
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        {familyName ? (
                          <button
                            onClick={() => handleFamilyFilter(familyId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Filter by this family"
                          >
                            <Layers size={14} />
                            <span>{familyName}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-foreground/40 italic">Standalone</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-background border border-border text-foreground/80">
                          #{cat.sortOrder ?? 0}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleQuickStatusToggle(cat)}
                          disabled={statusUpdatingId === cat._id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                            cat.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-foreground/5 text-foreground/60 border border-border'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-foreground/40'
                            }`}
                          />
                          <span>{cat.status}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenLinkedProducts(cat)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="View linked products"
                        >
                          <Box size={14} />
                          <span>{cat.productsCount ?? 0} Products</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenLinkedProducts(cat)}
                            className="p-1.5 text-foreground/40 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                            title="View category details & products"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const familyName = getFamilyName(cat);
            const familyId = getFamilyId(cat);

            return (
              <div
                key={cat._id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#57c5cc]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-background"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 border border-[#57c5cc]/20 flex items-center justify-center text-[#57c5cc] font-bold text-lg shrink-0">
                          {cat.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground text-base">{cat.name}</h3>
                        <button
                          onClick={() => handleCopySlug(cat.slug)}
                          className="inline-flex items-center gap-1 text-xs font-mono text-foreground/60 hover:text-foreground cursor-pointer"
                          title="Click to copy slug"
                        >
                          <span>{cat.slug}</span>
                          {copiedSlug === cat.slug ? (
                            <Check size={12} className="text-[#57c5cc]" />
                          ) : (
                            <Copy size={12} className="text-foreground/40" />
                          )}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-foreground/5 text-foreground/60 border border-border'
                      }`}
                    >
                      {cat.status}
                    </span>
                  </div>

                  {cat.description ? (
                    <p className="text-xs text-foreground/70 line-clamp-2 mb-4 leading-relaxed">
                      {cat.description}
                    </p>
                  ) : (
                    <p className="text-xs text-foreground/40 italic mb-4">No description provided</p>
                  )}

                  {/* Metrics & Meta */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-background border border-border rounded-xl mb-4 text-xs">
                    <div>
                      <div className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                        Family
                      </div>
                      <div className="font-bold text-foreground truncate mt-0.5">
                        {familyName ? (
                          <span className="text-indigo-600 dark:text-indigo-400">{familyName}</span>
                        ) : (
                          <span className="text-foreground/40 italic">None</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenLinkedProducts(cat)}
                      className="text-left hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                        Products
                      </div>
                      <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                        <Box size={14} />
                        <span>{cat.productsCount ?? 0}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-foreground/60 flex items-center gap-1">
                    <ListOrdered size={14} className="text-foreground/40" />
                    <span>Order: #{cat.sortOrder ?? 0}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenLinkedProducts(cat)}
                      className="p-1.5 text-foreground/40 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                      title="View products"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-foreground/60">
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-foreground">{total}</span> categories
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
          CREATE / EDIT CATEGORY MODAL
         ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Configure name, parent family, cover picture, and display priority
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
              {/* Category Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Category Image / Thumbnail
                </label>
                <div className="flex items-center gap-4">
                  {formData.image ? (
                    <div className="relative w-20 h-20 rounded-2xl border border-border overflow-hidden bg-background shrink-0">
                      <img
                        src={formData.image}
                        alt="Category Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-foreground/40 shrink-0 bg-background">
                      <ImageIcon size={24} />
                      <span className="text-[10px] mt-1 font-medium">No Image</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-background hover:bg-foreground/5 border border-border text-foreground/80 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Upload size={14} className={isUploadingImage ? 'animate-bounce text-[#57c5cc]' : ''} />
                      <span>{isUploadingImage ? 'Uploading image...' : formData.image ? 'Replace Image' : 'Upload Image'}</span>
                    </button>
                    <p className="text-[11px] text-foreground/40 mt-1.5">PNG, JPG, WEBP recommended</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Temperature Sensors, GPS Receivers, Controllers"
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
                  placeholder="e.g. temperature-sensors"
                  value={formData.slug}
                  disabled={autoSlug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 disabled:opacity-60 text-foreground"
                />
              </div>

              {/* Family Dropdown (Dynamic) */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Parent Brand Family
                </label>
                <select
                  value={formData.family}
                  onChange={(e) => setFormData((prev) => ({ ...prev, family: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground font-medium cursor-pointer"
                >
                  <option value="">No Family (Standalone Category)</option>
                  {families.map((fam) => (
                    <option key={fam._id} value={fam._id}>
                      {fam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground"
                  />
                  <span className="text-[10px] text-foreground/40">Lower numbers appear first</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE',
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground font-medium cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide a helpful summary of this category for store browsing..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground"
                />
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
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          LINKED PRODUCTS MODAL
         ========================================================= */}
      {linkedModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {linkedModalCategory.image ? (
                  <img
                    src={linkedModalCategory.image}
                    alt={linkedModalCategory.name}
                    className="w-11 h-11 rounded-xl object-cover border border-border shrink-0 bg-background"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#57c5cc]/10 border border-[#57c5cc]/20 flex items-center justify-center text-[#57c5cc] font-bold text-sm shrink-0">
                    {linkedModalCategory.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{linkedModalCategory.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#57c5cc]/10 text-[#57c5cc]">
                      {linkedModalCategory.status}
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-foreground/50">slug: {linkedModalCategory.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setLinkedModalCategory(null)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  Products in this Category ({linkedProducts.length})
                </span>
                <button
                  onClick={() => {
                    const catId = linkedModalCategory._id;
                    setLinkedModalCategory(null);
                    router.push(`/dashboard/products?category=${catId}`);
                  }}
                  className="text-xs font-semibold text-[#57c5cc] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Products Table</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              {loadingLinked ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-2"></div>
                  <p className="text-xs text-foreground/60 font-medium">Fetching category products...</p>
                </div>
              ) : linkedProducts.length === 0 ? (
                <div className="text-center py-12 bg-background rounded-2xl border border-border">
                  <Box size={32} className="text-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No products assigned yet</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Assign this category when creating or editing products.
                  </p>
                  <button
                    onClick={() => {
                      setLinkedModalCategory(null);
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
                          {prod.family && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              Family: {prod.family.name}
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
                            setLinkedModalCategory(null);
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-end shrink-0">
              <button
                onClick={() => setLinkedModalCategory(null)}
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
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Delete Category</h3>
            <p className="text-xs text-foreground/70 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">&quot;{deletingCategory.name}&quot;</strong>?
              This category will be archived. Linked products will retain their records.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
                {isDeleting ? 'Deleting...' : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
