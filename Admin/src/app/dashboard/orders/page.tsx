"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { fetchApi } from '../../../utils/api';
import { Edit2 } from 'lucide-react';
import styles from './orders.module.css';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);


  const [editFormData, setEditFormData] = useState({ status: '', paymentStatus: '' });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/api/orders');
      if (response.success) {
        const data = response.data?.items || response.data?.data || response.data;
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      if (editFormData.status !== selectedOrder.status) {
        await fetchApi(`/api/admin/orders/${selectedOrder._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: editFormData.status }),
        });
      }

      if (editFormData.paymentStatus !== selectedOrder.paymentStatus) {
        await fetchApi(`/api/admin/orders/${selectedOrder._id}/payment-status`, {
          method: 'PATCH',
          body: JSON.stringify({ paymentStatus: editFormData.paymentStatus }),
        });
      }

      setShowEditModal(false);
      loadOrders();
    } catch (error) {
      console.error(error);
      alert('Error updating order');
    }
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({ status: order.status, paymentStatus: order.paymentStatus });
    setShowEditModal(true);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.statusPending;
      case 'CONFIRMED': return styles.statusConfirmed;
      case 'PROCESSING': return styles.statusProcessing;
      case 'SHIPPED': return styles.statusShipped;
      case 'DELIVERED': return styles.statusDelivered;
      case 'CANCELLED': return styles.statusCancelled;
      default: return '';
    }
  };

  const getPaymentClass = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.paymentPending;
      case 'PAID': return styles.paymentPaid;
      case 'FAILED': return styles.paymentFailed;
      case 'REFUNDED': return styles.paymentRefunded;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders Management</h1>
      </div>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table headers={['Order Number', 'User', 'Total Amount', 'Date', 'Payment', 'Status', 'Actions']}>
            {orders.map((order) => (
              <tr key={order._id}
                className={styles.rowClickable}
                onClick={() => setSelectedOrder(order)}>
                <td style={{ fontWeight: 500 }}>{order.orderNumber}</td>
                <td>
                  <div>{order.user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>{order.user?.email || ''}</div>
                </td>
                <td>${(order.totalAmount || 0).toLocaleString()}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`${styles.badge} ${getPaymentClass(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => openEditModal(order)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                    title="Update Status"
                  >
                    <Edit2
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(order);
                      }}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Edit Status Modal */}
      {showEditModal && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Update Order: {selectedOrder.orderNumber}</h2>
            <form onSubmit={handleEditSubmit}>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>User</span>
                  <span className={styles.detailValue}>{selectedOrder.user?.name || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Amount</span>
                  <span className={styles.detailValue}>${selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Order Status</label>
                <select
                  className={styles.select}
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Payment Status</label>
                <select
                  className={styles.select}
                  value={editFormData.paymentStatus}
                  onChange={e => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit">Update Order</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedOrder(null)}
        >

          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >

            <button
              className={styles.closeButton}
              onClick={() => setSelectedOrder(null)}
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>
              Order Details
            </h2>

            <div className={styles.detailGrid}>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Order Number</span>
                <span className={styles.detailValue}>
                  {selectedOrder.orderNumber}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Customer</span>
                <span className={styles.detailValue}>
                  {selectedOrder.user?.name}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>
                  {selectedOrder.user?.email}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Amount</span>
                <span className={styles.detailValue}>
                  ${selectedOrder.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Order Status</span>
                <span className={styles.detailValue}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Payment Status</span>
                <span className={styles.detailValue}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Created At</span>
                <span className={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
