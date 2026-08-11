"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { fetchApi } from '../../../utils/api';
import { Trash2 } from 'lucide-react';
import styles from './addresses.module.css';

interface Address {
  _id: string;
  user?: {

    email: string;


  };
  fullName: string,
  addressLine1: string,
  addressLine2: string,
  landmark: string,
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: string;
  isDefault: boolean;
  createdAt: string;
  addressType: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/api/addresses?all=true');
      if (response.success) {
        const data = response.data?.items || response.data?.data || response.data;
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetchApi(`/admin/addresses/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadAddresses();
      } else {
        alert(res.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'BILLING': return styles.badgeBilling;
      case 'SHIPPING': return styles.badgeShipping;
      default: return styles.badgeNormal;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Addresses Management</h1>
      </div>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table headers={['User', 'Address', 'City / State', 'Country / Zip', 'Type', 'Default', 'Actions']}>
            {addresses.map((address) => (
              <tr key={address._id}
                className={styles.rowClickable}
                onClick={() => setSelectedAddress(address)}>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {address.addressType || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>
                    {address.user?.email || ''}
                  </div>
                </td>
                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {address.addressLine1} {address.addressLine2}  {address.landmark}  {address.street}
                </td>
                <td>
                  <div>{address.city}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>{address.state}</div>
                </td>
                <td>
                  <div>{address.country}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>{address.postalCode}</div>
                </td>
                <td>
                  <span className={`${styles.badge} ${getTypeClass(address.type)}`}>
                    {address.type || 'N/A'}
                  </span>
                </td>
                <td>
                  {address.isDefault ? (
                    <span className={`${styles.badge} ${styles.badgeDefault}`}>Yes</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeNormal}`}>No</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(address._id);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    title="Delete Address"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {addresses.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No addresses found.</td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {selectedAddress && (

        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedAddress(null)}
        >

          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >

            <button
              className={styles.closeButton}
              onClick={() => setSelectedAddress(null)}
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>
              Address Details
            </h2>

            <div className={styles.detailGrid}>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Full Name</span>
                <span className={styles.detailValue}>
                  {selectedAddress.fullName}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>
                  {selectedAddress.user?.email}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Address Type</span>
                <span className={styles.detailValue}>
                  {selectedAddress.addressType}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>
                  {selectedAddress.type}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Default</span>
                <span className={styles.detailValue}>
                  {selectedAddress.isDefault ? "Yes" : "No"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Address Line 1</span>
                <span className={styles.detailValue}>
                  {selectedAddress.addressLine1}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Address Line 2</span>
                <span className={styles.detailValue}>
                  {selectedAddress.addressLine2}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Landmark</span>
                <span className={styles.detailValue}>
                  {selectedAddress.landmark}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Street</span>
                <span className={styles.detailValue}>
                  {selectedAddress.street}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>City</span>
                <span className={styles.detailValue}>
                  {selectedAddress.city}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>State</span>
                <span className={styles.detailValue}>
                  {selectedAddress.state}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Postal Code</span>
                <span className={styles.detailValue}>
                  {selectedAddress.postalCode}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Country</span>
                <span className={styles.detailValue}>
                  {selectedAddress.country}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Created At</span>
                <span className={styles.detailValue}>
                  {new Date(selectedAddress.createdAt).toLocaleString()}
                </span>
              </div>

            </div>

          </div>

        </div>

      )}
    </div>
  );
}
