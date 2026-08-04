"use client";

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import styles from './dashboard.module.css';

interface DashboardMetric {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  totalCategories: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; unitsSold: number; revenue: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; totalAmount: number; status: string; createdAt: string }>;
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  reviewsSummary: { totalReviews: number; averageRating: number; approvedReviews: number };
  recentReviews: Array<{ id: string; rating: number; title?: string; comment?: string; userName: string; productName: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetchApi('/admin/dashboard');
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        setError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div>
          <p className={styles.eyebrow}>Admin Insights</p>
          <h1 className={styles.title}>Store performance at a glance</h1>
        </div>
        <div className={styles.headerBadge}>Live from your database</div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--primary)', backgroundColor: 'rgba(87, 197, 204, 0.15)' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Sales</p>
            <h3 className={styles.statValue}>{formatCurrency(data.totalSales)}</h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--secondary)', backgroundColor: 'rgba(65, 182, 77, 0.15)' }}>
            <ShoppingBag size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Orders</p>
            <h3 className={styles.statValue}>{data.totalOrders}</h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Customers</p>
            <h3 className={styles.statValue}>{data.totalCustomers}</h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
            <Package size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Products</p>
            <h3 className={styles.statValue}>{data.totalProducts}</h3>
          </div>
        </Card>
      </div>

      <div className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryTitleRow}>
            <BadgeCheck size={18} />
            <span>Completed Orders</span>
          </div>
          <strong>{data.completedOrders}</strong>
          <small>{data.pendingOrders} pending</small>
        </Card>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryTitleRow}>
            <TrendingUp size={18} />
            <span>Average Order Value</span>
          </div>
          <strong>{formatCurrency(data.averageOrderValue)}</strong>
          <small>Based on successful paid orders</small>
        </Card>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryTitleRow}>
            <MessageSquareQuote size={18} />
            <span>Reviews</span>
          </div>
          <strong>{data.reviewsSummary.totalReviews}</strong>
          <small>{data.reviewsSummary.averageRating.toFixed(1)} avg rating</small>
        </Card>
      </div>

      <div className={styles.gridTwoCols}>
        <Card className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <TrendingUp className={styles.sectionIcon} size={20} />
            <h2>Sales trend</h2>
          </div>
          <div className={styles.chartList}>
            {data.salesTrend.map((item) => (
              <div key={item.date} className={styles.chartRow}>
                <span>{item.date}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${Math.min(100, (item.revenue / Math.max(...data.salesTrend.map((entry) => entry.revenue), 1)) * 100)}%` }} />
                </div>
                <strong>{formatCurrency(item.revenue)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <ShoppingBag className={styles.sectionIcon} size={20} />
            <h2>Top ordered products</h2>
          </div>
          <Table headers={['Product', 'Units', 'Revenue']}>
            {data.topProducts.map((product) => (
              <tr key={product.productId}>
                <td style={{ fontWeight: 600 }}>{product.name}</td>
                <td>{product.unitsSold}</td>
                <td>{formatCurrency(product.revenue)}</td>
              </tr>
            ))}
            {data.topProducts.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No sales data yet</td>
              </tr>
            )}
          </Table>
        </Card>
      </div>

      <div className={styles.gridTwoCols}>
        <Card className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <ArrowUpRight className={styles.sectionIcon} size={20} />
            <h2>Recent orders</h2>
          </div>
          <Table headers={['Order', 'Customer', 'Amount', 'Status']}>
            {data.recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>{order.customerName}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <MessageSquareQuote className={styles.sectionIcon} size={20} />
            <h2>Recent reviews</h2>
          </div>
          <Table headers={['Customer', 'Product', 'Rating']}>
            {data.recentReviews.map((review) => (
              <tr key={review.id}>
                <td>{review.userName}</td>
                <td>{review.productName}</td>
                <td>{'★'.repeat(review.rating)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
