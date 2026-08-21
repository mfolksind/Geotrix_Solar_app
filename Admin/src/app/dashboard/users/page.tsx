"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { fetchApi } from '../../../utils/api';
import { Edit2, Trash2 } from 'lucide-react';
import styles from './users.module.css';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  familyApprovalStatus?: string;
  isVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [editFormData, setEditFormData] = useState({ role: '', status: '', familyApprovalStatus: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/admin/users');
      if (response.success) {
        const data = response.data?.items || response.data?.data || response.data;
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', role: 'USER' });
        loadUsers();
      } else {
        alert(res.message || 'Failed to create user');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      // Role Update
      if (editFormData.role !== selectedUser.role) {
        await fetchApi(`/admin/users/${selectedUser._id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: editFormData.role }),
        });
      }
      // Status Update
      if (editFormData.status !== selectedUser.status) {
        await fetchApi(`/admin/users/${selectedUser._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: editFormData.status }),
        });
      }
      
      // Family Approval Update
      if (editFormData.familyApprovalStatus && editFormData.familyApprovalStatus !== selectedUser.familyApprovalStatus) {
        // Backend route is /api/users/:id/family-approval
        // Using /api/users to match the newly added user.routes.ts 
        await fetchApi(`/api/users/${selectedUser._id}/family-approval`, {
          method: 'PATCH',
          body: JSON.stringify({ status: editFormData.familyApprovalStatus }),
        });
      }

      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error(error);
      alert('Error updating user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetchApi(`/admin/users/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadUsers();
      } else {
        alert(res.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({ role: user.role, status: user.status, familyApprovalStatus: user.familyApprovalStatus || '' });
    setShowEditModal(true);
  };

  const getRoleClass = (role: string) => {
    if (role === 'SUPER_ADMIN') return styles.roleSuperAdmin;
    if (role === 'ADMIN') return styles.roleAdmin;
    return styles.roleUser;
  };

  const getStatusClass = (status: string) => {
    if (status === 'ACTIVE') return styles.statusActive;
    if (status === 'INACTIVE') return styles.statusInactive;
    return styles.statusSuspended;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>+ Add User</Button>
      </div>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table headers={['Name', 'Email', 'Role', 'Status', 'Family Approval', 'Actions']}>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={{ fontWeight: 500 }}>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`${styles.badge} ${getRoleClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${getStatusClass(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  {user.familyApprovalStatus ? (
                    <span className={`${styles.badge} ${user.familyApprovalStatus === 'approved' ? styles.statusActive : user.familyApprovalStatus === 'rejected' ? styles.statusSuspended : styles.statusInactive}`}>
                      {user.familyApprovalStatus}
                    </span>
                  ) : 'N/A'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                      title="Edit Role/Status"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowCreateModal(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Create New User</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.formGroup}>
                <Input
                  label="Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  className={styles.select}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>

                </select>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role/Status Modal */}
      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Update User: {selectedUser.name}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  className={styles.select}
                  value={editFormData.role}
                  onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="USER">User</option>

                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  className={styles.select}
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Blocked</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Family Approval</label>
                <select
                  className={styles.select}
                  value={editFormData.familyApprovalStatus}
                  onChange={e => setEditFormData({ ...editFormData, familyApprovalStatus: e.target.value })}
                >
                  <option value="">N/A</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
