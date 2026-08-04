"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi, API_URL } from '../../../../../utils/api';
import { ArrowLeft, Trash2, Plus, Edit2, Image as ImageIcon, X, Save, AlertCircle } from 'lucide-react';

interface VariantImage {
  _id: string;
  url: string;
  isPrimary: boolean;
}

interface Variant {
  _id: string;
  variantName: string;
  sku: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  status: string;
  images: VariantImage[];
  categoryId?: string;
  category?: { _id: string; name: string };
  description?: string;
  shortDescription?: string;
  isDefault?: boolean;
}

export default function VariantsPage() {
  const router = useRouter();
  const { id: productId } = useParams();
  
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setVariantName('');
    setSku('');
    setSlug('');
    setIsSlugManuallyEdited(false);
    setPrice('');
    setDiscountPrice('');
    setStock('');
    setUnit('pcs');
    setWeight('');
    setDimensions('');
    setStatus('ACTIVE');
    setCategoryId(categories.length > 0 ? categories[0]._id : '');
    setDescription('');
    setShortDescription('');
    setIsDefault(false);
  };

  const loadVariants = async () => {
    try {
      const res = await fetchApi(`/admin/products/${productId}/variants`);
      if (res.success) {
        setVariants(res.data);
      }
    } catch (err) {
      console.error('Failed to load variants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const prodRes = await fetchApi(`/api/products/${productId}`);
        if (prodRes.success) {
          setProduct(prodRes.data);
        }
      } catch (err) {
        console.error('Failed to load product', err);
      }
      try {
        const catRes = await fetchApi('/api/categories');
        if (catRes.success) {
          setCategories(catRes.data);
          if (catRes.data.length > 0) setCategoryId(catRes.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
      await loadVariants();
    };
    init();
  }, [productId]);

  useEffect(() => {
    if (!isSlugManuallyEdited && product && variantName && sku) {
      const generatedSlug = `${product.name}-${variantName}-${sku}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  }, [variantName, sku, product, isSlugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        variantName,
        sku,
        slug,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        stock: parseInt(stock),
        unit,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions,
        status,
        categoryId: categoryId || undefined,
        description,
        shortDescription,
        isDefault
      };

      if (editingId) {
        // Update
        const res = await fetchApi(`/admin/products/variants/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            variantName, 
            sku,
            slug,
            price: parseFloat(price), 
            discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
            stock: parseInt(stock), 
            status,
            categoryId: categoryId || undefined,
            description,
            shortDescription,
            isDefault
          }),
        });
        if (res.success) {
          loadVariants();
          resetForm();
        } else {
          alert(res.message || 'Failed to update variant');
        }
      } else {
        // Add
        const res = await fetchApi(`/admin/products/${productId}/variants`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          loadVariants();
          resetForm();
        } else {
          alert(res.message || 'Failed to add variant');
        }
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error saving variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (v: Variant) => {
    setEditingId(v._id);
    setVariantName(v.variantName);
    setSku(v.sku || '');
    setSlug(v.slug || '');
    setIsSlugManuallyEdited(!!v.slug);
    setPrice(v.price.toString());
    setStock(v.stock.toString());
    setStatus(v.status || 'ACTIVE');
    setCategoryId(v.category?._id || v.categoryId || (categories.length > 0 ? categories[0]._id : ''));
    setDescription(v.description || '');
    setShortDescription(v.shortDescription || '');
    setIsDefault(!!v.isDefault);
    setDiscountPrice(v.discountPrice ? v.discountPrice.toString() : '');
    
    // Scroll to form nicely
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const res = await fetchApi(`/admin/products/variants/${variantId}`, { method: 'DELETE' });
      if (res.success) {
        loadVariants();
      } else {
        alert(res.message || 'Failed to delete variant');
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error deleting variant');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingId) return;
    setIsUploadingImg(true);

    try {
      const formData = new FormData();
      formData.append('image', e.target.files[0]);

      // 1. Upload to server
      const uploadRes = await fetchApi('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.success) {
        // 2. Attach image to variant
        const attachRes = await fetchApi(`/admin/products/${productId}/images`, {
          method: 'POST',
          body: JSON.stringify({
            variantId: editingId,
            url: uploadRes.data.url,
            isPrimary: false
          })
        });

        if (attachRes.success) {
          loadVariants();
        } else {
          alert(attachRes.message || 'Failed to attach image');
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

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetchApi(`/admin/images/${imageId}`, { method: 'DELETE' });
      if (res.success) {
        loadVariants();
      } else {
        alert(res.message || 'Failed to delete image');
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error deleting image');
    }
  };

  const editingVariant = variants.find(v => v._id === editingId);

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <div className="mb-8">
        <button 
          onClick={() => router.push('/dashboard/products')}
          className="flex items-center gap-2 text-foreground/60 hover:text-[#57c5cc] transition-colors mb-4 font-medium text-sm w-max"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Manage Variants</h1>
                <p className="text-sm text-foreground/60 mt-1">
                    {product ? `For: ${product.name}` : 'Loading product details...'}
                </p>
            </div>
            {editingId && (
                <button 
                    onClick={resetForm}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                    <Plus size={16} /> Add New Variant Instead
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM SECTION - Takes up 5 columns on XL */}
        <div className="xl:col-span-5 w-full order-1 xl:order-2">
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden sticky top-6">
                <div className="px-6 py-5 border-b border-border bg-surface/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        {editingId ? 'Edit Variant' : 'Create Variant'}
                    </h2>
                    {editingId && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">EDITING</span>}
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">Variant Name</label>
                            <input type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} required placeholder="e.g. 50mm, Blue" className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">SKU</label>
                            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="e.g. EAR-50-BLU" className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/90 mb-1.5">Slug (URL)</label>
                        <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setIsSlugManuallyEdited(true); }} className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface text-foreground/60" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-y border-border py-5 my-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">Price (₹)</label>
                            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">Discount (₹)</label>
                            <input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">Stock</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/90 mb-1.5">Category</label>
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface">
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/90 mb-1.5">
                            Short Description (Bullets)
                            <span className="text-foreground/50 font-normal ml-2">Used in top buying section</span>
                        </label>
                        <textarea 
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            rows={3}
                            placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
                            className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface leading-relaxed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/90 mb-1.5">
                            Detailed Description
                            <span className="text-foreground/50 font-normal ml-2">Used in bottom specs section</span>
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {!editingId && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/90 mb-1.5">Weight</label>
                                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/90 mb-1.5">Dimensions</label>
                                    <input type="text" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="10x10x10" className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface" />
                                </div>
                            </>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-foreground/90 mb-1.5">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all bg-surface">
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                        <input 
                            type="checkbox" 
                            id="isDefaultCheckbox" 
                            checked={isDefault} 
                            onChange={(e) => setIsDefault(e.target.checked)} 
                            className="w-5 h-5 rounded border-border text-[#57c5cc] focus:ring-[#57c5cc] transition-colors cursor-pointer"
                        />
                        <label htmlFor="isDefaultCheckbox" className="text-sm font-medium text-foreground/90 cursor-pointer select-none">
                            Set as Default Variant
                        </label>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-border">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="flex-1 py-2.5 bg-surface border border-border text-foreground/90 rounded-lg font-medium hover:bg-background transition-colors shadow-sm">
                                Cancel Edit
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-lg font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            <Save size={18} />
                            {isSubmitting ? 'Saving...' : editingId ? 'Update Variant' : 'Create Variant'}
                        </button>
                    </div>
                </form>

                {/* IMAGES SECTION */}
                {editingId && (
                    <div className="p-6 border-t border-border bg-background">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-foreground">Variant Images</h3>
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isUploadingImg}
                                className="px-3 py-1.5 bg-surface border border-border text-foreground/90 rounded-md text-xs font-medium hover:bg-background transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                {isUploadingImg ? 'Uploading...' : 'Add Image'}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            {editingVariant?.images?.map(img => (
                                <div key={img._id} className="relative w-20 h-20 rounded-lg border border-border bg-surface overflow-hidden group">
                                    <img src={img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`} alt="Variant" className="w-full h-full object-contain p-1" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            type="button" 
                                            onClick={() => handleDeleteImage(img._id)}
                                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!editingVariant?.images || editingVariant.images.length === 0) && (
                                <div className="w-full p-4 border-2 border-dashed border-border rounded-lg text-center">
                                    <ImageIcon size={24} className="mx-auto text-foreground/50 mb-2" />
                                    <p className="text-xs text-foreground/60">No images uploaded for this variant.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* LIST SECTION - Takes up 7 columns on XL */}
        <div className="xl:col-span-7 w-full order-2 xl:order-1">
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-surface/50">
                    <h2 className="text-lg font-semibold text-foreground">Current Variants ({variants.length})</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface/80 text-foreground/60 font-medium border-b border-border">
                            <tr>
                                <th className="px-5 py-3">Variant</th>
                                <th className="px-5 py-3">Price & Stock</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground/90">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-foreground/60">
                                        <div className="w-6 h-6 border-2 border-[#57c5cc] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p>Loading variants...</p>
                                    </td>
                                </tr>
                            ) : variants.length > 0 ? (
                                variants.map((v) => (
                                    <tr key={v._id} className={`hover:bg-background transition-colors ${editingId === v._id ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden p-1">
                                                    {v.images && v.images.length > 0 ? (
                                                        <img src={v.images[0].url.startsWith('http') ? v.images[0].url : `${API_URL}${v.images[0].url}`} alt={v.variantName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="max-w-[200px] overflow-hidden">
                                                    <div className="font-semibold text-foreground truncate" title={v.variantName}>{v.variantName}</div>
                                                    <div className="text-xs text-foreground/60 truncate" title={v.sku}>SKU: {v.sku || 'N/A'}</div>
                                                    <div className="text-[10px] text-[#57c5cc] font-medium truncate mt-0.5">{v.category?.name || 'No Category'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-foreground">₹{v.price}</div>
                                            <div className="text-xs text-foreground/60">Stock: {v.stock}</div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {v.isDefault ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                    DEFAULT
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-background text-foreground/80 border border-border">
                                                    STANDARD
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => handleEdit(v)}
                                                    className={`p-2 rounded-lg transition-colors ${editingId === v._id ? 'bg-[#57c5cc] text-white' : 'text-foreground/50 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10'}`}
                                                    title="Edit Variant"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(v._id)}
                                                    className="p-2 text-foreground/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Variant"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-foreground/60 font-medium">No variants added yet</p>
                                        <p className="text-sm text-foreground/50">Use the form to create your first variant.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
