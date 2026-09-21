"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Building,
  Receipt,
  Percent,
  Calendar,
  Phone,
  Mail,
  ArrowUpRight
} from 'lucide-react';

interface OrderLinked {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  shippingCharge?: number;
  discount?: number;
}

interface UserLinked {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface PaymentItem {
  _id: string;
  order?: OrderLinked | string;
  user?: UserLinked | string;
  paymentMethod: string;
  paymentProvider?: string;
  transactionId?: string;
  providerOrderId?: string;
  subtotal?: number;
  taxAmount?: number;
  cgst?: number;
  sgst?: number;
  discount?: number;
  shippingFee?: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | string;
  paidAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalVolume: number;
}

export default function PaymentsManagementPage() {
  // Stats
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalVolume: 0,
  });

  // Data
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('SUCCESS');
  const [failureReasonInput, setFailureReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchApi('/admin/payments/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load payment stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load payments list
  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (methodFilter !== 'ALL') params.append('paymentMethod', methodFilter);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/admin/payments?${params.toString()}`);
      if (res.success) {
        if (res.data && res.data.items) {
          setPayments(res.data.items);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.items.length);
        } else if (Array.isArray(res.data)) {
          setPayments(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setPayments([]);
        }
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [search, statusFilter, methodFilter, sortBy, page, limit]);

  // Handle Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/payments/${selectedPayment._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          failureReason: failureReasonInput.trim() || undefined,
        }),
      });

      if (res.success) {
        setShowStatusModal(false);
        loadPayments();
        loadStats();
        if (selectedPayment) {
          setSelectedPayment(res.data || { ...selectedPayment, status: newStatus });
        }
      } else {
        alert(res.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating payment status');
    } finally {
      setActionLoading(false);
    }
  };

  // 18% GST Billing Calculator Helper
  const getBillingDetails = (payment: PaymentItem) => {
    const totalAmount = payment.amount || 0;
    // If order has subtotal, use it; otherwise compute back from 18% tax
    const orderObj = typeof payment.order === 'object' && payment.order !== null ? payment.order : null;
    const subtotal = payment.subtotal || orderObj?.subtotal || Math.round((totalAmount / 1.18) * 100) / 100;
    const taxAmount = payment.taxAmount || orderObj?.tax || Math.round((totalAmount - subtotal) * 100) / 100;
    const cgst = payment.cgst || Math.round((taxAmount / 2) * 100) / 100;
    const sgst = payment.sgst || Math.round((taxAmount / 2) * 100) / 100;

    return {
      subtotal,
      taxRate: 18,
      taxAmount,
      cgst,
      sgst,
      totalAmount,
    };
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Captured
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <RotateCcw className="w-3 h-3" /> Refunded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#57c5cc]" />
            Payments & Billing Transactions
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Monitor gateway transactions, automatic 18% GST billing breakdowns, and captured customer revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadPayments();
            }}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 text-foreground/70 transition"
            title="Refresh Payments"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Collected Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ₹{statsLoading ? '...' : stats.totalVolume.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">From {stats.successfulPayments} paid orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Payments */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats.totalPayments.toLocaleString()}
            </p>
            <p className="text-xs text-foreground/50">All payment attempts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Pending / Processing</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsLoading ? '...' : stats.pendingPayments.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Awaiting gateway capture</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Failed / Refunded */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Failed & Refunded</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statsLoading ? '...' : (stats.failedPayments + stats.refundedPayments).toLocaleString()}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">{stats.refundedPayments} refunds processed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Search by transaction ID, provider order ID, customer, or order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#57c5cc] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Captured / Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Methods</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="COD">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Net Banking</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>

            {/* Rows Per Page */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border">
          <RefreshCw className="w-8 h-8 text-[#57c5cc] animate-spin mx-auto mb-3" />
          <p className="text-sm text-foreground/60 font-medium">Loading payments ledger...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Payment Records Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            No gateway transactions match your selected search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setMethodFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-medium transition"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/2 text-foreground/60 text-xs font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Transaction / Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">18% GST Breakdown</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const userObj = typeof p.user === 'object' && p.user !== null ? (p.user as UserLinked) : null;
                  const orderObj = typeof p.order === 'object' && p.order !== null ? (p.order as OrderLinked) : null;
                  const billing = getBillingDetails(p);

                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedPayment(p)}
                      className="hover:bg-foreground/2 transition group cursor-pointer"
                    >
                      {/* Transaction / Order */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
                            <span>{p.transactionId || `PAY-${p._id.slice(-6)}`}</span>
                            {p.transactionId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(p.transactionId!, p._id);
                                }}
                                className="text-foreground/40 hover:text-foreground"
                                title="Copy Transaction ID"
                              >
                                {copiedId === p._id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          {orderObj && (
                            <span className="inline-block px-2 py-0.5 rounded-md text-2xs font-mono font-medium bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20">
                              Order: {orderObj.orderNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        {userObj ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-xs text-foreground flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#57c5cc]" />
                              {userObj.name}
                            </p>
                            <p className="text-2xs text-foreground/50">{userObj.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/40 font-mono">
                            User #{typeof p.user === 'string' ? p.user.slice(-6) : '—'}
                          </span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground border border-border">
                          {p.paymentMethod}
                        </span>
                      </td>

                      {/* 18% GST Breakdown */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-foreground/70">
                            Base: <span className="font-semibold text-foreground">₹{billing.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="text-2xs text-[#57c5cc] font-medium">
                            +18% GST: ₹{billing.taxAmount.toLocaleString()} (9% CGST + 9% SGST)
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 font-bold text-sm text-foreground">
                        ₹{billing.totalAmount.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(p.status)}</td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-foreground/60">
                        {new Date(p.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition"
                            title="View Full 18% Tax Billing Breakup"
                          >
                            <Eye className="w-4 h-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => {
            const userObj = typeof p.user === 'object' && p.user !== null ? (p.user as UserLinked) : null;
            const orderObj = typeof p.order === 'object' && p.order !== null ? (p.order as OrderLinked) : null;
            const billing = getBillingDetails(p);

            return (
              <div
                key={p._id}
                onClick={() => setSelectedPayment(p)}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between hover:border-[#57c5cc]/40 transition space-y-4 cursor-pointer"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-2xs font-mono font-semibold text-foreground/60">
                        {p.transactionId || `PAY-${p._id.slice(-6)}`}
                      </span>
                      {orderObj && (
                        <p className="text-2xs text-[#57c5cc] font-mono mt-0.5">Order: {orderObj.orderNumber}</p>
                      )}
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#57c5cc]" />
                      {userObj?.name || 'Customer'}
                    </p>
                    <p className="text-2xs text-foreground/50">{userObj?.email || '—'}</p>
                  </div>

                  {/* 18% Billing Card */}
                  <div className="mt-3 p-3 rounded-xl bg-background border border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-foreground/60">
                      <span>Base Subtotal:</span>
                      <span className="font-semibold text-foreground">₹{billing.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#57c5cc]">
                      <span>18% GST (9%+9%):</span>
                      <span className="font-semibold">₹{billing.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border font-bold text-sm text-foreground">
                      <span>Total Paid:</span>
                      <span>₹{billing.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div
                  className="pt-3 border-t border-border flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-2xs text-foreground/40">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] font-medium text-2xs transition flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice Breakup
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && payments.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> payment transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-medium text-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAYMENT DETAILS & 18% TAX BILLING BREAKUP MODAL                           */}
      {/* ========================================================================= */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-foreground/2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">Payment Breakup & Tax Receipt</h3>
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                  <p className="text-xs text-foreground/50 font-mono mt-0.5">
                    TXN: {selectedPayment.transactionId || selectedPayment._id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* 18% GST Itemized Tax Breakdown Card */}
              {(() => {
                const billing = getBillingDetails(selectedPayment);
                return (
                  <div className="p-5 rounded-2xl bg-background border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-2xs font-semibold text-[#57c5cc] uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" />
                        18% GST Statutory Billing Breakup
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-[#57c5cc]/10 text-[#57c5cc]">
                        18% GST Applicable
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 text-foreground">
                      <div className="flex items-center justify-between text-foreground/70">
                        <span>Taxable Value (Subtotal):</span>
                        <span className="font-semibold text-foreground">₹{billing.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-foreground/70">
                        <span>Central GST (CGST @ 9.0%):</span>
                        <span className="font-semibold text-foreground">₹{billing.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-foreground/70">
                        <span>State GST (SGST @ 9.0%):</span>
                        <span className="font-semibold text-foreground">₹{billing.sgst.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#57c5cc] font-medium">
                        <span>Total 18% Tax Component:</span>
                        <span className="font-bold">₹{billing.taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border font-bold text-base text-foreground">
                        <span>Grand Total Captured Amount:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{billing.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Gateway & Transaction Data */}
              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Payment Processing Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-foreground">
                  <div>
                    <span className="text-foreground/50">Payment Method:</span>
                    <span className="font-semibold ml-1.5">{selectedPayment.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-foreground/50">Provider:</span>
                    <span className="font-semibold ml-1.5">{selectedPayment.paymentProvider || 'Razorpay'}</span>
                  </div>
                  {selectedPayment.providerOrderId && (
                    <div className="sm:col-span-2">
                      <span className="text-foreground/50">Gateway Order ID:</span>
                      <span className="font-mono font-medium ml-1.5">{selectedPayment.providerOrderId}</span>
                    </div>
                  )}
                  {selectedPayment.paidAt && (
                    <div className="sm:col-span-2">
                      <span className="text-foreground/50">Paid Timestamp:</span>
                      <span className="font-medium ml-1.5">{new Date(selectedPayment.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedPayment.failureReason && (
                    <div className="sm:col-span-2 text-red-600 dark:text-red-400">
                      <span className="font-semibold">Failure / Error Reason:</span>
                      <p className="mt-0.5 font-mono">{selectedPayment.failureReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer & Linked Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer */}
                <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
                  <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">Customer</p>
                  {typeof selectedPayment.user === 'object' && selectedPayment.user !== null ? (
                    <div>
                      <p className="font-bold text-foreground">{(selectedPayment.user as UserLinked).name}</p>
                      <p className="text-foreground/60">{(selectedPayment.user as UserLinked).email}</p>
                      {(selectedPayment.user as UserLinked).phone && (
                        <p className="text-foreground/50">{(selectedPayment.user as UserLinked).phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-mono text-foreground/60">User ID: #{selectedPayment.user}</p>
                  )}
                </div>

                {/* Linked Order */}
                <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
                  <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">Linked Order</p>
                  {typeof selectedPayment.order === 'object' && selectedPayment.order !== null ? (
                    <div>
                      <p className="font-bold text-foreground">
                        {(selectedPayment.order as OrderLinked).orderNumber}
                      </p>
                      <p className="text-foreground/60">
                        Status: {(selectedPayment.order as OrderLinked).status}
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-foreground/60">Order ID: #{selectedPayment.order}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-foreground/2 flex items-center justify-between">
              <button
                onClick={() => {
                  setNewStatus(selectedPayment.status);
                  setFailureReasonInput(selectedPayment.failureReason || '');
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-semibold text-foreground transition"
              >
                Update Payment Status
              </button>
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white text-xs font-semibold shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPDATE PAYMENT STATUS MODAL                                               */}
      {/* ========================================================================= */}
      {showStatusModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold text-foreground">Update Transaction Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground/70 font-semibold mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                >
                  <option value="SUCCESS">SUCCESS (Mark as Paid & Capture)</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              {newStatus === 'FAILED' && (
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Failure Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Card declined / User cancelled"
                    value={failureReasonInput}
                    onChange={(e) => setFailureReasonInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-foreground/70 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}