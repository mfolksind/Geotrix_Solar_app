"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { fetchApi } from '../../utils/api';
import styles from '../login/login.module.css'; // Reusing login styles for consistency

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchApi('/auth/register_admin', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone, adminKey }),
      });

      if (data.success) {
        router.push('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Network error or invalid data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.loginCard} style={{ maxWidth: '500px' }}>
        <div className={styles.header}>
          <div className={styles.logo}>Mfolks Admin</div>
          <p className={styles.subtitle}>Register a new admin account</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleRegister} className={styles.form}>
          <Input 
            label="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Admin Name"
            required 
          />
          <Input 
            label="Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required 
          />
          <Input 
            label="Phone" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="1234567890"
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
          <Input 
            label="Admin Key" 
            type="password" 
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Secret Key"
            required 
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className={styles.footer}>
          <a href="/login">Already have an account? Login</a>
        </div>
      </Card>
    </div>
  );
}
