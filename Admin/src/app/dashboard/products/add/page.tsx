"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../utils/api';
import { ArrowLeft, Save, Box, Tag, Layers, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

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

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [family, setFamily] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Families on initial mount
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
  }, []);

  // Dynamically auto-fetch categories whenever Family changes
  useEffect(() => {
    const fetchCategoriesForFamily = async () => {
      setLoadingCategories(true);
      try {
        const url = family ? `/api/categories?family=${family}` : '/api/categories?limit=1000000';
        const catRes = await fetchApi(url);
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
          // If current selected category is not in the new list, clear it
          if (category && !catRes.data.some((c: Category) => c._id === category)) {
            setCategory('');
          }
        } else {
          setCategories([]);
          setCategory('');
        }
      } catch (err) {
        console.error('Failed to load categories for family', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategoriesForFamily();
  }, [family]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        family: family || undefined,
        category: category || undefined,
        status
      };

      const res = await fetchApi('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.data) {
        // Smoothly guide user to add variants immediately
        router.push(`/dashboard/products/${res.data._id}/variants`);
      } else {
        alert(res.message || 'Failed to add product');
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Error adding product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium text-xs mb-3 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Products Catalog
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Product Family</h1>
        <p className="text-xs text-foreground/60 mt-1">
          A product family acts as the parent container for variations (such as dimensions, weight, specifications, and pricing).
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5 pb-5 border-b border-border">
            <div className="w-12 h-12 bg-[#57c5cc]/10 text-[#57c5cc] rounded-2xl flex items-center justify-center shrink-0">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">General Product Information</h2>
              <p className="text-xs text-foreground/60">Define the core brand name, taxonomy family, and category.</p>
            </div>
          </div>

          <form onSubmit={handleAddProduct} className="space-y-5">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-foreground/90 mb-1.5">
                Product Family Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Pure Copper Lightning Arrester"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Family */}
              <div>
                <label htmlFor="family" className="block text-xs font-semibold text-foreground/90 mb-1.5">
                  Product Family / Series <span className="text-foreground/50 font-normal">(Auto-filters Categories)</span>
                </label>
                <select
                  id="family"
                  value={family}
                  onChange={e => setFamily(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
                >
                  <option value="">Select a Product Family (All Families)</option>
                  {families.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="category" className="block text-xs font-semibold text-foreground/90">
                    Category {family && <span className="text-[#57c5cc] font-normal">(Dynamic)</span>}
                  </label>
                  {loadingCategories && (
                    <span className="text-[11px] text-[#57c5cc] flex items-center gap-1 font-medium">
                      <Loader2 size={11} className="animate-spin" /> Fetching categories...
                    </span>
                  )}
                </div>
                <select
                  id="category"
                  value={category}
                  disabled={loadingCategories}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all disabled:opacity-60"
                >
                  <option value="">
                    {loadingCategories
                      ? 'Loading categories...'
                      : categories.length === 0
                      ? 'No categories for this family'
                      : 'Select a Category'}
                  </option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {family && categories.length > 0 && (
                  <span className="text-[10px] text-foreground/50 mt-1 block">
                    Showing {categories.length} categories belonging to selected family
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-foreground/90 mb-1.5">
                Initial Status
              </label>
              <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
              >
                <option value="ACTIVE">ACTIVE (Published)</option>
                <option value="INACTIVE">INACTIVE (Draft)</option>
              </select>
            </div>

            {/* Form Footer */}
            <div className="pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-background border border-border hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#57c5cc] hover:bg-[#45a0a6] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Creating...' : 'Save & Configure Variants'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
