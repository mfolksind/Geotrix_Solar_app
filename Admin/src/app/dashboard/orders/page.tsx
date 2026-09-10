"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Button } from '../../../components/Button/Button';
import { fetchApi } from '../../../utils/api';
import { Edit2, Eye, Package, User, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import styles from './orders.module.css';

interface OrderItem {
  _id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    _id?: string;
    thumbnail?: string;
    slug?: string;
  };
  variant?: {
    _id?: string;
    images?: Array<{ url: string } | string>;
    slug?: string;
  };
}

interface ShippingAddress {
  _id?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  addressType?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal?: number;
  shippingCharge?: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    _id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  address?: ShippingAddress;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Distinct modal states - only one modal can be active at a time
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState({ status: '', paymentStatus: '' });
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/api/orders?all=true');
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

  const openViewModal = async (order: Order) => {
    setEditingOrder(null); // Ensure edit modal is closed
    setViewingOrder(order); // Show immediately with basic data
    setLoadingDetails(true);
    try {
      const response = await fetchApi(`/api/orders/${order._id}`);
      if (response.success && response.data) {
        setViewingOrder(response.data);
      }
    } catch (error) {
      console.error('Failed to load order details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openEditModal = (order: Order) => {
    setViewingOrder(null); // Ensure view modal is closed
    setEditingOrder(order);
    setEditFormData({ status: order.status, paymentStatus: order.paymentStatus });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setUpdating(true);
    try {
      if (editFormData.status !== editingOrder.status) {
        await fetchApi(`/api/admin/orders/${editingOrder._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: editFormData.status }),
        });
      }

      if (editFormData.paymentStatus !== editingOrder.paymentStatus) {
        await fetchApi(`/api/admin/orders/${editingOrder._id}/payment-status`, {
          method: 'PATCH',
          body: JSON.stringify({ paymentStatus: editFormData.paymentStatus }),
        });
      }

      setEditingOrder(null);
      await loadOrders();
    } catch (error) {
      console.error(error);
      alert('Error updating order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.statusPending;
      case 'CONFIRMED': return styles.statusConfirmed;
      case 'PROCESSING': return styles.statusProcessing;
      case 'SHIPPED': return styles.statusShipped;
      case 'DELIVERED': return styles.statusDelivered;
      case 'CANCELLED': return styles.statusCancelled;
      case 'RETURNED': return styles.statusReturned;
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

  const getUserDisplayName = (user?: Order['user']) => {
    if (!user) return 'Unknown Customer';
    if (user.name) return user.name;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'Customer';
  };

  const getItemThumbnail = (item: OrderItem) => {
    if (item.product?.thumbnail) return item.product.thumbnail;
    if (item.variant?.images && item.variant.images.length > 0) {
      const first = item.variant.images[0];
      return typeof first === 'string' ? first : first.url;
    }
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders Management</h1>
      </div>

      <Card>
        {loading ? (
          <p style={{ padding: '1rem', color: '#64748b' }}>Loading orders...</p>
        ) : (
          <Table headers={['Order Number', 'Customer', 'Total Amount', 'Date', 'Payment', 'Status', 'Actions']}>
            {orders.map((order) => (
              <tr
                key={order._id}
                className={styles.rowClickable}
                onClick={() => openViewModal(order)}
              >
                <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{getUserDisplayName(order.user)}</div>
                  <div style={{ fontSize: '0.825em', color: '#64748b' }}>{order.user?.email || ''}</div>
                </td>
                <td style={{ fontWeight: 600 }}>${(order.totalAmount || 0).toLocaleString()}</td>
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
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.actionBtnView}
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(order);
                      }}
                      title="View Order Details"
                    >
                      <Eye size={15} />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtnEdit}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(order);
                      }}
                      title="Edit Order Status"
                    >
                      <Edit2 size={15} />
                      <span>Edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className={styles.modalOverlay} onClick={() => setViewingOrder(null)}>
          <div className={styles.viewModalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setViewingOrder(null)}
              title="Close"
            >
              &times;
            </button>

            <h2 className={styles.modalTitle}>Order #{viewingOrder.orderNumber}</h2>

            <div className={styles.modalSubtitle}>
              <span>
                <Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                {new Date(viewingOrder.createdAt).toLocaleDateString()} at {new Date(viewingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span className={`${styles.badge} ${getStatusClass(viewingOrder.status)}`}>
                Order: {viewingOrder.status}
              </span>
              <span className={`${styles.badge} ${getPaymentClass(viewingOrder.paymentStatus)}`}>
                Payment: {viewingOrder.paymentStatus}
              </span>
            </div>

            {/* Customer & Shipping Section */}
            <div className={styles.detailGrid} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.sectionCard} style={{ margin: 0 }}>
                <div className={styles.sectionHeader}>
                  <User size={18} color="var(--primary, #57c5cc)" />
                  <span>Customer Information</span>
                </div>
                <div className={styles.detailItem} style={{ marginBottom: '0.5rem' }}>
                  <span className={styles.detailLabel}>Name</span>
                  <span className={styles.detailValue}>{getUserDisplayName(viewingOrder.user)}</span>
                </div>
                <div className={styles.detailItem} style={{ marginBottom: '0.5rem' }}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{viewingOrder.user?.email || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone</span>
                  <span className={styles.detailValue}>{viewingOrder.user?.phone || viewingOrder.address?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className={styles.sectionCard} style={{ margin: 0 }}>
                <div className={styles.sectionHeader}>
                  <MapPin size={18} color="var(--secondary, #41b64d)" />
                  <span>Shipping Address</span>
                  {viewingOrder.address?.addressType && (
                    <span className={styles.badge} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                      {viewingOrder.address.addressType}
                    </span>
                  )}
                </div>
                {viewingOrder.address ? (
                  <>
                    <div className={styles.detailItem} style={{ marginBottom: '0.4rem' }}>
                      <span className={styles.detailLabel}>Recipient</span>
                      <span className={styles.detailValue}>{viewingOrder.address.fullName || getUserDisplayName(viewingOrder.user)}</span>
                    </div>
                    <div className={styles.detailItem} style={{ marginBottom: '0.4rem' }}>
                      <span className={styles.detailLabel}>Address</span>
                      <span className={styles.detailValue}>
                        {[viewingOrder.address.addressLine1, viewingOrder.address.addressLine2, viewingOrder.address.landmark].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>City / State / Zip</span>
                      <span className={styles.detailValue}>
                        {[viewingOrder.address.city, viewingOrder.address.state, viewingOrder.address.postalCode, viewingOrder.address.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No shipping address provided.</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {viewingOrder.notes && (
              <div className={styles.sectionCard} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.sectionHeader}>
                  <span>Customer Notes</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--foreground)' }}>{viewingOrder.notes}</p>
              </div>
            )}

            {/* Order Items Table */}
            <div className={styles.sectionCard} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.sectionHeader}>
                <Package size={18} color="#2563eb" />
                <span>Order Items ({viewingOrder.items?.length || 0})</span>
              </div>

              {loadingDetails && !viewingOrder.items ? (
                <div className={styles.loadingBanner}>Loading item details...</div>
              ) : viewingOrder.items && viewingOrder.items.length > 0 ? (
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrder.items.map((item, idx) => {
                        const thumb = getItemThumbnail(item);
                        return (
                          <tr key={item._id || idx}>
                            <td>
                              <div className={styles.itemInfo}>
                                {thumb ? (
                                  <img src={thumb} alt={item.productName} className={styles.itemThumbnail} />
                                ) : (
                                  <div className={styles.itemThumbnailFallback}>
                                    <Package size={20} />
                                  </div>
                                )}
                                <div>
                                  <div className={styles.itemTitle}>{item.productName}</div>
                                  {item.variantName && (
                                    <div className={styles.itemVariant}>Variant: {item.variantName}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>${(item.unitPrice || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              ${(item.subtotal || item.unitPrice * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  No item breakdown available for this order.
                </p>
              )}

              {/* Pricing Breakdown */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>${(viewingOrder.subtotal ?? viewingOrder.totalAmount).toLocaleString()}</span>
                </div>
                {Boolean(viewingOrder.shippingCharge) && (
                  <div className={styles.summaryRow}>
                    <span>Shipping</span>
                    <span>${(viewingOrder.shippingCharge || 0).toLocaleString()}</span>
                  </div>
                )}
                {Boolean(viewingOrder.tax) && (
                  <div className={styles.summaryRow}>
                    <span>Tax</span>
                    <span>${(viewingOrder.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                {Boolean(viewingOrder.discount) && (
                  <div className={styles.summaryRow} style={{ color: '#059669' }}>
                    <span>Discount</span>
                    <span>-${(viewingOrder.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.summaryRowTotal}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary, #57c5cc)' }}>${(viewingOrder.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <Button type="button" variant="outline" onClick={() => setViewingOrder(null)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const ord = viewingOrder;
                  setViewingOrder(null);
                  openEditModal(ord);
                }}
              >
                <Edit2 size={15} style={{ marginRight: '6px' }} />
                Edit Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingOrder && (
        <div className={styles.modalOverlay} onClick={() => setEditingOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setEditingOrder(null)}
              title="Close"
            >
              &times;
            </button>

            <h2 className={styles.modalTitle}>Update Order #{editingOrder.orderNumber}</h2>

            <form onSubmit={handleEditSubmit}>
              <div className={styles.sectionCard} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Customer</span>
                    <span className={styles.detailValue}>{getUserDisplayName(editingOrder.user)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total Amount</span>
                    <span className={styles.detailValue}>${editingOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="orderStatusSelect">Order Status</label>
                <select
                  id="orderStatusSelect"
                  className={styles.select}
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
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
                <label htmlFor="paymentStatusSelect">Payment Status</label>
                <select
                  id="paymentStatusSelect"
                  className={styles.select}
                  value={editFormData.paymentStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setEditingOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
