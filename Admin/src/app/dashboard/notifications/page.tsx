"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Send,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  LifeBuoy,
  ShoppingCart,
  AlertCircle,
  Megaphone,
  X,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { fetchApi } from '../../../utils/api';
import { getAdminSocket } from '../../../utils/socket';
import styles from './notifications.module.css';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  channels?: string[];
  data?: Record<string, any>;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'TICKETS' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastRole, setBroadcastRole] = useState<'admin' | 'customer' | 'staff' | 'all'>('all');
  const [broadcastType, setBroadcastType] = useState('SYSTEM_ALERT');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastImage, setBroadcastImage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchApi('/notifications?limit=50');
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Socket listener for real-time notifications
  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const handleNewNotif = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchApi(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      // ignore
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    setBroadcastSuccess('');

    try {
      const res = await fetchApi('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          role: broadcastRole === 'all' ? undefined : broadcastRole,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          imageUrl: broadcastImage.trim() || undefined,
        }),
      });

      if (res && res.success) {
        setBroadcastSuccess('Broadcast alert dispatched successfully via FCM, In-App, and Sockets!');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastImage('');
        setTimeout(() => {
          setIsBroadcastOpen(false);
          setBroadcastSuccess('');
          loadNotifications(true);
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // 1. Filter Tab
    if (activeFilter === 'UNREAD' && n.isRead) return false;
    if (activeFilter === 'ORDERS' && !n.type.includes('ORDER')) return false;
    if (activeFilter === 'TICKETS' && !n.type.includes('TICKET')) return false;
    if (activeFilter === 'SYSTEM' && !n.type.includes('SYSTEM')) return false;

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchType = n.type?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchType;
    }

    return true;
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes('ORDER')) return <ShoppingCart size={20} style={{ color: '#10b981' }} />;
    if (type.includes('TICKET')) return <LifeBuoy size={20} style={{ color: '#3b82f6' }} />;
    if (type.includes('SYSTEM')) return <Megaphone size={20} style={{ color: '#f59e0b' }} />;
    return <AlertCircle size={20} style={{ color: 'var(--primary)' }} />;
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section */}
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Notification Center & Broadcasts</h1>
          <p className={styles.subtitle}>
            Real-time push alerts, WebSocket live stream, and multi-channel system broadcasts.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryBtn}
            onClick={() => loadNotifications(true)}
            title="Refresh list"
          >
            <RefreshCw size={14} className={refreshing ? styles.spinning : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {unreadCount > 0 && (
            <button className={styles.secondaryBtn} onClick={handleMarkAllRead}>
              <CheckCheck size={14} />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          <button
            className={styles.broadcastBtn}
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Megaphone size={16} />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${activeFilter === 'ALL' ? styles.activeFilterTab : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All
            <span className={styles.countChip}>{notifications.length}</span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'UNREAD' ? styles.activeFilterTab : ''}`}
            onClick={() => setActiveFilter('UNREAD')}
          >
            Unread
            <span className={styles.countChip}>{unreadCount}</span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'ORDERS' ? styles.activeFilterTab : ''}`}
            onClick={() => setActiveFilter('ORDERS')}
          >
            Orders
            <span className={styles.countChip}>
              {notifications.filter((n) => n.type.includes('ORDER')).length}
            </span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'TICKETS' ? styles.activeFilterTab : ''}`}
            onClick={() => setActiveFilter('TICKETS')}
          >
            Tickets
            <span className={styles.countChip}>
              {notifications.filter((n) => n.type.includes('TICKET')).length}
            </span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'SYSTEM' ? styles.activeFilterTab : ''}`}
            onClick={() => setActiveFilter('SYSTEM')}
          >
            System
            <span className={styles.countChip}>
              {notifications.filter((n) => n.type.includes('SYSTEM')).length}
            </span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} opacity={0.5} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className={styles.listContainer}>
        {loading && notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <RefreshCw size={28} className={styles.spinning} />
            <p>Loading notification feed...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={36} opacity={0.3} />
            <p>No notifications match the selected criteria.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`${styles.notifCard} ${!notif.isRead ? styles.unreadCard : ''}`}
              onClick={() => {
                if (!notif.isRead) handleMarkAsRead(notif._id);
                if (notif.data?.ticketId) router.push('/dashboard/tickets');
                else if (notif.data?.orderId) router.push('/dashboard/orders');
              }}
            >
              <div className={styles.cardIconWrap}>
                {getNotificationIcon(notif.type)}
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardTitleWrap}>
                    <span className={styles.cardTitle}>{notif.title}</span>
                    {!notif.isRead && <span className={styles.unreadPill}>NEW</span>}
                    <span className={styles.typeBadge}>{notif.type}</span>
                  </div>

                  <div className={styles.cardActions}>
                    {!notif.isRead && (
                      <button
                        className={styles.actionIconBtn}
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    <button
                      className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className={styles.cardMessage}>{notif.message}</p>

                <div className={styles.cardMetaRow}>
                  <span>
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {notif.channels && notif.channels.length > 0 && (
                    <span>Channels: {notif.channels.join(', ')}</span>
                  )}
                  {notif.data?.ticketId && (
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      Ticket #{notif.data.ticketNumber || notif.data.ticketId}
                    </span>
                  )}
                  {notif.data?.orderId && (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      Order #{notif.data.orderNumber || notif.data.orderId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Broadcast Modal */}
      {isBroadcastOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsBroadcastOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Broadcast System Announcement</h3>
              <button className={styles.modalClose} onClick={() => setIsBroadcastOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast}>
              <div className={styles.modalBody}>
                {broadcastSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} />
                    <span>{broadcastSuccess}</span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Audience</label>
                  <select
                    className={styles.formSelect}
                    value={broadcastRole}
                    onChange={(e: any) => setBroadcastRole(e.target.value)}
                  >
                    <option value="all">Everyone (All Users & Staff)</option>
                    <option value="customer">Registered Customers Only</option>
                    <option value="staff">Staff / Support Team Only</option>
                    <option value="admin">Administrators Only</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notification Category</label>
                  <select
                    className={styles.formSelect}
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value)}
                  >
                    <option value="SYSTEM_ALERT">System Alert / Maintenance</option>
                    <option value="PROMOTION">Promotional Offer / Announcement</option>
                    <option value="FEATURE_UPDATE">New Feature / Release</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Announcement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled System Maintenance / Monsoon Sale 2026"
                    className={styles.formInput}
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write the message that will be pushed to user devices, in-app notifications, and live websocket streams..."
                    className={styles.formTextarea}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Banner Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/promo-banner.jpg"
                    className={styles.formInput}
                    value={broadcastImage}
                    onChange={(e) => setBroadcastImage(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsBroadcastOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.broadcastBtn}
                  disabled={isBroadcasting}
                >
                  <Send size={15} />
                  <span>{isBroadcasting ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
