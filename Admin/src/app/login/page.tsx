"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { fetchApi, setAuthToken } from '../../utils/api';
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
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle the actual backend response structure: { success, message, data: { tokens: { accessToken } } }
      const token = response.token || response.data?.tokens?.accessToken;

      if (response.success && token) {
        setAuthToken(token);
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed. Invalid token received.');
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Network error or invalid credentials');
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
