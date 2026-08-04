"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '../../../../../components/Card/Card';
import { Table } from '../../../../../components/Table/Table';
import { Button } from '../../../../../components/Button/Button';
import { Input } from '../../../../../components/Input/Input';
import { fetchApi, API_URL } from '../../../../../utils/api';
import { ArrowLeft, Trash2, Plus, Edit2, Image as ImageIcon, X } from 'lucide-react';
import styles from './variants.module.css';

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
        isDefault
      };

      if (editingId) {
        // Update
        const res = await fetchApi(`/admin/variants/${editingId}`, {
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
    setIsDefault(!!v.isDefault);
    setDiscountPrice(v.discountPrice ? v.discountPrice.toString() : '');
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const res = await fetchApi(`/admin/variants/${variantId}`, { method: 'DELETE' });
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
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/products')}>
          <ArrowLeft size={20} /> Back to Products
        </button>
        <h1 className={styles.title}>Manage Variants</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.listSection}>
          <Card>
            <Table headers={['Variant Info', 'Category', 'Price', 'Stock', 'Default', 'Actions']}>
              {variants.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {v.images && v.images.length > 0 ? (
                        <img src={v.images[0].url.startsWith('http') ? v.images[0].url : `${API_URL}${v.images[0].url}`} alt="variant" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{v.variantName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {v.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.badge}>{v.category?.name || v.categoryId || 'N/A'}</span>
                  </td>
                  <td>${v.price}</td>
                  <td>{v.stock}</td>
                  <td>
                    {v.isDefault ? (
                      <span className={`${styles.statusBadge} ${styles.active}`}>Yes</span>
                    ) : (
                      <span className={styles.statusBadge}>No</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => handleEdit(v)}>
                        <Edit2 size={18} />
                      </button>
                      <button className={styles.iconBtn} onClick={() => handleDelete(v._id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && variants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No variants added yet.</td>
                </tr>
              )}
            </Table>
          </Card>
        </div>

        <div className={styles.formSection}>
          <Card>
            <h2 className={styles.formTitle}>{editingId ? 'Edit Variant' : 'Add New Variant'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <Input label="Variant Name" value={variantName} onChange={(e) => setVariantName(e.target.value)} required />
                <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>
              <Input 
                label="Slug" 
                value={slug} 
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                }} 
              />
              
              <div className={styles.row}>
                <Input label="Price ($)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                <Input label="Discount Price ($)" type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
              </div>

              <div className={styles.row}>
                <Input label="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Category</label>
                  <select className={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {!editingId && (
                <div className={styles.row}>
                  <Input label="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <Input label="Dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="10x10x10" />
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                
                <div className={styles.inputGroup} style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="isDefaultCheckbox" 
                    checked={isDefault} 
                    onChange={(e) => setIsDefault(e.target.checked)} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isDefaultCheckbox" className={styles.label} style={{ margin: 0, cursor: 'pointer' }}>Set as Default Variant</label>
                </div>
              </div>

              <div className={styles.formActions}>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} fullWidth>Cancel</Button>
                )}
                <Button type="submit" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Variant' : 'Add Variant'}
                </Button>
              </div>
            </form>

            {editingId && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid #eaeaea', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Variant Images
                  <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImg} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    {isUploadingImg ? 'Uploading...' : 'Add Image'}
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </h3>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {editingVariant?.images?.map(img => (
                    <div key={img._id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                      <img src={img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`} alt="Variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => handleDeleteImage(img._id)}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {(!editingVariant?.images || editingVariant.images.length === 0) && (
                    <p style={{ fontSize: '0.9rem', color: '#888' }}>No images uploaded for this variant.</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
