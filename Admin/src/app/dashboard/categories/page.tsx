"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { fetchApi } from '../../../utils/api';
import { Trash2, Plus } from 'lucide-react';
import styles from './categories.module.css';

interface Category {
  _id: string;
  name: string;
  description: string;
  family?: string;
}

interface Family {
  _id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [family, setFamily] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategoriesAndFamilies = async () => {
    try {
      const [catRes, famRes] = await Promise.all([
        fetchApi('/api/categories?limit=1000000'),
        fetchApi('/api/families')
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (famRes.success) setFamilies(famRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesAndFamilies();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchApi('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name, description, family: family || undefined }),
      });
      if (res.success) {
        setName('');
        setDescription('');
        setFamily('');
        loadCategoriesAndFamilies();
      } else {
        alert(res.message || 'Failed to add category');
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
      alert(err?.data?.message || 'Error adding category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetchApi(`/admin/categories/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadCategoriesAndFamilies();
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting category');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.listSection}>
          <Card>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table headers={['Name', 'Description', 'Actions']}>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td>{cat.description}</td>
                    <td>
                      <button 
                        className={styles.iconBtn} 
                        onClick={() => handleDelete(cat._id)}
                        title="Delete Category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No categories found.</td>
                  </tr>
                )}
              </Table>
            )}
          </Card>
        </div>

        <div className={styles.formSection}>
          <Card>
            <h2 className={styles.formTitle}>Add New Category</h2>
            <form onSubmit={handleAddCategory} className={styles.form}>
              <Input
                label="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Family</label>
                <select 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                >
                  <option value="">No Family</option>
                  {families.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={isSubmitting} fullWidth>
                <Plus size={18} />
                {isSubmitting ? 'Adding...' : 'Add Category'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
