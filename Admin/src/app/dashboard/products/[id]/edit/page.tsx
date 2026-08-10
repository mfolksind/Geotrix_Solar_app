"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '../../../../../utils/api';
import { ArrowLeft, Save, Edit2 } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Geotrix');
  const [status, setStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prodsRes = await fetchApi('/admin/products');
        
        if (prodsRes.success) {
          const product = prodsRes.data.find((p: any) => p._id === id);
          if (product) {
            setName(product.name);
            setBrand(product.brand || 'Geotrix');
            setStatus(product.status || 'ACTIVE');
          }
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        brand,
        status
      };

      const res = await fetchApi(`/admin/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        router.push('/dashboard/products');
      } else {
        alert(res.message || 'Failed to update product');
      }
    } catch (err) {
      alert('Error updating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
      return (
          <div className="p-6 max-w-3xl mx-auto w-full flex justify-center items-center h-64">
              <div className="flex flex-col items-center justify-center gap-3 text-foreground/60">
                  <div className="w-6 h-6 border-2 border-[#57c5cc] border-t-transparent rounded-full animate-spin"></div>
                  <p>Loading product data...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      {/* Header Section */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-4 font-medium text-sm w-max"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Product Family</h1>
        <p className="text-sm text-foreground/60 mt-1">Update the name and overall status of this product family.</p>
      </div>

      {/* Main Content Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-12 h-12 bg-[#57c5cc]/10 text-[#57c5cc] rounded-xl flex items-center justify-center">
                    <Edit2 size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                    <p className="text-sm text-foreground/60">Modify the core details of the product family.</p>
                </div>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground/90 mb-1.5">
                            Product Family Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Copper Lightning Arrester"
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all shadow-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-foreground/90 mb-1.5">
                            Brand
                        </label>
                        <select
                            id="brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all shadow-sm"
                        >
                            <option value="Geotrix">Geotrix</option>
                            <option value="Thermox">Thermox</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-foreground/90 mb-1.5">
                            Status
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all shadow-sm"
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-8">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-foreground/90 bg-surface border border-border hover:bg-background transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !name.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-white bg-[#57c5cc] hover:bg-[#45a0a6] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Updating...' : 'Update Product'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
