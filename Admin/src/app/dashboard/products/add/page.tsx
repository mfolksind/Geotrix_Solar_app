"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../../components/Card/Card';
import { Button } from '../../../../components/Button/Button';
import { Input } from '../../../../components/Input/Input';
import { fetchApi, API_URL } from '../../../../utils/api';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import styles from './addProduct.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className={styles.title}>Add New Product</h1>
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleAddProduct} className={styles.form}>
            <Input
              label="Product Family Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save & Continue to Variants'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
