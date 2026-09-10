"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { clearAuthToken } from '../../utils/api';
import styles from './Header.module.css';

export const Header = () => {
  const router = useRouter();
  const [userName, setUserName] = React.useState('Admin');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adminUser');
        if (stored) {
          const user = JSON.parse(stored);
          const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          if (name) setUserName(name);
        }
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminUser');
    }
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.spacer}></div>
      <div className={styles.actions}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <span className={styles.name}>{userName}</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
