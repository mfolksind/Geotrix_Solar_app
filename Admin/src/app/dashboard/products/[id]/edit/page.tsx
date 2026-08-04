"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '../../../../../components/Card/Card';
import { Button } from '../../../../../components/Button/Button';
import { Input } from '../../../../../components/Input/Input';
import { fetchApi, API_URL } from '../../../../../utils/api';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import styles from '../../add/addProduct.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prodsRes = await fetchApi('/admin/products'); // Extract product from list
        
        if (prodsRes.success) {
          const product = prodsRes.data.find((p: any) => p._id === id);
          if (product) {
            setName(product.name);
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
        status
      };

      const res = await fetchApi(`/admin/products/${id}`, {
        method: 'PATCH', // Fixed to MATCH backend patch route
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className={styles.title}>Edit Product</h1>
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleUpdateProduct} className={styles.form}>
          <div className={styles.formGrid}>
            <Input
              label="Product Family Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className={styles.inputGroup}>
              <label className={styles.label}>Status</label>
              <select 
                className={styles.select}
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                required
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={18} /> {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
