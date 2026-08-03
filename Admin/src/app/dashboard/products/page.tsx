"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { fetchApi, API_URL } from '../../../utils/api';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import styles from './products.module.css';

interface Product {
  _id: string;
  name: string;
  price: number;
  categoryId: string;
  thumbnail: string;
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <Button onClick={() => router.push('/dashboard/products/add')}>
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table headers={['Image', 'Name', 'Price', 'Category ID', 'Actions']}>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  {product.thumbnail ? (
                    <img 
                      src={product.thumbnail.startsWith('http') ? product.thumbnail : `${API_URL}${product.thumbnail}`} 
                      alt={product.name} 
                      className={styles.productImage} 
                    />
                  ) : (
                    <div className={styles.placeholderImage}>No Img</div>
                  )}
                </td>
                <td style={{ fontWeight: 500 }}>{product.name}</td>
                <td>${product.price.toLocaleString()}</td>
                <td><span className={styles.badge}>{product.categoryId}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.iconBtn} 
                      onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
                      title="Edit Product"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={`${styles.iconBtn} ${styles.primaryBtn}`} 
                      onClick={() => router.push(`/dashboard/products/${product._id}/variants`)}
                      title="Manage Variants"
                    >
                      <Layers size={18} />
                    </button>
                    <button 
                      className={`${styles.iconBtn} ${styles.dangerBtn}`} 
                      onClick={() => handleDelete(product._id)}
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
              </tr>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}
