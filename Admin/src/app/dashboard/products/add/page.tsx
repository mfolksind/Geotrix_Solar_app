"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../../utils/api';
import { ArrowLeft, Save, Box } from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name
      };

      const res = await fetchApi('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        // Redirect to variants page to continue workflow
        router.push(`/dashboard/products/${res.data._id}/variants`);
      } else {
        alert(res.message || 'Failed to add product');
      }
    } catch (err) {
      alert('Error adding product');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Product Family</h1>
        <p className="text-sm text-foreground/60 mt-1">A product family is the parent container for variations (variants) like different sizes or specs.</p>
      </div>

      {/* Main Content Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Box size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                    <p className="text-sm text-foreground/60">Provide the overarching name for this product line.</p>
                </div>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-6">
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
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all shadow-sm"
                    />
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
                        {isSubmitting ? 'Saving...' : 'Save & Continue to Variants'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
