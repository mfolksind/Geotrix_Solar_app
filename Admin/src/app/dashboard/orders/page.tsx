"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../utils/api';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Box,
  LayoutGrid,
  LayoutList,
  Check,
  Copy,
  ExternalLink,
  Package,
  CreditCard,
  Receipt,
  FileText,
  SlidersHorizontal,
  IndianRupee
} from 'lucide-react';

interface OrderItem {
  _id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    _id?: string;
    name?: string;
    thumbnail?: string;
    slug?: string;
  };
  variant?: {
    _id?: string;
    variantName?: string;
    thumbnail?: string;
    images?: Array<{ url: string } | string>;
    sku?: string;
    price?: number;
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
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
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
    role?: string;
  };
  address?: ShippingAddress;
  items?: OrderItem[];
  itemsCount?: number;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  totalRevenue: number;
}

export default function OrdersPage() {
  const router = useRouter();

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Stats (Catalog-wide, unfiltered)
  const [globalStats, setGlobalStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
  });

  // Filter & Query States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState({ status: '', paymentStatus: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Quick Action Feedback
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Format INR Currency
  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Fetch Global Stats
  const loadGlobalStats = useCallback(async () => {
    try {
      const res = await fetchApi('/api/admin/orders/stats');
      if (res && res.success && res.data) {
        setGlobalStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load global order stats:', err);
    }
  }, []);

  // 2. Fetch Orders List
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPaymentStatus !== 'ALL') params.append('paymentStatus', selectedPaymentStatus);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/api/admin/orders?${params.toString()}`);
      if (res && res.success) {
        setOrders(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotal(res.data?.length || 0);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedPaymentStatus, sortBy, page, limit]);

  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter Event Handlers
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handlePaymentFilter = (val: string) => {
    setSelectedPaymentStatus(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setPage(1);
  };

  const handleLimitChange = (val: number) => {
    setLimit(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedPaymentStatus('ALL');
    setSortBy('createdAt:desc');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStatus !== 'ALL' ||
    selectedPaymentStatus !== 'ALL' ||
    sortBy !== 'createdAt:desc';

  // Copy Order Number helper
  const handleCopyOrderNumber = (orderNumber: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedNumber(orderNumber);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Helper for customer display name
  const getCustomerName = (order: Order) => {
    if (order.user?.name) return order.user.name;
    if (order.user?.firstName || order.user?.lastName) {
      return `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
    }
    if (order.address?.fullName) return order.address.fullName;
    return 'Guest Customer';
  };

  // Open Order Detail Modal
  const openViewModal = async (order: Order) => {
    setEditingOrder(null);
    setViewingOrder(order);
    setLoadingDetails(true);
    try {
      const res = await fetchApi(`/api/admin/orders/${order._id}`);
      if (res && res.success && res.data) {
        setViewingOrder(res.data);
      }
    } catch (err) {
      console.error('Failed to load full order details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Status Edit Modal
  const openEditModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingOrder(null);
    setEditingOrder(order);
    setEditFormData({
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
    setUpdateError('');
  };

  // Submit Status Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsUpdating(true);
    setUpdateError('');

    try {
      // 1. Update Order Status if changed
      if (editFormData.status !== editingOrder.status) {
        const statusRes = await fetchApi(`/api/admin/orders/${editingOrder._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: editFormData.status }),
        });
        if (!statusRes?.success) {
          throw new Error(statusRes?.message || 'Failed to update order status');
        }
      }

      // 2. Update Payment Status if changed
      if (editFormData.paymentStatus !== editingOrder.paymentStatus) {
        const paymentRes = await fetchApi(`/api/admin/orders/${editingOrder._id}/payment-status`, {
          method: 'PATCH',
          body: JSON.stringify({ paymentStatus: editFormData.paymentStatus }),
        });
        if (!paymentRes?.success) {
          throw new Error(paymentRes?.message || 'Failed to update payment status');
        }
      }

      setEditingOrder(null);
      loadOrders();
      loadGlobalStats();
    } catch (err: any) {
      setUpdateError(err?.message || 'Error updating order');
    } finally {
      setIsUpdating(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 size={12} />
            <span>Delivered</span>
          </span>
        );
      case 'PROCESSING':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
            <Clock size={12} />
            <span>{status}</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
            <Truck size={12} />
            <span>Shipped</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <XCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  // Payment Status Badge Helper
  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            PAID
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            FAILED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            REFUNDED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Customer Orders
            </h1>
            <span className="bg-[#57c5cc]/10 text-[#57c5cc] font-semibold text-xs px-2.5 py-1 rounded-full">
              {globalStats.totalOrders} Total Orders
            </span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Track fulfillment workflows, invoice totals, payments, and shipping dispatches
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Table View"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2.5 bg-surface border border-border text-foreground/70 hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-[#57c5cc]' : ''} />
          </button>
        </div>
      </div>

      {/* Global Stat Cards (Catalog Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Orders</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalOrders}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Revenue</p>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">Paid</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(globalStats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Active / Pending</p>
              <span className="text-[10px] text-cyan-600 font-mono font-bold">
                {globalStats.pendingOrders + globalStats.processingOrders}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {globalStats.pendingOrders + globalStats.processingOrders}
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Delivered</p>
              <span className="text-[10px] text-purple-600 font-mono font-bold">
                {globalStats.totalOrders > 0
                  ? `${Math.round((globalStats.deliveredOrders / globalStats.totalOrders) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.deliveredOrders}</p>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by order #, customer name, email, or phone..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Table Count Selector & Reset Controls */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* Show per page dropdown */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground/70">
              <span className="font-medium">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={0}>All rows</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RefreshCw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => handlePaymentFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PENDING">Payment Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="createdAt:desc">Newest Orders First</option>
              <option value="createdAt:asc">Oldest Orders First</option>
              <option value="totalAmount:desc">Highest Amount</option>
              <option value="totalAmount:asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-3"></div>
          <p className="text-sm font-medium text-foreground/60">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-foreground/40 mx-auto mb-3">
            <ShoppingCart size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No orders found</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No orders match your filter criteria. Try resetting filters.'
              : 'Customer orders will appear here once placed.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-border text-foreground/60 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {orders.map((order) => {
                  const customerName = getCustomerName(order);
                  const orderDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={order._id}
                      onClick={() => openViewModal(order)}
                      className="hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground group-hover:text-[#57c5cc] transition-colors">
                            {order.orderNumber}
                          </span>
                          <button
                            onClick={(e) => handleCopyOrderNumber(order.orderNumber, e)}
                            className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                            title="Copy Order #"
                          >
                            {copiedNumber === order.orderNumber ? (
                              <Check size={12} className="text-[#57c5cc]" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>{orderDate}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center font-bold text-xs shrink-0">
                            {customerName.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{customerName}</div>
                            <div className="text-xs text-foreground/50 truncate max-w-[180px]">
                              {order.user?.email || order.user?.phone || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-background border border-border text-foreground">
                          <Package size={13} className="text-foreground/50" />
                          <span>{order.itemsCount || order.items?.length || 1} Items</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openViewModal(order)}
                            className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                            title="View order details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => openEditModal(order, e)}
                            className="p-1.5 text-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Update Status"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => {
            const customerName = getCustomerName(order);
            const orderDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <div
                key={order._id}
                onClick={() => openViewModal(order)}
                className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#57c5cc]/40 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground text-sm">
                          {order.orderNumber}
                        </span>
                        <button
                          onClick={(e) => handleCopyOrderNumber(order.orderNumber, e)}
                          className="text-foreground/40 hover:text-foreground"
                          title="Copy"
                        >
                          {copiedNumber === order.orderNumber ? (
                            <Check size={12} className="text-[#57c5cc]" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-foreground/50 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{orderDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div className="p-3 bg-background border border-border rounded-xl mb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center font-bold text-xs shrink-0">
                      {customerName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-foreground text-xs truncate">{customerName}</div>
                      <div className="text-[11px] text-foreground/50 truncate">
                        {order.user?.email || order.user?.phone || 'No email provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                      Total ({order.itemsCount || order.items?.length || 1} items)
                    </div>
                    <div className="font-bold text-foreground text-base">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openViewModal(order)}
                      className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => openEditModal(order, e)}
                      className="p-1.5 text-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Edit Status"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-foreground/60">
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-foreground">{total}</span> orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-foreground px-3 py-1.5 bg-background border border-border rounded-xl">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          ORDER DETAIL MODAL
         ========================================================= */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-border max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-foreground">Order #{viewingOrder.orderNumber}</h3>
                  {getStatusBadge(viewingOrder.status)}
                  {getPaymentBadge(viewingOrder.paymentStatus)}
                </div>
                <p className="text-xs text-foreground/50 mt-1 flex items-center gap-2">
                  <span>
                    Placed on{' '}
                    {viewingOrder.createdAt
                      ? new Date(viewingOrder.createdAt).toLocaleString('en-IN')
                      : 'N/A'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(viewingOrder)}
                  className="px-3 py-1.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Edit2 size={13} />
                  <span>Update Status</span>
                </button>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-2"></div>
                  <p className="text-xs text-foreground/60">Fetching full order details...</p>
                </div>
              ) : (
                <>
                  {/* Order Items Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2.5">
                      Order Items ({viewingOrder.items?.length || 0})
                    </h4>
                    <div className="bg-background border border-border rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-foreground/[0.02] border-b border-border text-[11px] font-semibold text-foreground/60 uppercase">
                            <th className="py-2.5 px-4">Item Description</th>
                            <th className="py-2.5 px-4 text-center">Unit Price</th>
                            <th className="py-2.5 px-4 text-center">Qty</th>
                            <th className="py-2.5 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {viewingOrder.items && viewingOrder.items.length > 0 ? (
                            viewingOrder.items.map((item, idx) => (
                              <tr key={item._id || idx} className="hover:bg-foreground/[0.01]">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    {item.variant?.thumbnail || item.product?.thumbnail ? (
                                      <img
                                        src={item.variant?.thumbnail || item.product?.thumbnail}
                                        alt={item.productName}
                                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0 bg-surface"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center font-bold text-xs shrink-0">
                                        {item.productName?.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-foreground text-sm">
                                        {item.productName}
                                      </div>
                                      <div className="text-xs text-foreground/50 flex items-center gap-2">
                                        <span>Variant: {item.variantName}</span>
                                        {item.variant?.sku && (
                                          <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border">
                                            SKU: {item.variant.sku}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center text-foreground/80">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-3 px-4 text-center font-semibold text-foreground">
                                  {item.quantity}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-foreground">
                                  {formatCurrency(item.subtotal)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-foreground/50">
                                No individual items found in this order record.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Customer, Shipping, and Payment Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer & Shipping */}
                    <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/60">
                        <MapPin size={14} className="text-[#57c5cc]" />
                        <span>Shipping & Customer Details</span>
                      </div>
                      <div className="text-xs space-y-1.5">
                        <p className="font-bold text-foreground text-sm">
                          {getCustomerName(viewingOrder)}
                        </p>
                        {viewingOrder.user?.email && (
                          <p className="text-foreground/70">Email: {viewingOrder.user.email}</p>
                        )}
                        {(viewingOrder.user?.phone || viewingOrder.address?.phone) && (
                          <p className="text-foreground/70">
                            Phone: {viewingOrder.address?.phone || viewingOrder.user?.phone}
                          </p>
                        )}
                        {viewingOrder.address ? (
                          <div className="pt-2 border-t border-border/60 text-foreground/80 leading-relaxed">
                            <p>{viewingOrder.address.addressLine1}</p>
                            {viewingOrder.address.addressLine2 && (
                              <p>{viewingOrder.address.addressLine2}</p>
                            )}
                            <p>
                              {viewingOrder.address.city}, {viewingOrder.address.state} -{' '}
                              {viewingOrder.address.postalCode}
                            </p>
                            <p>{viewingOrder.address.country || 'India'}</p>
                          </div>
                        ) : (
                          <p className="text-foreground/40 italic pt-2">No physical address stored.</p>
                        )}
                      </div>
                    </div>

                    {/* Order Financial Totals */}
                    <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/60">
                        <Receipt size={14} className="text-[#57c5cc]" />
                        <span>Payment & Invoice Summary</span>
                      </div>
                      <div className="text-xs space-y-2">
                        <div className="flex justify-between text-foreground/70">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            {formatCurrency(viewingOrder.subtotal || viewingOrder.totalAmount)}
                          </span>
                        </div>
                        {Number(viewingOrder.tax || 0) > 0 && (
                          <div className="flex justify-between text-foreground/70">
                            <span>Tax:</span>
                            <span className="font-medium">{formatCurrency(viewingOrder.tax)}</span>
                          </div>
                        )}
                        {Number(viewingOrder.shippingCharge || 0) > 0 && (
                          <div className="flex justify-between text-foreground/70">
                            <span>Shipping:</span>
                            <span className="font-medium">
                              {formatCurrency(viewingOrder.shippingCharge)}
                            </span>
                          </div>
                        )}
                        {Number(viewingOrder.discount || 0) > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount:</span>
                            <span className="font-medium">
                              -{formatCurrency(viewingOrder.discount)}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-foreground">
                          <span>Grand Total:</span>
                          <span className="text-base text-[#57c5cc]">
                            {formatCurrency(viewingOrder.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes if any */}
                  {viewingOrder.notes && (
                    <div className="p-3 bg-background border border-border rounded-xl text-xs text-foreground/80">
                      <span className="font-bold text-foreground block mb-1">Customer Note:</span>
                      {viewingOrder.notes}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-surface border border-border text-foreground hover:bg-background rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          UPDATE STATUS MODAL
         ========================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Update Order Status</h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Order #{editingOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {updateError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Order Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground font-medium cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Payment Status
                </label>
                <select
                  value={editFormData.paymentStatus}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, paymentStatus: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] text-foreground font-medium cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 border border-border text-foreground/80 rounded-xl text-xs font-medium hover:bg-background transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-[#57c5cc] hover:bg-[#45a0a6] text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdating && <RefreshCw size={14} className="animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
