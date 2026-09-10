"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Header } from '../../components/Header/Header';
import { getAuthToken, clearAuthToken, fetchApi } from '../../utils/api';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        clearAuthToken();
        router.replace('/login');
        return;
      }

      try {
        const response = await fetchApi('/api/users/me');
        const user = response?.data?.user || response?.data || response?.user;
        const role = (user?.role || '').toLowerCase();
        const adminRoles = ['admin', 'super_admin', 'manager'];

        if (response?.success && adminRoles.includes(role)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminUser', JSON.stringify(user));
          }
          setAuthorized(true);
        } else {
          // Token is valid but user role is customer/user
          clearAuthToken();
          router.replace('/login?error=unauthorized');
        }
      } catch (err) {
        clearAuthToken();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--background)',
        gap: '1rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
          Verifying administrator authorization...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
