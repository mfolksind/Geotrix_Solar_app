"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { fetchApi } from '../../../utils/api';
import { Trash2, Plus, Edit2, X } from 'lucide-react';
import styles from './families.module.css';

interface Family {
  _id: string;
  name: string;
  description: string;
  requiresAdminApproval: boolean;
  status: string;
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);

  const loadFamilies = async () => {
    try {
      const response = await fetchApi('/api/families');
      if (response.success) {
        setFamilies(response.data);
      }
    } catch (err) {
      console.error('Failed to load families', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, []);

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      if (editingFamily) {
        res = await fetchApi(`/api/families/${editingFamily._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, description, requiresAdminApproval }),
        });
      } else {
        res = await fetchApi('/api/families', {
          method: 'POST',
          body: JSON.stringify({ name, description, requiresAdminApproval, status: 'ACTIVE' }),
        });
      }

      if (res.success) {
        handleCancelEdit();
        loadFamilies();
      } else {
        alert(res.message || 'Failed to save family');
      }
    } catch (err: any) {
      console.error('Error saving family:', err);
      alert(err?.data?.message || 'Error saving family');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (family: Family) => {
    setEditingFamily(family);
    setName(family.name);
    setDescription(family.description);
    setRequiresAdminApproval(family.requiresAdminApproval);
  };

  const handleCancelEdit = () => {
    setEditingFamily(null);
    setName('');
    setDescription('');
    setRequiresAdminApproval(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Families</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.listSection}>
          <Card>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table headers={['Name', 'Description', 'Requires Approval', 'Status', 'Actions']}>
                {families.map((fam) => (
                  <tr key={fam._id}>
                    <td style={{ fontWeight: 500 }}>{fam.name}</td>
                    <td>{fam.description}</td>
                    <td>{fam.requiresAdminApproval ? 'Yes' : 'No'}</td>
                    <td>{fam.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditClick(fam)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#57c5cc' }}
                          title="Edit Family"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {families.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No families found.</td>
                  </tr>
                )}
              </Table>
            )}
          </Card>
        </div>

        <div className={styles.formSection}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.formTitle}>{editingFamily ? 'Edit Family' : 'Add New Family'}</h2>
              {editingFamily && (
                <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                  <X size={20} />
                </button>
              )}
            </div>
            <form onSubmit={handleAddFamily} className={styles.form}>
              <Input
                label="Family Name"
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
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={requiresAdminApproval}
                  onChange={(e) => setRequiresAdminApproval(e.target.checked)}
                />
                <label htmlFor="requiresApproval">Requires Admin Approval</label>
              </div>
              <Button type="submit" disabled={isSubmitting} fullWidth>
                {editingFamily ? <Edit2 size={18} /> : <Plus size={18} />}
                {isSubmitting ? 'Saving...' : (editingFamily ? 'Update Family' : 'Add Family')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
