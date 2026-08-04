"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../utils/api';
import { Plus, Edit2, Trash2, Layers, Search, PackageOpen } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  status: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProducts = async () => {
    try {
      const response = await fetchApi('/admin/products');
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadProducts();
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-foreground/60 mt-1">Manage your product catalog and variants</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/products/add')}
          className="flex items-center gap-2 bg-[#57c5cc] hover:bg-[#45a0a6] text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Toolbar (Optional Search/Filter could go here) */}
        <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/20 focus:border-[#57c5cc] transition-all bg-surface"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background text-foreground/80 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-foreground/60">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#57c5cc] border-t-transparent rounded-full animate-spin"></div>
                        <p>Loading products...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-surface/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-foreground/60">
                          <PackageOpen size={20} />
                        </div>
                        <span className="font-semibold text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
                          className="p-2 text-foreground/60 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors"
                          title="Edit Product Name"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => router.push(`/dashboard/products/${product._id}/variants`)}
                          className="p-2 text-foreground/60 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Variants"
                        >
                          <Layers size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-foreground/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-foreground/60">
                        <PackageOpen size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-foreground mb-1">No products found</p>
                        <p className="text-sm">Get started by creating a new product family.</p>
                        <button 
                            onClick={() => router.push('/dashboard/products/add')}
                            className="mt-6 text-[#57c5cc] font-medium hover:underline flex items-center gap-1"
                        >
                            <Plus size={16} /> Create your first product
                        </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
