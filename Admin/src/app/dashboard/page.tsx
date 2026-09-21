"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '../../components/Card/Card';
import { Table } from '../../components/Table/Table';
import { fetchApi } from '../../utils/api';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  MessageSquareQuote,
  BadgeCheck,
  ArrowUpRight,
  AlertTriangle,
  LifeBuoy,
  RefreshCw,
  Layers,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  FolderTree,
} from 'lucide-react';
import styles from './dashboard.module.css';

interface DashboardData {
  selectedRange: string;
  overview: {
    totalSales: number;
    periodSales: number;
    periodTax: number;
    allTimeTax: number;
    revenueGrowth: number;
    totalOrders: number;
    periodOrders: number;
    paidOrders: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    newCustomers: number;
    totalUsers: number;
    totalProducts: number;
    totalVariants: number;
    totalFamilies: number;
    totalCategories: number;
    averageOrderValue: number;
    fulfillmentRate: number;
  };
  actionItems: {
    pendingOrders: number;
    openTickets: number;
    newLeads: number;
    pendingReviews: number;
    lowStockItems: number;
  };
  salesTrend: Array<{
    date: string;
    revenue: number;
    tax: number;
    orders: number;
    paidOrders: number;
  }>;
  orderStatusBreakdown: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    totalValue: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
    ordersCount: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  familyBreakdown: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  reviewsSummary: {
    totalReviews: number;
    averageRating: number;
    approvedReviews: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }>;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    priority: string;
    status: string;
    userName: string;
    createdAt: string;
  }>;
  recentLeads: Array<{
    id: string;
    fullName: string;
    propertyType: string;
    city: string;
    whatsappNumber: string;
    monthlyBill: string;
    status: string;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    isApproved: boolean;
    userName: string;
    productName: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: string } | null>(null);
  const [activeActivityTab, setActiveActivityTab] = useState<'leads' | 'tickets' | 'reviews'>('leads');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const loadDashboard = useCallback(async (selectedRange: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetchApi(`/admin/dashboard?range=${selectedRange}`);
      if (response.success && response.data) {
        setData(response.data);
        setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setError(response.message || 'Failed to load dashboard metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to analytics server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(range);
  }, [range, loadDashboard]);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !data) {
    return (
      <div className={styles.loading}>
        <RefreshCw className={styles.spinning} size={32} />
        <p>Loading real-time command center...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.error}>
        <span>{error}</span>
        <button className={styles.refreshBtn} onClick={() => loadDashboard(range, true)}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalSalesAll = data.overview.totalSales || 1;
  const maxTrendValue = Math.max(
    ...data.salesTrend.map((t) => (chartMetric === 'revenue' ? t.revenue : t.orders)),
    1
  );

  return (
    <div className={styles.container}>
      {/* 1. Executive Header & Range Filter Controls */}
      <div className={styles.headerSection}>
        <div>
          <p className={styles.eyebrow}>
            <Sparkles size={14} /> Executive Command Center
          </p>
          <h1 className={styles.title}>Store Performance & Operations</h1>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.rangePills}>
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((r) => (
              <button
                key={r}
                className={`${styles.rangeBtn} ${range === r ? styles.activeRange : ''}`}
                onClick={() => setRange(r)}
              >
                {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '1y' ? '1Y' : 'ALL'}
              </button>
            ))}
          </div>

          <button
            className={styles.refreshBtn}
            onClick={() => loadDashboard(range, true)}
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={refreshing ? styles.spinning : ''} />
            <span>{refreshing ? 'Updating...' : lastRefreshedAt ? `Updated ${lastRefreshedAt}` : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Action Required Banner Grid */}
      <div className={styles.actionBannerGrid}>
        <Link href="/dashboard/orders" className={`${styles.actionCard} ${data.actionItems.pendingOrders > 0 ? styles.warning : styles.success}`}>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>Pending Orders</span>
            <span className={styles.actionNumber}>{data.actionItems.pendingOrders}</span>
          </div>
          <div className={styles.actionIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
        </Link>

        <Link href="/dashboard/tickets" className={`${styles.actionCard} ${data.actionItems.openTickets > 0 ? styles.danger : styles.success}`}>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>Open Support Tickets</span>
            <span className={styles.actionNumber}>{data.actionItems.openTickets}</span>
          </div>
          <div className={styles.actionIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <LifeBuoy size={20} />
          </div>
        </Link>

        <Link href="/dashboard/queries" className={`${styles.actionCard} ${data.actionItems.newLeads > 0 ? styles.info : styles.success}`}>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>New Inquiries / Leads</span>
            <span className={styles.actionNumber}>{data.actionItems.newLeads}</span>
          </div>
          <div className={styles.actionIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <MessageSquareQuote size={20} />
          </div>
        </Link>

        <Link href="/dashboard/reviews" className={`${styles.actionCard} ${data.actionItems.pendingReviews > 0 ? styles.primary : styles.success}`}>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>Pending Reviews</span>
            <span className={styles.actionNumber}>{data.actionItems.pendingReviews}</span>
          </div>
          <div className={styles.actionIcon} style={{ background: 'rgba(87, 197, 204, 0.12)', color: 'var(--primary)' }}>
            <BadgeCheck size={20} />
          </div>
        </Link>

        <Link href="/dashboard/products" className={`${styles.actionCard} ${data.actionItems.lowStockItems > 0 ? styles.warning : styles.success}`}>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>Low Stock Items</span>
            <span className={styles.actionNumber}>{data.actionItems.lowStockItems}</span>
          </div>
          <div className={styles.actionIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <AlertTriangle size={20} />
          </div>
        </Link>
      </div>

      {/* 3. Hero KPI Metrics Grid */}
      <div className={styles.statsGrid}>
        {/* Total Gross Revenue */}
        <div className={styles.heroStatCard}>
          <div className={styles.heroStatTop}>
            <div className={styles.heroStatIconWrapper} style={{ background: 'rgba(87, 197, 204, 0.15)', color: 'var(--primary)' }}>
              <DollarSign size={24} />
            </div>
            {data.overview.revenueGrowth !== 0 && (
              <span className={`${styles.growthBadge} ${data.overview.revenueGrowth > 0 ? styles.positive : styles.negative}`}>
                {data.overview.revenueGrowth > 0 ? `+${data.overview.revenueGrowth}%` : `${data.overview.revenueGrowth}%`}
              </span>
            )}
          </div>
          <div className={styles.heroStatValueWrapper}>
            <p className={styles.heroStatLabel}>Total Gross Revenue</p>
            <h2 className={styles.heroStatValue}>{formatINR(data.overview.totalSales)}</h2>
            <p className={styles.heroStatSubtext}>
              <span>Period: {formatINR(data.overview.periodSales)}</span>
              <span>•</span>
              <span>GST 18%: {formatINR(data.overview.allTimeTax)}</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className={styles.heroStatCard}>
          <div className={styles.heroStatTop}>
            <div className={styles.heroStatIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <ShoppingBag size={24} />
            </div>
            <span className={`${styles.growthBadge} ${styles.positive}`}>
              {data.overview.fulfillmentRate}% Fulfilled
            </span>
          </div>
          <div className={styles.heroStatValueWrapper}>
            <p className={styles.heroStatLabel}>Total Orders</p>
            <h2 className={styles.heroStatValue}>{data.overview.totalOrders}</h2>
            <p className={styles.heroStatSubtext}>
              <span>{data.overview.deliveredOrders} Completed</span>
              <span>•</span>
              <span>{data.overview.paidOrders} Paid</span>
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className={styles.heroStatCard}>
          <div className={styles.heroStatTop}>
            <div className={styles.heroStatIconWrapper} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Users size={24} />
            </div>
            <span className={`${styles.growthBadge} ${styles.neutral}`}>
              +{data.overview.newCustomers} in {range.toUpperCase()}
            </span>
          </div>
          <div className={styles.heroStatValueWrapper}>
            <p className={styles.heroStatLabel}>Registered Customers</p>
            <h2 className={styles.heroStatValue}>{data.overview.totalCustomers}</h2>
            <p className={styles.heroStatSubtext}>
              <span>{data.overview.totalUsers} Total Accounts</span>
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className={styles.heroStatCard}>
          <div className={styles.heroStatTop}>
            <div className={styles.heroStatIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <TrendingUp size={24} />
            </div>
            <span className={`${styles.growthBadge} ${styles.neutral}`}>
              Avg Basket
            </span>
          </div>
          <div className={styles.heroStatValueWrapper}>
            <p className={styles.heroStatLabel}>Average Order Value</p>
            <h2 className={styles.heroStatValue}>{formatINR(data.overview.averageOrderValue)}</h2>
            <p className={styles.heroStatSubtext}>
              <span>Per paid transaction</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Secondary Catalog & Operational Summary */}
      <div className={styles.secondarySummaryGrid}>
        <div className={styles.miniSummaryCard}>
          <div className={styles.miniIcon}>
            <Package size={20} />
          </div>
          <div className={styles.miniContent}>
            <span className={styles.miniTitle}>Products & Variants</span>
            <span className={styles.miniValue}>{data.overview.totalProducts} / {data.overview.totalVariants}</span>
            <span className={styles.miniNote}>Active catalog items</span>
          </div>
        </div>

        <div className={styles.miniSummaryCard}>
          <div className={styles.miniIcon}>
            <Users size={20} />
          </div>
          <div className={styles.miniContent}>
            <span className={styles.miniTitle}>Brand Families</span>
            <span className={styles.miniValue}>{data.overview.totalFamilies}</span>
            <span className={styles.miniNote}>E.g. Stonex, UniStrong</span>
          </div>
        </div>

        <div className={styles.miniSummaryCard}>
          <div className={styles.miniIcon}>
            <FolderTree size={20} />
          </div>
          <div className={styles.miniContent}>
            <span className={styles.miniTitle}>Categories</span>
            <span className={styles.miniValue}>{data.overview.totalCategories}</span>
            <span className={styles.miniNote}>GNSS, Total Stations, etc.</span>
          </div>
        </div>

        <div className={styles.miniSummaryCard}>
          <div className={styles.miniIcon}>
            <MessageSquareQuote size={20} />
          </div>
          <div className={styles.miniContent}>
            <span className={styles.miniTitle}>Verified Reviews</span>
            <span className={styles.miniValue}>★ {data.reviewsSummary.averageRating} ({data.reviewsSummary.totalReviews})</span>
            <span className={styles.miniNote}>{data.reviewsSummary.approvedReviews} published</span>
          </div>
        </div>
      </div>

      {/* 5. Chart & Market Share Analytics */}
      <div className={styles.chartGridSection}>
        {/* Interactive Trend Chart */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
              <h2>{chartMetric === 'revenue' ? 'Sales Revenue Trend' : 'Order Volume Trend'}</h2>
            </div>
            <div className={styles.chartToggleGroup}>
              <button
                className={`${styles.chartToggleBtn} ${chartMetric === 'revenue' ? styles.active : ''}`}
                onClick={() => setChartMetric('revenue')}
              >
                Revenue (₹)
              </button>
              <button
                className={`${styles.chartToggleBtn} ${chartMetric === 'orders' ? styles.active : ''}`}
                onClick={() => setChartMetric('orders')}
              >
                Orders Count
              </button>
            </div>
          </div>

          <div className={styles.svgChartContainer}>
            {hoveredPoint && (
              <div className={styles.chartTooltip}>
                {hoveredPoint.label}: {hoveredPoint.value}
              </div>
            )}

            {data.salesTrend.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
                No trend data recorded for selected period
              </div>
            ) : (
              <svg className={styles.svgChart} viewBox={`0 0 ${Math.max(data.salesTrend.length * 50, 400)} 200`}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#57c5cc" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#57c5cc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="40" x2="100%" y2="40" stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
                <line x1="0" y1="100" x2="100%" y2="100%" stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
                <line x1="0" y1="160" x2="100%" y2="160" stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />

                {/* Area & Bar visualization */}
                {data.salesTrend.map((item, idx) => {
                  const val = chartMetric === 'revenue' ? item.revenue : item.orders;
                  const height = Math.max(8, (val / maxTrendValue) * 140);
                  const x = 30 + idx * (340 / Math.max(data.salesTrend.length - 1, 1));
                  const y = 170 - height;

                  return (
                    <g
                      key={item.date}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          label: item.date,
                          value: chartMetric === 'revenue' ? formatINR(item.revenue) : `${item.orders} orders (${item.paidOrders} paid)`,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={x - 12}
                        y={y}
                        width="24"
                        height={height}
                        rx="5"
                        fill="url(#chartGradient)"
                        stroke="#57c5cc"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y="190"
                        fontSize="10"
                        fill="var(--foreground)"
                        opacity="0.6"
                        textAnchor="middle"
                      >
                        {item.date.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </Card>

        {/* Brand Family & Category Breakdown */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <Layers size={20} style={{ color: 'var(--primary)' }} />
              <h2>Market Share Breakdown</h2>
            </div>
          </div>

          <div className={styles.breakdownList}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                By Brand Family
              </p>
              {data.familyBreakdown.length === 0 ? (
                <p style={{ fontSize: '0.82rem', opacity: 0.6 }}>No family sales recorded</p>
              ) : (
                data.familyBreakdown.map((fam, idx) => {
                  const pct = totalSalesAll > 0 ? Math.min(100, Math.round((fam.revenue / totalSalesAll) * 100)) : 0;
                  const colors = ['#57c5cc', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
                  return (
                    <div key={fam.name} className={styles.breakdownItem}>
                      <div className={styles.breakdownLabelRow}>
                        <span>{fam.name}</span>
                        <span>{formatINR(fam.revenue)} ({pct}%)</span>
                      </div>
                      <div className={styles.breakdownTrack}>
                        <div
                          className={styles.breakdownFill}
                          style={{
                            width: `${pct}%`,
                            background: colors[idx % colors.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                By Product Category
              </p>
              {data.categoryBreakdown.length === 0 ? (
                <p style={{ fontSize: '0.82rem', opacity: 0.6 }}>No category sales recorded</p>
              ) : (
                data.categoryBreakdown.map((cat, idx) => {
                  const pct = totalSalesAll > 0 ? Math.min(100, Math.round((cat.revenue / totalSalesAll) * 100)) : 0;
                  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#57c5cc'];
                  return (
                    <div key={cat.name} className={styles.breakdownItem}>
                      <div className={styles.breakdownLabelRow}>
                        <span>{cat.name}</span>
                        <span>{formatINR(cat.revenue)} ({pct}%)</span>
                      </div>
                      <div className={styles.breakdownTrack}>
                        <div
                          className={styles.breakdownFill}
                          style={{
                            width: `${pct}%`,
                            background: colors[idx % colors.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 6. Top Products & Order Lifecycle Status */}
      <div className={styles.twoColGrid}>
        {/* Top Ordered Products */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <Package size={20} style={{ color: 'var(--primary)' }} />
              <h2>Top Performing Products</h2>
            </div>
            <Link href="/dashboard/products" className={styles.viewAllLink}>
              Catalog <ArrowRight size={14} />
            </Link>
          </div>

          <Table headers={['Rank', 'Product Name', 'Units Sold', 'Total Revenue']}>
            {data.topProducts.map((p, index) => (
              <tr key={p.productId || p.name}>
                <td>
                  <span
                    className={`${styles.rankBadge} ${
                      index === 0 ? styles.gold : index === 1 ? styles.silver : index === 2 ? styles.bronze : ''
                    }`}
                  >
                    #{index + 1}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.unitsSold} units</td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatINR(p.revenue)}</td>
              </tr>
            ))}
            {data.topProducts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                  No product sales registered yet
                </td>
              </tr>
            )}
          </Table>
        </Card>

        {/* Order Status & Payment Method Breakdown */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <CreditCard size={20} style={{ color: 'var(--primary)' }} />
              <h2>Order Status & Payment Split</h2>
            </div>
            <Link href="/dashboard/payments" className={styles.viewAllLink}>
              Ledger <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Fulfillment Pipeline
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.orderStatusBreakdown.map((statusItem) => (
                  <div
                    key={statusItem.status}
                    style={{
                      background: 'rgba(148, 163, 184, 0.08)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: '1 1 120px',
                    }}
                  >
                    <span className={`${styles.statusChip} ${styles[statusItem.status.toLowerCase()] || ''}`}>
                      {statusItem.status}
                    </span>
                    <strong style={{ marginLeft: 'auto', fontSize: '1rem' }}>{statusItem.count}</strong>
                  </div>
                ))}
                {data.orderStatusBreakdown.length === 0 && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>No order records found</span>
                )}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Payment Methods
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.paymentMethodBreakdown.map((pm) => (
                  <div
                    key={pm.method}
                    style={{
                      background: 'rgba(148, 163, 184, 0.08)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: '1 1 140px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{pm.method}</span>
                    <strong style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>
                      {formatINR(pm.totalValue)}
                    </strong>
                  </div>
                ))}
                {data.paymentMethodBreakdown.length === 0 && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>No payment breakdown data</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 7. Live Activity Dual Panels (Recent Orders & Interactive Communications Feed) */}
      <div className={styles.twoColGrid}>
        {/* Recent Orders Live Table */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <ArrowUpRight size={20} style={{ color: 'var(--primary)' }} />
              <h2>Recent Customer Orders</h2>
            </div>
            <Link href="/dashboard/orders" className={styles.viewAllLink}>
              All Orders <ArrowRight size={14} />
            </Link>
          </div>

          <Table headers={['Order #', 'Customer', 'Amount (Inc. GST)', 'Status']}>
            {data.recentOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/dashboard/orders`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                    {order.orderNumber}
                  </Link>
                  <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{formatDate(order.createdAt)}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  {order.customerEmail && <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{order.customerEmail}</div>}
                </td>
                <td style={{ fontWeight: 700 }}>
                  {formatINR(order.totalAmount)}
                </td>
                <td>
                  <span className={`${styles.statusChip} ${styles[order.status.toLowerCase()] || ''}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                  No recent orders available
                </td>
              </tr>
            )}
          </Table>
        </Card>

        {/* Live Interaction Feed (Leads / Support / Reviews) */}
        <Card className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.tabNav} style={{ width: '100%', marginBottom: 0 }}>
              <button
                className={`${styles.tabItem} ${activeActivityTab === 'leads' ? styles.activeTab : ''}`}
                onClick={() => setActiveActivityTab('leads')}
              >
                Inquiries & Leads ({data.recentLeads.length})
              </button>
              <button
                className={`${styles.tabItem} ${activeActivityTab === 'tickets' ? styles.activeTab : ''}`}
                onClick={() => setActiveActivityTab('tickets')}
              >
                Support Tickets ({data.recentTickets.length})
              </button>
              <button
                className={`${styles.tabItem} ${activeActivityTab === 'reviews' ? styles.activeTab : ''}`}
                onClick={() => setActiveActivityTab('reviews')}
              >
                Reviews ({data.recentReviews.length})
              </button>
            </div>
          </div>

          {activeActivityTab === 'leads' && (
            <Table headers={['Contact / Location', 'Property / Bill', 'Status', 'Date']}>
              {data.recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{lead.fullName}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>{lead.city} • {lead.whatsappNumber}</div>
                  </td>
                  <td>
                    <div>{lead.propertyType}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>Bill: {lead.monthlyBill}</div>
                  </td>
                  <td>
                    <span className={`${styles.statusChip} ${styles[lead.status.toLowerCase()] || ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {formatDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
              {data.recentLeads.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                    No recent consultation inquiries
                  </td>
                </tr>
              )}
            </Table>
          )}

          {activeActivityTab === 'tickets' && (
            <Table headers={['Ticket #', 'Subject / User', 'Priority', 'Status']}>
              {data.recentTickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    <Link href="/dashboard/tickets" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.subject}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>{t.userName}</div>
                  </td>
                  <td>
                    <span className={`${styles.statusChip} ${styles[t.priority.toLowerCase()] || ''}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusChip} ${styles[t.status.toLowerCase()] || ''}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.recentTickets.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                    No recent support tickets
                  </td>
                </tr>
              )}
            </Table>
          )}

          {activeActivityTab === 'reviews' && (
            <Table headers={['Customer', 'Product', 'Rating', 'Moderation']}>
              {data.recentReviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.userName}</div>
                    {r.comment && <div style={{ fontSize: '0.72rem', opacity: 0.6, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</div>}
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.productName}</td>
                  <td style={{ color: '#f59e0b', fontWeight: 700 }}>
                    {'★'.repeat(r.rating)}
                  </td>
                  <td>
                    <span className={`${styles.statusChip} ${r.isApproved ? styles.resolved : styles.pending}`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.recentReviews.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                    No product reviews posted yet
                  </td>
                </tr>
              )}
            </Table>
          )}
        </Card>
      </div>

      {/* 8. Admin Quick Action Shortcuts */}
      <Card className={styles.panelCard} style={{ padding: '1.2rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.8rem', textTransform: 'uppercase' }}>
          Quick Action Shortcuts
        </p>
        <div className={styles.quickActionsGrid}>
          <Link href="/dashboard/products" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <Package size={18} />
            </div>
            <span>Manage Catalog</span>
          </Link>

          <Link href="/dashboard/orders" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <ShoppingBag size={18} />
            </div>
            <span>Process Orders</span>
          </Link>

          <Link href="/dashboard/payments" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <CreditCard size={18} />
            </div>
            <span>Payment Ledger</span>
          </Link>

          <Link href="/dashboard/tickets" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <LifeBuoy size={18} />
            </div>
            <span>Support Desk</span>
          </Link>

          <Link href="/dashboard/queries" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <MessageSquareQuote size={18} />
            </div>
            <span>Review Leads</span>
          </Link>

          <Link href="/dashboard/users" className={styles.quickActionBtn}>
            <div className={styles.quickActionIcon}>
              <Users size={18} />
            </div>
            <span>Customer CRM</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
