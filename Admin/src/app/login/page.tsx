"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { fetchApi, setAuthToken, clearAuthToken } from '../../utils/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchApi('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle the backend response structure: { success, message, data: { user, tokens: { accessToken } } }
      const token = response.token || response.data?.tokens?.accessToken;
      const user = response.data?.user || response.user;
      const role = (user?.role || '').toLowerCase();
      const adminRoles = ['admin', 'super_admin', 'manager'];

      if (response.success && token) {
        if (!adminRoles.includes(role)) {
          clearAuthToken();
          setError('Access denied: Only administrators can sign in to this portal.');
          return;
        }

        setAuthToken(token);
        if (typeof window !== 'undefined' && user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        }
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed. Invalid token received.');
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Network error or invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>Mfolks Admin</div>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <Input 
            label="Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required 
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className={styles.footer}>
          <a href="/register">Need an admin account? Register</a>
        </div>
      </Card>
    </div>
  );
}
