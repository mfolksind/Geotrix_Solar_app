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
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0'); // Default to 0, depends on variants
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchApi('/api/categories');
        if (res.success) {
          setCategories(res.data);
          if (res.data.length > 0) {
            setCategoryId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetchApi('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setImageUrl(res.data.url);
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      alert('Error uploading image. Is the backend running?');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price) || 0,
        categoryId,
        thumbnail: imageUrl || undefined
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
          <div className={styles.formGrid}>
            <Input
              label="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className={styles.inputGroup}>
              <label className={styles.label}>Base Price ($)</label>
              <input 
                className={styles.select}
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6 }}>
                *Actual price can be set per variant later.
              </span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Category</label>
            <select 
              className={styles.select}
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              required
            >
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Description</label>
            <textarea 
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Product Image</label>
            <div className={styles.uploadArea}>
              {imageUrl ? (
                <div className={styles.imagePreview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid #ddd', width: '100%', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
                    <img 
                      src={imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`} 
                      alt="Preview" 
                      style={{ 
                        transform: `scale(${zoom})`, 
                        transition: 'transform 0.2s',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Zoom:</span>
                    <input 
                      type="range" 
                      min="1" max="3" step="0.1" 
                      value={zoom} 
                      onChange={(e) => setZoom(parseFloat(e.target.value))} 
                      style={{ flex: 1 }}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => { setImageUrl(''); setZoom(1); }}>
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className={styles.uploadLabel}>
                  <UploadCloud size={32} />
                  <span>{isUploading ? 'Uploading...' : 'Click to upload image'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

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
