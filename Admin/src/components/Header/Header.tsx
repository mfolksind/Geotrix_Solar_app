"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  User,
  Bell,
  CheckCheck,
  ExternalLink,
  LifeBuoy,
  ShoppingCart,
  AlertCircle,
  X,
  Radio,
} from 'lucide-react';
import { clearAuthToken, fetchApi } from '../../utils/api';
import { getAdminSocket } from '../../utils/socket';
import styles from './Header.module.css';

interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'ticket' | 'system' | 'info';
  link?: string;
}

export const Header = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('Admin');
  const [userRole, setUserRole] = useState('admin');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Load User Profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adminUser');
        if (stored) {
          const user = JSON.parse(stored);
          const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          if (name) setUserName(name);
          if (user.role) setUserRole(user.role);
        }
      } catch (err) {
        // ignore
      }
    }
  }, []);

  // 2. Fetch Initial Notifications
  const loadNotifications = async () => {
    try {
      const res = await fetchApi('/notifications?limit=10');
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // 3. Socket.IO Real-time Listeners
  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    if (socket.connected) setSocketConnected(true);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Live In-App Notification Dispatch
    const handleNewNotification = (notif: AdminNotification) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);

      // Add floating toast
      const toastId = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [
        {
          id: toastId,
          title: notif.title || 'New Notification',
          message: notif.message,
          type: notif.type.includes('ORDER') ? 'order' : notif.type.includes('TICKET') ? 'ticket' : 'system',
          link: notif.data?.ticketId ? '/dashboard/tickets' : notif.data?.orderId ? '/dashboard/orders' : undefined,
        },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    };

    // Live Order Created Broadcast
    const handleNewOrder = (order: any) => {
      const toastId = `order-${order._id || Date.now()}`;
      setToasts((prev) => [
        {
          id: toastId,
          title: '🛍️ New Order Placed!',
          message: `Order #${order.orderNumber || 'New'} received (${order.customerName || 'Customer'})`,
          type: 'order',
          link: '/dashboard/orders',
        },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    };

    // Live Support Ticket Created Broadcast
    const handleNewTicket = (ticket: any) => {
      const toastId = `ticket-${ticket._id || Date.now()}`;
      setToasts((prev) => [
        {
          id: toastId,
          title: '🎫 New Support Ticket',
          message: `Ticket #${ticket.ticketNumber || 'New'}: ${ticket.subject || 'Help required'}`,
          type: 'ticket',
          link: '/dashboard/tickets',
        },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('order:new', handleNewOrder);
    socket.on('ticket:created', handleNewTicket);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', handleNewNotification);
      socket.off('order:new', handleNewOrder);
      socket.off('ticket:created', handleNewTicket);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminUser');
    }
    router.push('/login');
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('ORDER')) return <ShoppingCart size={16} className={styles.iconOrder} />;
    if (type.includes('TICKET')) return <LifeBuoy size={16} className={styles.iconTicket} />;
    return <AlertCircle size={16} className={styles.iconSystem} />;
  };

  return (
    <>
      <header className={styles.header}>
        {/* Live Socket Status Indicator */}
        <div className={styles.socketIndicator} title={socketConnected ? 'Live Real-time Socket Connected' : 'Connecting to Real-time Stream...'}>
          <Radio size={14} className={socketConnected ? styles.socketActive : styles.socketInactive} />
          <span className={styles.socketText}>{socketConnected ? 'Live Network' : 'Reconnecting...'}</span>
        </div>

        <div className={styles.spacer}></div>

        <div className={styles.actions}>
          {/* Notification Bell Dropdown */}
          <div className={styles.notifContainer} ref={dropdownRef}>
            <button
              className={`${styles.iconBtn} ${unreadCount > 0 ? styles.hasUnread : ''}`}
              onClick={() => setIsOpen(!isOpen)}
              title="Notifications"
              aria-label="Open notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div>
                    <h4 className={styles.dropdownTitle}>Live Notifications</h4>
                    <p className={styles.dropdownSubtitle}>
                      {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className={styles.markAllBtn}
                      onClick={handleMarkAllRead}
                      title="Mark all notifications as read"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyNotifs}>
                      <Bell size={28} opacity={0.3} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`${styles.notifItem} ${!n.isRead ? styles.unreadItem : ''}`}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n._id);
                          if (n.data?.ticketId) router.push('/dashboard/tickets');
                          else if (n.data?.orderId) router.push('/dashboard/orders');
                          setIsOpen(false);
                        }}
                      >
                        <div className={styles.notifIconWrap}>
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className={styles.notifBody}>
                          <div className={styles.notifRow}>
                            <span className={styles.notifTitle}>{n.title}</span>
                            {!n.isRead && <span className={styles.unreadDot} />}
                          </div>
                          <p className={styles.notifMessage}>{n.message}</p>
                          <span className={styles.notifTime}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.dropdownFooter}>
                  <Link
                    href="/dashboard/notifications"
                    className={styles.viewAllBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Notification Center & Broadcasts</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className={styles.profile}>
            <div className={styles.avatar}>
              <User size={18} />
            </div>
            <div className={styles.profileText}>
              <span className={styles.name}>{userName}</span>
              <span className={styles.roleBadge}>{userRole.toUpperCase()}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Floating Live Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[`toast_${toast.type}`] || ''}`}
            onClick={() => {
              if (toast.link) router.push(toast.link);
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
          >
            <div className={styles.toastHeader}>
              <span className={styles.toastTitle}>{toast.title}</span>
              <button
                className={styles.toastClose}
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
              >
                <X size={13} />
              </button>
            </div>
            <p className={styles.toastMessage}>{toast.message}</p>
          </div>
        ))}
      </div>
    </>
  );
};
