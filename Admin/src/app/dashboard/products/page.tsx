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
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  Boxes,
  ExternalLink,
  Check,
  Copy,
  Zap,
  ListFilter
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
  family?: any;
}

interface DefaultVariant {
  _id: string;
  variantName: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnail?: string;
}

interface Product {
  _id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  family?: Family;
  category?: Category;
  variantsCount?: number;
  totalStock?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  defaultVariant?: DefaultVariant | null;
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CatalogStats {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  outOfStockCount: number;
  lowStockCount: number;
}

export default function ProductsPage() {
  const router = useRouter();

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Stats (Shows TOTAL catalog numbers irrespective of current filters)
  const [globalStats, setGlobalStats] = useState<CatalogStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalVariants: 0,
    outOfStockCount: 0,
    lowStockCount: 0
  });

  // Filter & Query States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'' | 'in_stock' | 'low_stock' | 'out_of_stock'>('');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Quick View / Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<any[]>([]);
  const [loadingQuickVariants, setLoadingQuickVariants] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Load Global Stats (Catalog totals independent of filters)
  const loadGlobalStats = async () => {
    try {
      const statsRes = await fetchApi('/admin/products/stats');
      if (statsRes.success && statsRes.data) {
        setGlobalStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load global stats', err);
    }
  };

  // Load Families on mount
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const famRes = await fetchApi('/api/families');
        if (famRes.success && Array.isArray(famRes.data)) {
          setFamilies(famRes.data);
        }
      } catch (err) {
        console.error('Failed to load families', err);
      }
    };
    fetchFamilies();
    loadGlobalStats();
  }, []);

  // Dynamically fetch categories when selectedFamily changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const url = selectedFamily
          ? `/api/categories?family=${selectedFamily}`
          : '/api/categories?limit=1000000';
        const catRes = await fetchApi(url);
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
          if (selectedCategory && !catRes.data.some((c: Category) => c._id === selectedCategory)) {
            setSelectedCategory('');
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, [selectedFamily]);

  // Fetch Products based on current filters and pagination
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedFamily) params.set('family', selectedFamily);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (selectedStockStatus) params.set('stockStatus', selectedStockStatus);
      if (sortBy) params.set('sort', sortBy);

      const response = await fetchApi(`/admin/products?${params.toString()}`);
      if (response.success) {
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.items || response.data?.data || [];
        setProducts(items);

        const count = response.data?.total ?? items.length;
        setTotal(count);
        setTotalPages(response.data?.totalPages ?? Math.max(1, Math.ceil(count / limit)));
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, selectedFamily, selectedCategory, selectedStatus, selectedStockStatus, sortBy]);

  // Debounced load on search or filter change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(handler);
  }, [loadProducts]);

  // Quick View Modal Opener
  const handleOpenQuickView = async (product: Product) => {
    setQuickViewProduct(product);
    setLoadingQuickVariants(true);
    try {
      const res = await fetchApi(`/admin/products/${product._id}/variants`);
      if (res.success && Array.isArray(res.data)) {
        setQuickViewVariants(res.data);
      } else {
        setQuickViewVariants([]);
      }
    } catch (err) {
      console.error('Failed to load product variants', err);
      setQuickViewVariants([]);
    } finally {
      setLoadingQuickVariants(false);
    }
  };

  // Toggle Product Status (ACTIVE / INACTIVE)
  const handleToggleStatus = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdatingId(product._id);
    try {
      const res = await fetchApi(`/admin/products/${product._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        setProducts(prev =>
          prev.map(p => (p._id === product._id ? { ...p, status: newStatus } : p))
        );
        loadGlobalStats();
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${product.name}" and all its variants?`)) {
      return;
    }
    try {
      const res = await fetchApi(`/admin/products/${product._id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        loadProducts();
        loadGlobalStats();
      } else {
        alert(res.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  // Copy SKU helper
  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFamily('');
    setSelectedCategory('');
    setSelectedStatus('ALL');
    setSelectedStockStatus('');
    setSortBy('createdAt:desc');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedFamily !== '' ||
    selectedCategory !== '' ||
    selectedStatus !== 'ALL' ||
    selectedStockStatus !== '' ||
    sortBy !== 'createdAt:desc';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Products Catalog</h1>
            <span className="bg-[#57c5cc]/10 text-[#57c5cc] font-semibold text-xs px-2.5 py-1 rounded-full">
              {globalStats.totalProducts} Total in Catalog
            </span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Search, filter, manage product families, variants, stock, and price tiers
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push('/dashboard/products/add')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#57c5cc] hover:bg-[#45a0a6] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Create Product Family</span>
          </button>
        </div>
      </div>

      {/* KPI / GLOBAL STATS BANNER (Displays Catalog Totals - NOT Filter Dependent) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Box size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Catalog</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalProducts}</p>
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
                {globalStats.totalProducts > 0
                  ? `${Math.round((globalStats.activeProducts / globalStats.totalProducts) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.activeProducts}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Variants</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All SKUs)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalVariants}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Low / Out of Stock</p>
              <span className="text-[10px] text-amber-600 font-mono font-bold">
                {globalStats.outOfStockCount} zero
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {globalStats.lowStockCount + globalStats.outOfStockCount}
            </p>
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
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name, SKU, or variant spec..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RefreshCw size={13} />
                <span>Reset Filters</span>
              </button>
            )}

            <div className="flex items-center bg-background border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-surface text-[#57c5cc] shadow-xs'
                    : 'text-foreground/50 hover:text-foreground'
                }`}
                title="Table View"
              >
                <LayoutList size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-surface text-[#57c5cc] shadow-xs'
                    : 'text-foreground/50 hover:text-foreground'
                }`}
                title="Grid / Card View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdowns Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-border">
          {/* Family Dropdown */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Product Family</label>
            <select
              value={selectedFamily}
              onChange={e => {
                setSelectedFamily(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
            >
              <option value="">All Families</option>
              {families.map(f => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">
              Category {selectedFamily && <span className="text-[#57c5cc]">(Filtered)</span>}
            </label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">Stock Availability</label>
            <select
              value={selectedStockStatus}
              onChange={e => {
                setSelectedStockStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
            >
              <option value="">All Inventory Levels</option>
              <option value="in_stock">In Stock (&gt; 0)</option>
              <option value="low_stock">Low Stock (1 - 10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-foreground/60 mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="name:asc">Name (A → Z)</option>
              <option value="name:desc">Name (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Current Table Items Count Banner */}
        <div className="flex items-center justify-between text-xs text-foreground/60 pt-1">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-bold text-foreground">{products.length}</span> of{' '}
              <span className="font-bold text-foreground">{total}</span> matching products
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] bg-background px-2 py-0.5 rounded-md border border-border text-foreground/50">
                (Filtered from {globalStats.totalProducts} total)
              </span>
            )}
          </div>

          <span className="text-[11px] text-foreground/50">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-16 flex flex-col items-center justify-center gap-3 text-foreground/60">
          <div className="w-8 h-8 border-3 border-[#57c5cc] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading catalog products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center mx-auto mb-4">
            <PackageOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Products Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto mt-1">
            {hasActiveFilters
              ? 'No products matched your active filters or search term. Try resetting your search filters.'
              : 'Start by creating your first product family and adding variation specifications.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-background border border-border hover:bg-surface text-foreground transition-all"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/products/add')}
                className="flex items-center gap-2 bg-[#57c5cc] text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:bg-[#45a0a6]"
              >
                <Plus size={16} /> Create Product
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background text-foreground/70 font-semibold border-b border-border text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Family & Category</th>
                  <th className="px-6 py-4 text-center">Variants</th>
                  <th className="px-6 py-4">Price Range</th>
                  <th className="px-6 py-4">Inventory</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground/90">
                {products.map(product => {
                  const defaultVar = product.defaultVariant;
                  const thumb = product.thumbnail || defaultVar?.thumbnail;
                  const minPrice = product.priceRange?.min || defaultVar?.price || 0;
                  const maxPrice = product.priceRange?.max || defaultVar?.price || 0;
                  const totalStock = product.totalStock ?? defaultVar?.stock ?? 0;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-background/50 transition-colors group cursor-pointer"
                      onClick={() => handleOpenQuickView(product)}
                    >
                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Box size={22} className="text-foreground/30" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm group-hover:text-[#57c5cc] transition-colors">
                              {product.name}
                            </p>
                            {defaultVar?.sku && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-foreground/50 font-mono">
                                  SKU: {defaultVar.sku}
                                </span>
                                <button
                                  onClick={e => handleCopySku(defaultVar.sku, e)}
                                  className="text-foreground/40 hover:text-foreground p-0.5"
                                  title="Copy SKU"
                                >
                                  {copiedSku === defaultVar.sku ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Family & Category */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {product.family?.name ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                              <Box size={12} /> {product.family.name}
                            </span>
                          ) : (
                            <span className="text-xs text-foreground/40">—</span>
                          )}
                          {product.category?.name && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/60">
                              <Tag size={12} /> {product.category.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Variants Count */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenQuickView(product);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#57c5cc]/10 text-[#57c5cc] hover:bg-[#57c5cc]/20 transition-all cursor-pointer"
                        >
                          <Layers size={13} />
                          <span>{product.variantsCount ?? 0} variants</span>
                        </button>
                      </td>

                      {/* Price Range */}
                      <td className="px-6 py-4 font-medium">
                        {minPrice > 0 ? (
                          minPrice === maxPrice ? (
                            <span className="text-foreground font-semibold">₹{minPrice.toLocaleString()}</span>
                          ) : (
                            <span className="text-foreground font-semibold">
                              ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
                            </span>
                          )
                        ) : (
                          <span className="text-foreground/40 text-xs">No price set</span>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              totalStock === 0
                                ? 'bg-rose-500'
                                : totalStock <= 10
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {totalStock === 0 ? (
                              <span className="text-rose-600 font-semibold">Out of Stock</span>
                            ) : (
                              `${totalStock} in stock`
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={e => handleToggleStatus(product, e)}
                          disabled={statusUpdatingId === product._id}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {statusUpdatingId === product._id ? 'Updating...' : product.status || 'ACTIVE'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenQuickView(product)}
                            className="p-2 text-foreground/60 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Quick View Variants"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/products/${product._id}/variants`)}
                            className="p-2 text-foreground/60 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Manage Variants"
                          >
                            <Layers size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
                            className="p-2 text-foreground/60 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={e => handleDeleteProduct(product, e)}
                            className="p-2 text-foreground/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
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
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(product => {
            const defaultVar = product.defaultVariant;
            const thumb = product.thumbnail || defaultVar?.thumbnail;
            const minPrice = product.priceRange?.min || defaultVar?.price || 0;
            const maxPrice = product.priceRange?.max || defaultVar?.price || 0;
            const totalStock = product.totalStock ?? defaultVar?.stock ?? 0;

            return (
              <div
                key={product._id}
                onClick={() => handleOpenQuickView(product)}
                className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-[#57c5cc]/50 transition-all flex flex-col cursor-pointer group"
              >
                {/* Card Thumbnail Top */}
                <div className="relative h-44 bg-background border-b border-border flex items-center justify-center overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-foreground/30">
                      <Box size={40} />
                      <span className="text-xs mt-1">No Image</span>
                    </div>
                  )}

                  {/* Status & Variant Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-xs ${
                        product.status === 'ACTIVE'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {product.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface/90 backdrop-blur-md text-foreground border border-border shadow-xs flex items-center gap-1">
                      <Layers size={12} /> {product.variantsCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-foreground/50 mb-1">
                      {product.family?.name && <span>{product.family.name}</span>}
                      {product.family?.name && product.category?.name && <span>•</span>}
                      {product.category?.name && <span>{product.category.name}</span>}
                    </div>
                    <h3 className="font-bold text-foreground text-base group-hover:text-[#57c5cc] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    {defaultVar?.sku && (
                      <p className="text-xs text-foreground/50 font-mono mt-1">SKU: {defaultVar.sku}</p>
                    )}
                  </div>

                  {/* Price & Stock Stats */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                    <div>
                      <span className="text-xs text-foreground/50 block">Price Range</span>
                      <span className="font-bold text-foreground">
                        {minPrice > 0
                          ? minPrice === maxPrice
                            ? `₹${minPrice.toLocaleString()}`
                            : `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`
                          : 'No price'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-foreground/50 block">Total Stock</span>
                      <span
                        className={`font-semibold ${
                          totalStock === 0
                            ? 'text-rose-600'
                            : totalStock <= 10
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div
                    className="pt-2 flex items-center justify-between gap-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/dashboard/products/${product._id}/variants`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#57c5cc]/10 hover:bg-[#57c5cc]/20 text-[#57c5cc] transition-all cursor-pointer"
                    >
                      <Layers size={14} /> Variants
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
                      className="p-2 rounded-xl text-foreground/60 hover:text-foreground bg-background hover:bg-surface border border-border transition-all cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={e => handleDeleteProduct(product, e)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-all cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && products.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-xs text-foreground/70">
            <span>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-foreground">{total}</span> filtered products
            </span>
            <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-3">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-border bg-background text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-3 py-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-border bg-background text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* QUICK VIEW SLIDE-OVER / MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-border max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center shrink-0">
                  <Box size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{quickViewProduct.name}</h2>
                  <p className="text-xs text-foreground/60">
                    {quickViewProduct.family?.name || 'No Family'} • {quickViewProduct.category?.name || 'No Category'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - List of Variants */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-[#57c5cc]" />
                  <span>Configured Variants ({quickViewVariants.length})</span>
                </h3>
                <button
                  onClick={() => router.push(`/dashboard/products/${quickViewProduct._id}/variants`)}
                  className="text-xs font-semibold text-[#57c5cc] hover:underline flex items-center gap-1"
                >
                  <span>Open Full Variant Studio</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {loadingQuickVariants ? (
                <div className="p-12 text-center text-foreground/60 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#57c5cc] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs">Loading variant specifications...</p>
                </div>
              ) : quickViewVariants.length === 0 ? (
                <div className="p-8 text-center bg-background rounded-xl border border-dashed border-border">
                  <p className="text-sm font-medium text-foreground">No variants added yet</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Add variations like size, color, or material to make this product purchasable.
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/products/${quickViewProduct._id}/variants`)}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#57c5cc] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add First Variant
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quickViewVariants.map(v => (
                    <div
                      key={v._id || v.id}
                      className="p-4 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {v.thumbnail || v.images?.[0]?.url ? (
                            <img
                              src={v.thumbnail || v.images?.[0]?.url}
                              alt={v.variantName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Box size={20} className="text-foreground/30" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{v.variantName}</span>
                            {v.isDefault && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#57c5cc]/10 text-[#57c5cc]">
                                DEFAULT
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                v.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {v.status || 'ACTIVE'}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/50 font-mono mt-0.5">
                            SKU: {v.sku || 'N/A'} • Unit: {v.unit || 'pcs'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-xs text-foreground/50">Price</p>
                          <div className="flex items-center gap-1.5 font-bold">
                            {v.discountPrice ? (
                              <>
                                <span className="text-emerald-600">₹{v.discountPrice.toLocaleString()}</span>
                                <span className="text-foreground/40 line-through text-xs font-normal">
                                  ₹{v.price.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="text-foreground">₹{v.price?.toLocaleString() || 0}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-foreground/50">Stock</p>
                          <p
                            className={`font-semibold text-sm ${
                              (v.stock ?? 0) <= 0
                                ? 'text-rose-600'
                                : (v.stock ?? 0) <= 5
                                ? 'text-amber-600'
                                : 'text-foreground'
                            }`}
                          >
                            {v.stock ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-background/50 flex justify-end gap-3">
              <button
                onClick={() => setQuickViewProduct(null)}
                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/dashboard/products/${quickViewProduct._id}/variants`)}
                className="px-5 py-2 rounded-xl bg-[#57c5cc] hover:bg-[#45a0a6] text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Layers size={16} /> Manage All Variants
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
