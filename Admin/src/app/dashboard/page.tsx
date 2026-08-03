"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Table } from '../../components/Table/Table';
import { fetchApi } from '../../utils/api';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import styles from './dashboard.module.css';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  topProducts: Array<{ productId: string; name: string; sold: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetchApi('/api/analytics/sales');
        if (response.success) {
          setData(response.data);
        } else if (response.message === 'API is running') {
          // Fallback to mock data since the backend route doesn't exist yet
          setData({
            totalSales: 150000.00,
            totalOrders: 120,
            totalCustomers: 85,
            topProducts: [
              { productId: "6a5b49d53c5680409c23ae59", name: "Smartphone X", sold: 45 }
            ]
          });
        } else {
          setError(response.message || 'Failed to load analytics');
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard Overview</h1>
      
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--primary)', backgroundColor: 'rgba(87, 197, 204, 0.15)' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Sales</p>
            <h3 className={styles.statValue}>${data.totalSales.toLocaleString()}</h3>
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
            <p className={styles.statLabel}>Total Customers</p>
            <h3 className={styles.statValue}>{data.totalCustomers}</h3>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <TrendingUp className={styles.sectionIcon} size={20} />
          <h2>Top Selling Products</h2>
        </div>
        <Card>
          <Table headers={['Product Name', 'Units Sold', 'Product ID']}>
            {data.topProducts.map((product) => (
              <tr key={product.productId}>
                <td style={{ fontWeight: 500 }}>{product.name}</td>
                <td>{product.sold}</td>
                <td style={{ color: 'var(--border)' }}>{product.productId}</td>
              </tr>
            ))}
            {data.topProducts.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No product data available</td>
              </tr>
            )}
          </Table>
        </Card>
      </div>
    </div>
  );
}
