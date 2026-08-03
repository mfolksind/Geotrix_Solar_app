"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { clearAuthToken } from '../../utils/api';
import styles from './Header.module.css';

export const Header = () => {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthToken();
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
          <span className={styles.name}>Admin User</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
