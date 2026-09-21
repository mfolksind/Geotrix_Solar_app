"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '../../../../../utils/api';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Edit2,
  Image as ImageIcon,
  X,
  Save,
  AlertCircle,
  Star,
  Layers,
  Search,
  Check,
  Copy,
  Upload,
  Eye,
  Tag,
  Box,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  FileText,
  Link as LinkIcon,
  Package,
  Minus,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Filter
} from 'lucide-react';

interface VariantImage {
  _id: string;
  url: string;
  isPrimary?: boolean;
}

interface Variant {
  _id: string;
  product?: any;
  variantName: string;
  sku: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  status: 'ACTIVE' | 'INACTIVE';
  images: VariantImage[];
  thumbnail?: string;
  description?: string;
  shortDescription?: string;
  isDefault?: boolean;
  relatedSystems?: any[];
  compatibleProducts?: any[];
  recommendedProducts?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function VariantsPage() {
  const router = useRouter();
  const { id: productId } = useParams();

  // Core Data
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [allSystemVariants, setAllSystemVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState('default');
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'description' | 'relations'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linked Product Studio Picker State (inside form modal)
  const [linkTargetType, setLinkTargetType] = useState<'relatedSystems' | 'compatibleProducts' | 'recommendedProducts'>('relatedSystems');
  const [linkSameFamilyOnly, setLinkSameFamilyOnly] = useState(true);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('');

  // Image Management Modal State
  const [galleryVariant, setGalleryVariant] = useState<Variant | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Field States
  const [variantName, setVariantName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isDefault, setIsDefault] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [relatedSystems, setRelatedSystems] = useState<string[]>([]);
  const [compatibleProducts, setCompatibleProducts] = useState<string[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<string[]>([]);

  // Load product info, variants, all catalog items, and categories
  const loadData = async () => {
    try {
      const [prodRes, varRes, allVarRes, catRes] = await Promise.all([
        fetchApi(`/admin/products/${productId}`),
        fetchApi(`/admin/products/${productId}/variants`),
        fetchApi('/api/products?limit=1000000'),
        fetchApi('/api/categories?limit=1000000')
      ]);

      if (prodRes.success && prodRes.data) {
        setProduct(prodRes.data);
      }
      if (varRes.success && Array.isArray(varRes.data)) {
        setVariants(varRes.data);
      }
      if (allVarRes.success) {
        const list = Array.isArray(allVarRes.data)
          ? allVarRes.data
          : allVarRes.data?.data || allVarRes.data?.items || [];
        setAllSystemVariants(list);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Failed to load product data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  // Current Product's Family ID & Name
  const currentFamilyId = product?.family?._id || (typeof product?.family === 'string' ? product.family : '');
  const currentFamilyName = product?.family?.name || '';

  // Reset Modal Form
  const resetForm = () => {
    setEditingId(null);
    setVariantName('');
    setSku('');
    setSlug('');
    setIsSlugManuallyEdited(false);
    setUnit('pcs');
    setPrice('');
    setDiscountPrice('');
    setStock('0');
    setWeight('');
    setDimensions('');
    setStatus('ACTIVE');
    setIsDefault(false);
    setShortDescription('');
    setDescription('');
    setRelatedSystems([]);
    setCompatibleProducts([]);
    setRecommendedProducts([]);
    setActiveTab('general');
    setLinkSameFamilyOnly(true);
    setLinkSearchTerm('');
    setLinkCategoryFilter('');
  };

  // Open Modal for Creating Variant
  const handleOpenCreateModal = () => {
    resetForm();
    const nextNum = variants.length + 1;
    const prodCode = (product?.name || 'PROD')
      .substring(0, 4)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    setSku(`${prodCode}-V${nextNum}`);
    if (variants.length === 0) {
      setIsDefault(true);
    }
    setIsFormModalOpen(true);
  };

  // Open Modal for Editing Variant
  const handleOpenEditModal = (v: Variant) => {
    setEditingId(v._id);
    setVariantName(v.variantName || '');
    setSku(v.sku || '');
    setSlug(v.slug || '');
    setIsSlugManuallyEdited(true);
    setUnit(v.unit || 'pcs');
    setPrice(v.price != null ? String(v.price) : '');
    setDiscountPrice(v.discountPrice != null ? String(v.discountPrice) : '');
    setStock(v.stock != null ? String(v.stock) : '0');
    setWeight(v.weight != null ? String(v.weight) : '');
    setDimensions(v.dimensions || '');
    setStatus(v.status || 'ACTIVE');
    setIsDefault(!!v.isDefault);
    setShortDescription(v.shortDescription || '');
    setDescription(v.description || '');

    const extractIds = (arr: any) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map((item: any) => (typeof item === 'object' ? item._id || item.id : item));
    };

    setRelatedSystems(extractIds(v.relatedSystems));
    setCompatibleProducts(extractIds(v.compatibleProducts));
    setRecommendedProducts(extractIds(v.recommendedProducts));

    setActiveTab('general');
    setLinkSameFamilyOnly(true);
    setLinkSearchTerm('');
    setLinkCategoryFilter('');
    setIsFormModalOpen(true);
  };

  // Auto-slugify
  const handleVariantNameChange = (val: string) => {
    setVariantName(val);
    if (!isSlugManuallyEdited) {
      const generated = `${product?.name || ''} ${val}`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  // Auto-generate SKU
  const handleGenerateSku = () => {
    const prodPart = (product?.name || 'PRD')
      .split(' ')
      .map((w: string) => w.substring(0, 2))
      .join('')
      .substring(0, 6)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const varPart = variantName
      ? variantName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')
      : 'V1';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prodPart}-${varPart}-${rand}`);
  };

  // Submit Variant Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantName.trim()) {
      alert('Variant name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      alert('A valid base price is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        variantName: variantName.trim(),
        sku: sku.trim() || undefined,
        slug: slug.trim() || undefined,
        unit: unit.trim() || 'pcs',
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        stock: parseInt(stock) || 0,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions: dimensions.trim() || undefined,
        status,
        isDefault,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        relatedSystems,
        compatibleProducts,
        recommendedProducts
      };

      if (editingId) {
        const res = await fetchApi(`/admin/products/variants/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setIsFormModalOpen(false);
          loadData();
        } else {
          alert(res.message || 'Failed to update variant');
        }
      } else {
        const res = await fetchApi(`/admin/products/${productId}/variants`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setIsFormModalOpen(false);
          loadData();
        } else {
          alert(res.message || 'Failed to add variant');
        }
      }
    } catch (err: any) {
      alert(err?.data?.message || err?.message || 'Error saving variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set Default Variant
  const handleSetDefaultVariant = async (variantId: string) => {
    try {
      const res = await fetchApi(`/admin/products/variants/${variantId}/default`, {
        method: 'PATCH',
        body: JSON.stringify({ productId })
      });
      if (res.success) {
        setVariants(prev =>
          prev.map(v => ({
            ...v,
            isDefault: v._id === variantId
          }))
        );
      }
    } catch (err) {
      console.error('Failed to set default variant', err);
    }
  };

  // Quick Stock Adjustment
  const handleAdjustStock = async (variant: Variant, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStock = Math.max(0, (variant.stock || 0) + delta);
    try {
      const res = await fetchApi(`/admin/products/variants/${variant._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock })
      });
      if (res.success) {
        setVariants(prev =>
          prev.map(v => (v._id === variant._id ? { ...v, stock: newStock } : v))
        );
      }
    } catch (err) {
      console.error('Failed to update stock', err);
    }
  };

  // Toggle Variant Status
  const handleToggleVariantStatus = async (variant: Variant, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = variant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetchApi(`/admin/products/variants/${variant._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        setVariants(prev =>
          prev.map(v => (v._id === variant._id ? { ...v, status: newStatus } : v))
        );
      }
    } catch (err) {
      console.error('Failed to toggle variant status', err);
    }
  };

  // Delete Variant
  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const res = await fetchApi(`/admin/products/variants/${variantId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Failed to delete variant');
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error deleting variant');
    }
  };

  // Image Upload for Variant
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !galleryVariant) return;
    setIsUploadingImg(true);

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetchApi('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (uploadRes.success) {
        const isFirstImage = !(galleryVariant.images && galleryVariant.images.length > 0);
        const attachRes = await fetchApi(`/admin/products/${productId}/images`, {
          method: 'POST',
          body: JSON.stringify({
            variantId: galleryVariant._id,
            url: uploadRes.data.url,
            publicId: uploadRes.data.publicId,
            isPrimary: isFirstImage
          })
        });

        if (attachRes.success) {
          const varRes = await fetchApi(`/admin/products/${productId}/variants`);
          if (varRes.success) {
            setVariants(varRes.data);
            const updated = varRes.data.find((v: Variant) => v._id === galleryVariant._id);
            if (updated) setGalleryVariant(updated);
          }
        }
      } else {
        alert(uploadRes.message || 'Failed to upload image');
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error uploading image');
    } finally {
      setIsUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Set Primary Image
  const handleSetPrimaryImage = async (imageId: string) => {
    if (!galleryVariant) return;
    try {
      const res = await fetchApi(`/admin/products/images/${imageId}/primary`, {
        method: 'PATCH',
        body: JSON.stringify({ variantId: galleryVariant._id })
      });
      if (res.success) {
        const varRes = await fetchApi(`/admin/products/${productId}/variants`);
        if (varRes.success) {
          setVariants(varRes.data);
          const updated = varRes.data.find((v: Variant) => v._id === galleryVariant._id);
          if (updated) setGalleryVariant(updated);
        }
      }
    } catch (err) {
      console.error('Failed to set primary image', err);
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!galleryVariant || !confirm('Delete this image?')) return;
    try {
      const res = await fetchApi(`/admin/products/images/${imageId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        const varRes = await fetchApi(`/admin/products/${productId}/variants`);
        if (varRes.success) {
          setVariants(varRes.data);
          const updated = varRes.data.find((v: Variant) => v._id === galleryVariant._id);
          if (updated) setGalleryVariant(updated);
        }
      }
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  // Copy SKU
  const handleCopySku = (skuStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skuStr);
    setCopiedSku(skuStr);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Linked Product Studio: Helper to toggle link status
  const handleToggleLink = (targetVariantId: string, type: 'relatedSystems' | 'compatibleProducts' | 'recommendedProducts') => {
    if (type === 'relatedSystems') {
      setRelatedSystems(prev =>
        prev.includes(targetVariantId)
          ? prev.filter(id => id !== targetVariantId)
          : [...prev, targetVariantId]
      );
    } else if (type === 'compatibleProducts') {
      setCompatibleProducts(prev =>
        prev.includes(targetVariantId)
          ? prev.filter(id => id !== targetVariantId)
          : [...prev, targetVariantId]
      );
    } else if (type === 'recommendedProducts') {
      setRecommendedProducts(prev =>
        prev.includes(targetVariantId)
          ? prev.filter(id => id !== targetVariantId)
          : [...prev, targetVariantId]
      );
    }
  };

  // Filtered list of system variants for the Linked Product Picker
  const availableLinkedVariants = useMemo(() => {
    return allSystemVariants.filter(v => {
      if (v._id === editingId) return false;

      // Extract family of target variant
      const targetProduct = v.product;
      const targetFamilyId =
        typeof targetProduct === 'object'
          ? targetProduct?.family?._id || targetProduct?.family
          : '';

      // Same Family filter
      if (linkSameFamilyOnly && currentFamilyId) {
        if (String(targetFamilyId) !== String(currentFamilyId)) {
          return false;
        }
      }

      // Category filter
      if (linkCategoryFilter) {
        const targetCategoryId =
          typeof targetProduct === 'object'
            ? targetProduct?.category?._id || targetProduct?.category
            : '';
        if (String(targetCategoryId) !== String(linkCategoryFilter)) {
          return false;
        }
      }

      // Search term
      if (linkSearchTerm.trim()) {
        const q = linkSearchTerm.toLowerCase().trim();
        const pName = typeof targetProduct === 'object' ? targetProduct?.name?.toLowerCase() : '';
        const vName = v.variantName?.toLowerCase() || '';
        const vSku = v.sku?.toLowerCase() || '';
        if (!pName.includes(q) && !vName.includes(q) && !vSku.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allSystemVariants, editingId, linkSameFamilyOnly, currentFamilyId, linkCategoryFilter, linkSearchTerm]);

  // Helper to lookup variant object by ID for rendering selected pills
  const lookupVariant = (id: string): Variant | undefined => {
    return allSystemVariants.find(v => v._id === id);
  };

  // Filtered & Sorted Main Page Variants
  const filteredVariants = useMemo(() => {
    let list = [...variants];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        v =>
          v.variantName?.toLowerCase().includes(q) ||
          v.sku?.toLowerCase().includes(q) ||
          v.slug?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(v => v.status === statusFilter);
    }

    if (stockFilter === 'IN_STOCK') {
      list = list.filter(v => (v.stock || 0) > 0);
    } else if (stockFilter === 'LOW_STOCK') {
      list = list.filter(v => (v.stock || 0) > 0 && (v.stock || 0) <= 5);
    } else if (stockFilter === 'OUT_OF_STOCK') {
      list = list.filter(v => (v.stock || 0) === 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'default') {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      }
      if (sortBy === 'price_asc') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      if (sortBy === 'price_desc') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      if (sortBy === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'stock_asc') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'name_asc') return (a.variantName || '').localeCompare(b.variantName || '');
      return 0;
    });

    return list;
  }, [variants, searchTerm, statusFilter, stockFilter, sortBy]);

  const totalStockSum = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

  if (loading) {
    return (
      <div className="p-12 max-w-7xl mx-auto w-full flex flex-col items-center justify-center gap-3 text-foreground/60 min-h-100">
        <div className="w-8 h-8 border-3 border-[#57c5cc] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading variant configurations...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Back Button & Top Navigation */}
      <div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium text-xs mb-3 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Products Catalog
        </button>

        {/* Product Context Banner */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center shrink-0">
              <Box size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {product?.name || 'Product'}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    product?.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {product?.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60 mt-1">
                {currentFamilyName && (
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                    <Zap size={13} /> Family: {currentFamilyName}
                  </span>
                )}
                {product?.category?.name && (
                  <span className="flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-md border border-border">
                    <Tag size={13} /> Category: {product.category.name}
                  </span>
                )}
                <span>•</span>
                <span>{variants.length} Total Variants</span>
                <span>•</span>
                <span className="font-semibold text-foreground">{totalStockSum} Units in Stock</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => router.push(`/dashboard/products/${productId}/edit`)}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-surface text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit2 size={14} /> Edit Family Info
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#45a0a6] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size={16} /> Add New Variant
            </button>
          </div>
        </div>
      </div>

      {/* Variants Filter & Search Toolbar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search variant name, SKU, or slug..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="LOW_STOCK">Low Stock (≤ 5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30"
          >
            <option value="default">Default Variant First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Variants List Section */}
      {filteredVariants.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center mx-auto mb-3">
            <Layers size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Variants Found</h3>
          <p className="text-xs text-foreground/60 max-w-md mx-auto mt-1">
            {searchTerm || statusFilter !== 'ALL' || stockFilter !== 'ALL'
              ? 'No variants match your search or filter settings.'
              : 'Add your first variant (such as length, size, material, or spec) to make this product active.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#57c5cc] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#45a0a6]"
          >
            <Plus size={16} /> Add First Variant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVariants.map(variant => {
            const primaryImg =
              variant.images?.find(img => img.isPrimary)?.url ||
              variant.thumbnail ||
              variant.images?.[0]?.url;
            const discountPercent =
              variant.discountPrice && variant.price > variant.discountPrice
                ? Math.round(((variant.price - variant.discountPrice) / variant.price) * 100)
                : 0;

            const totalLinkedCount =
              (variant.relatedSystems?.length || 0) +
              (variant.compatibleProducts?.length || 0) +
              (variant.recommendedProducts?.length || 0);

            return (
              <div
                key={variant._id}
                className={`bg-surface rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  variant.isDefault
                    ? 'border-[#57c5cc] ring-2 ring-[#57c5cc]/20'
                    : 'border-border hover:border-[#57c5cc]/40'
                }`}
              >
                {/* Variant Top Image Banner */}
                <div className="relative h-44 bg-background border-b border-border flex items-center justify-center overflow-hidden group">
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={variant.variantName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-foreground/30">
                      <ImageIcon size={36} />
                      <span className="text-[11px] mt-1">No Image</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {variant.isDefault ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#57c5cc] text-white shadow-xs flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> DEFAULT
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultVariant(variant._id)}
                        className="px-2 py-1 rounded-full text-[10px] font-semibold bg-surface/90 backdrop-blur-md text-foreground/70 hover:text-[#57c5cc] hover:bg-surface border border-border shadow-xs flex items-center gap-1 transition-colors"
                        title="Set as Default Variant"
                      >
                        <Star size={10} /> Make Default
                      </button>
                    )}

                    <button
                      onClick={e => handleToggleVariantStatus(variant, e)}
                      className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-xs cursor-pointer ${
                        variant.status === 'ACTIVE'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                      title="Click to toggle status"
                    >
                      {variant.status || 'ACTIVE'}
                    </button>
                  </div>

                  {/* Photo Gallery Button */}
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={() => setGalleryVariant(variant)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-surface/90 backdrop-blur-md text-foreground border border-border shadow-xs hover:bg-surface flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Manage Photos"
                    >
                      <ImageIcon size={13} className="text-[#57c5cc]" />
                      <span>{variant.images?.length || 0} Photos</span>
                    </button>
                  </div>
                </div>

                {/* Variant Body Information */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground text-base tracking-tight">
                          {variant.variantName}
                        </h3>
                        {variant.sku && (
                          <div className="flex items-center gap-1.5 text-xs text-foreground/60 font-mono mt-0.5">
                            <span>SKU: {variant.sku}</span>
                            <button
                              onClick={e => handleCopySku(variant.sku, e)}
                              className="text-foreground/40 hover:text-foreground p-0.5"
                              title="Copy SKU"
                            >
                              {copiedSku === variant.sku ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-background border border-border font-medium text-foreground/70">
                        {variant.unit || 'pcs'}
                      </span>
                    </div>

                    {/* Linked Products Count Pill */}
                    {totalLinkedCount > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                          <LinkIcon size={11} /> {totalLinkedCount} Linked Products
                        </span>
                      </div>
                    )}

                    {/* Dimensions / Weight Specifications */}
                    {(variant.dimensions || variant.weight) && (
                      <div className="flex items-center gap-3 text-xs text-foreground/60 mt-2 bg-background/50 p-2 rounded-lg border border-border/50">
                        {variant.dimensions && <span>📐 {variant.dimensions}</span>}
                        {variant.weight && <span>⚖️ {variant.weight} kg</span>}
                      </div>
                    )}

                    {variant.shortDescription && (
                      <p className="text-xs text-foreground/60 mt-2 line-clamp-2">
                        {variant.shortDescription}
                      </p>
                    )}
                  </div>

                  {/* Pricing & Stock Grid */}
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Price */}
                      <div>
                        <span className="text-[11px] text-foreground/50 block">Pricing</span>
                        <div className="flex items-baseline gap-1.5 font-bold">
                          {variant.discountPrice ? (
                            <>
                              <span className="text-emerald-600 text-base">
                                ₹{variant.discountPrice.toLocaleString()}
                              </span>
                              <span className="text-foreground/40 line-through text-xs font-normal">
                                ₹{variant.price.toLocaleString()}
                              </span>
                              {discountPercent > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-foreground text-base">
                              ₹{variant.price?.toLocaleString() || 0}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock with quick buttons */}
                      <div className="text-right">
                        <span className="text-[11px] text-foreground/50 block">Stock Units</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <button
                            onClick={e => handleAdjustStock(variant, -1, e)}
                            disabled={(variant.stock || 0) <= 0}
                            className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center text-foreground/70 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Decrease Stock by 1"
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            className={`font-bold text-sm min-w-8 text-center ${
                              (variant.stock || 0) <= 0
                                ? 'text-rose-600'
                                : (variant.stock || 0) <= 5
                                ? 'text-amber-600'
                                : 'text-foreground'
                            }`}
                          >
                            {variant.stock || 0}
                          </span>
                          <button
                            onClick={e => handleAdjustStock(variant, 1, e)}
                            className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center text-foreground/70 hover:bg-surface"
                            title="Increase Stock by 1"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(variant)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-background hover:bg-surface border border-border text-foreground transition-all cursor-pointer"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setGalleryVariant(variant)}
                        className="p-2 rounded-xl bg-background hover:bg-surface border border-border text-[#57c5cc] transition-all cursor-pointer"
                        title="Manage Images"
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(variant._id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-all cursor-pointer"
                        title="Delete Variant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT VARIANT */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-border max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center shrink-0">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {editingId ? 'Edit Product Variant' : 'Add New Product Variant'}
                  </h2>
                  <p className="text-xs text-foreground/60">
                    Parent: <span className="font-semibold text-foreground">{product?.name}</span>
                    {currentFamilyName && (
                      <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">
                        • {currentFamilyName}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-border bg-surface px-5 gap-4 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'general'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                1. General Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'pricing'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                2. Pricing & Stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'description'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                3. Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('relations')}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'relations'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                <LinkIcon size={13} />
                <span>
                  4. Linked Products (
                  {relatedSystems.length + compatibleProducts.length + recommendedProducts.length})
                </span>
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Variant Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={variantName}
                      onChange={e => handleVariantNameChange(e.target.value)}
                      placeholder="e.g. 1 Metre / 14mm Rod or 2.5 Sqmm Copper"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-foreground/90">
                          SKU (Stock Keeping Unit)
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSku}
                          className="text-[11px] font-semibold text-[#57c5cc] hover:underline flex items-center gap-1"
                        >
                          <Sparkles size={11} /> Auto Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        value={sku}
                        onChange={e => setSku(e.target.value)}
                        placeholder="e.g. CLA-1M-14MM"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Unit of Measurement
                      </label>
                      <select
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      >
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="mtr">Metres (mtr)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="set">Set</option>
                        <option value="roll">Roll</option>
                        <option value="box">Box</option>
                        <option value="pkt">Packet (pkt)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      URL Slug <span className="text-foreground/50 font-normal">(Auto-generated or custom)</span>
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => {
                        setSlug(e.target.value);
                        setIsSlugManuallyEdited(true);
                      }}
                      placeholder="copper-lightning-arrester-1m"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Publication Status
                      </label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      >
                        <option value="ACTIVE">ACTIVE (Visible in Store)</option>
                        <option value="INACTIVE">INACTIVE (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <label className="relative flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={e => setIsDefault(e.target.checked)}
                          className="w-4 h-4 rounded text-[#57c5cc] focus:ring-[#57c5cc] border-border"
                        />
                        <span>Set as Default Variant for this product</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & STOCK */}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Regular Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="e.g. 1200"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Discounted Offer Price (₹){' '}
                        <span className="text-foreground/50 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountPrice}
                        onChange={e => setDiscountPrice(e.target.value)}
                        placeholder="e.g. 999"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Available Stock Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      placeholder="e.g. 50"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Weight (kg) <span className="text-foreground/50 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder="e.g. 1.85"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                        Dimensions (L x W x H){' '}
                        <span className="text-foreground/50 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={e => setDimensions(e.target.value)}
                        placeholder="e.g. 100 x 5 x 5 cm"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SPECIFICATIONS & DESCRIPTION */}
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Short Summary / Highlights
                    </label>
                    <textarea
                      rows={2}
                      value={shortDescription}
                      onChange={e => setShortDescription(e.target.value)}
                      placeholder="Brief one-line summary displayed on cards..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Full Technical Description & Specifications
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Detailed specifications, technical parameters, compliance certifications, etc."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: ADVANCED LINKED PRODUCTS STUDIO */}
              {activeTab === 'relations' && (
                <div className="space-y-6">
                  {/* Family Context Ribbon */}
                  <div className="bg-[#57c5cc]/10 border border-[#57c5cc]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#57c5cc] text-white flex items-center justify-center shrink-0">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Product Family: {currentFamilyName || 'All Systems'}
                        </p>
                        <p className="text-[11px] text-foreground/70">
                          {linkSameFamilyOnly
                            ? `Showing linked products exclusively from "${currentFamilyName || 'Same Family'}"`
                            : 'Showing products across the entire catalog'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setLinkSameFamilyOnly(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          linkSameFamilyOnly
                            ? 'bg-[#57c5cc] text-white shadow-xs'
                            : 'text-foreground/70 hover:text-foreground'
                        }`}
                      >
                        ⚡ Same Family
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkSameFamilyOnly(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          !linkSameFamilyOnly
                            ? 'bg-[#57c5cc] text-white shadow-xs'
                            : 'text-foreground/70 hover:text-foreground'
                        }`}
                      >
                        🌐 All Families
                      </button>
                    </div>
                  </div>

                  {/* Relationship Type Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-background border border-border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLinkTargetType('relatedSystems')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        linkTargetType === 'relatedSystems'
                          ? 'bg-surface text-foreground shadow-xs'
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      <Layers size={14} className="text-[#57c5cc]" />
                      <span>Related Systems ({relatedSystems.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkTargetType('compatibleProducts')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        linkTargetType === 'compatibleProducts'
                          ? 'bg-surface text-foreground shadow-xs'
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Compatible Items ({compatibleProducts.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkTargetType('recommendedProducts')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        linkTargetType === 'recommendedProducts'
                          ? 'bg-surface text-foreground shadow-xs'
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Recommended ({recommendedProducts.length})</span>
                    </button>
                  </div>

                  {/* Section Explanation */}
                  <div className="text-xs text-foreground/60 bg-background/50 p-3 rounded-xl border border-border/60 flex items-center justify-between">
                    <span>
                      {linkTargetType === 'relatedSystems' &&
                        'Packages and full system components bundled with this variant.'}
                      {linkTargetType === 'compatibleProducts' &&
                        'Accessories, fittings, clamps, and hardware compatible with this variant.'}
                      {linkTargetType === 'recommendedProducts' &&
                        'Frequently bought together cross-sell suggestions for customers.'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {linkTargetType === 'relatedSystems' && `${relatedSystems.length} linked`}
                      {linkTargetType === 'compatibleProducts' && `${compatibleProducts.length} linked`}
                      {linkTargetType === 'recommendedProducts' && `${recommendedProducts.length} linked`}
                    </span>
                  </div>

                  {/* Selected Linked Items Visual Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      Currently Linked In{' '}
                      {linkTargetType === 'relatedSystems'
                        ? 'Related Systems'
                        : linkTargetType === 'compatibleProducts'
                        ? 'Compatible Products'
                        : 'Recommended Products'}
                    </h4>

                    {((linkTargetType === 'relatedSystems' && relatedSystems.length === 0) ||
                      (linkTargetType === 'compatibleProducts' && compatibleProducts.length === 0) ||
                      (linkTargetType === 'recommendedProducts' && recommendedProducts.length === 0)) ? (
                      <div className="p-6 text-center bg-background rounded-xl border border-dashed border-border text-foreground/50 text-xs">
                        No products linked yet. Select items from the catalog gallery below to link them.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(linkTargetType === 'relatedSystems'
                          ? relatedSystems
                          : linkTargetType === 'compatibleProducts'
                          ? compatibleProducts
                          : recommendedProducts
                        ).map(selectedId => {
                          const vObj = lookupVariant(selectedId);
                          const thumb =
                            vObj?.thumbnail ||
                            vObj?.images?.[0]?.url ||
                            (typeof vObj?.product === 'object' ? vObj?.product?.thumbnail : null);
                          const pName =
                            typeof vObj?.product === 'object'
                              ? vObj?.product?.name
                              : 'Product Item';
                          const famName =
                            typeof vObj?.product === 'object'
                              ? vObj?.product?.family?.name
                              : '';

                          return (
                            <div
                              key={selectedId}
                              className="p-3 bg-background rounded-xl border border-border flex items-center justify-between gap-3 shadow-xs hover:border-[#57c5cc]/40 transition-all group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                  {thumb ? (
                                    <img src={thumb} alt="Item" className="w-full h-full object-cover" />
                                  ) : (
                                    <Box size={16} className="text-foreground/30" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {vObj?.variantName || 'Variant'}
                                  </p>
                                  <p className="text-[11px] text-foreground/50 truncate">
                                    {pName} {vObj?.sku && `• ${vObj.sku}`}
                                  </p>
                                  {famName && (
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                      {famName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleLink(selectedId, linkTargetType)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                                title="Unlink Item"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Interactive Catalog Picker Search & Grid */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Available Products in Catalog ({availableLinkedVariants.length})
                      </h4>

                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" size={13} />
                          <input
                            type="text"
                            value={linkSearchTerm}
                            onChange={e => setLinkSearchTerm(e.target.value)}
                            placeholder="Search by product, variant, or SKU..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30"
                          />
                          {linkSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setLinkSearchTerm('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Category filter */}
                        <select
                          value={linkCategoryFilter}
                          onChange={e => setLinkCategoryFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 max-w-[140px]"
                        >
                          <option value="">All Categories</option>
                          {categories.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Available Items Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1 bg-background/30 rounded-xl border border-border">
                      {availableLinkedVariants.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-xs text-foreground/50">
                          No matching variants found with current filters. Try turning off "Same Family" or clearing your search.
                        </div>
                      ) : (
                        availableLinkedVariants.map(availVar => {
                          const isLinkedToCurrent = (
                            linkTargetType === 'relatedSystems'
                              ? relatedSystems
                              : linkTargetType === 'compatibleProducts'
                              ? compatibleProducts
                              : recommendedProducts
                          ).includes(availVar._id);

                          const thumb =
                            availVar.thumbnail ||
                            availVar.images?.[0]?.url ||
                            (typeof availVar.product === 'object' ? availVar.product?.thumbnail : null);
                          const pName =
                            typeof availVar.product === 'object'
                              ? availVar.product?.name
                              : 'Product';
                          const fam =
                            typeof availVar.product === 'object' ? availVar.product?.family : null;
                          const isSameFamily =
                            currentFamilyId &&
                            (typeof fam === 'object'
                              ? String(fam?._id) === String(currentFamilyId)
                              : String(fam) === String(currentFamilyId));

                          return (
                            <div
                              key={availVar._id}
                              onClick={() => handleToggleLink(availVar._id, linkTargetType)}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isLinkedToCurrent
                                  ? 'bg-[#57c5cc]/10 border-[#57c5cc] ring-1 ring-[#57c5cc]/30'
                                  : 'bg-surface border-border hover:border-[#57c5cc]/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-11 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                  {thumb ? (
                                    <img src={thumb} alt="Item" className="w-full h-full object-cover" />
                                  ) : (
                                    <Box size={18} className="text-foreground/30" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-foreground truncate">
                                      {availVar.variantName}
                                    </p>
                                    {isSameFamily && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded shrink-0">
                                        Same Family
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-foreground/60 truncate">{pName}</p>
                                  <p className="text-[10px] text-foreground/50 font-mono">
                                    {availVar.sku && `SKU: ${availVar.sku} • `}₹
                                    {(availVar.discountPrice || availVar.price || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                  isLinkedToCurrent
                                    ? 'bg-[#57c5cc] text-white'
                                    : 'bg-background hover:bg-[#57c5cc]/10 text-foreground/70 hover:text-[#57c5cc] border border-border'
                                }`}
                              >
                                {isLinkedToCurrent ? (
                                  <span className="flex items-center gap-1">
                                    <Check size={12} /> Linked
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Plus size={12} /> Link
                                  </span>
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border bg-background text-foreground hover:bg-surface text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#45a0a6] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? 'Saving...' : editingId ? 'Update Variant' : 'Create Variant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE GALLERY & UPLOADER */}
      {galleryVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Gallery Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center shrink-0">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Photos for {galleryVariant.variantName}
                  </h2>
                  <p className="text-xs text-foreground/60">
                    Upload images and select the primary photo displayed as the main thumbnail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGalleryVariant(null)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Gallery Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-[#57c5cc] bg-background/50 hover:bg-[#57c5cc]/5 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center mx-auto mb-2">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-bold text-foreground">
                  {isUploadingImg ? 'Uploading image...' : 'Click to Upload New Photo'}
                </p>
                <p className="text-xs text-foreground/50 mt-0.5">PNG, JPG, WebP up to 10MB</p>
              </div>

              {/* Images Grid */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                  Uploaded Photos ({galleryVariant.images?.length || 0})
                </h3>

                {(!galleryVariant.images || galleryVariant.images.length === 0) ? (
                  <p className="text-xs text-foreground/50 text-center py-6">
                    No photos uploaded for this variant yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {galleryVariant.images.map((img: VariantImage) => (
                      <div
                        key={img._id}
                        className={`relative rounded-xl border overflow-hidden group bg-background flex flex-col ${
                          img.isPrimary ? 'border-[#57c5cc] ring-2 ring-[#57c5cc]/30' : 'border-border'
                        }`}
                      >
                        <div className="h-32 w-full overflow-hidden flex items-center justify-center bg-black/5">
                          <img src={img.url} alt="Variant" className="w-full h-full object-cover" />
                        </div>

                        {/* Top Badges & Actions */}
                        <div className="p-2.5 bg-surface border-t border-border flex items-center justify-between">
                          {img.isPrimary ? (
                            <span className="text-[10px] font-extrabold text-[#57c5cc] flex items-center gap-1">
                              <Star size={12} fill="currentColor" /> PRIMARY
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img._id)}
                              className="text-[10px] font-semibold text-foreground/70 hover:text-[#57c5cc] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Set as Primary"
                            >
                              <Star size={12} /> Set Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img._id)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Footer */}
            <div className="p-4 border-t border-border bg-background/50 flex justify-end">
              <button
                type="button"
                onClick={() => setGalleryVariant(null)}
                className="px-5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-background text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
