"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tags, Settings, Users, ShoppingCart, MapPin, MessageSquare, IndianRupee } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/families', label: 'Families', icon: Users },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
  { href: '/dashboard/queries', label: 'Queries', icon: MessageSquare },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Settings },
  { href: '/dashboard/tickets', label: 'Support Tickets', icon: Package },
  { href: '/dashboard/payments', label: 'Payments', icon: IndianRupee },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <span className={styles.logo}>Mfolks Admin</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <item.icon className={styles.icon} size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
