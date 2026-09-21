"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Search,
  X,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Shield,
  Phone,
  Mail,
  ShoppingCart,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  Building2,
  Copy,
  Check
} from 'lucide-react';

interface FamilyInfo {
  _id: string;
  name: string;
  slug?: string;
  requiresAdminApproval?: boolean;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  familyApprovalStatus?: string;
  family?: FamilyInfo | string;
  approvedFamilies?: any[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingApproval: number;
  blockedUsers: number;
  adminUsers: number;
  customerUsers: number;
}

interface CartItemData {
  _id: string;
  product?: {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    price?: number;
    status?: string;
  };
  variant?: {
    _id: string;
    title: string;
    sku: string;
    price: number;
    discountPrice?: number;
    images?: string[];
    stock?: number;
    status?: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface AddressData {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: string;
  isDefault: boolean;
  createdAt: string;
}

interface UserDetailsData {
  user: UserItem;
  addresses: AddressData[];
  cart: {
    summary: {
      _id?: string;
      totalItems?: number;
      totalQuantity?: number;
      totalAmount?: number;
      discountAmount?: number;
      couponCode?: string;
    } | null;
    items: CartItemData[];
  };
  orders: {
    total: number;
    recent: any[];
  };
}

export default function UsersManagementPage() {
  // Stats
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingApproval: 0,
    blockedUsers: 0,
    adminUsers: 0,
    customerUsers: 0,
  });

  // Users list
  const [users, setUsers] = useState<UserItem[]>([]);
  const [families, setFamilies] = useState<FamilyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [familyFilter, setFamilyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active selections
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'cart' | 'addresses' | 'profile'>('cart');
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active',
    family: '',
    familyApprovalStatus: 'approved',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active',
    family: '',
    familyApprovalStatus: 'approved',
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchApi('/admin/users/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load user stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load families for dropdown
  const loadFamilies = async () => {
    try {
      const res = await fetchApi('/api/families?limit=100');
      if (res.success && res.data) {
        const famList = Array.isArray(res.data) ? res.data : res.data.items || [];
        setFamilies(famList);
      }
    } catch (err) {
      console.error('Failed to load families', err);
    }
  };

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (approvalFilter !== 'ALL') params.append('familyApprovalStatus', approvalFilter);
      if (familyFilter !== 'ALL') params.append('family', familyFilter);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/admin/users?${params.toString()}`);
      if (res.success) {
        if (res.data && res.data.items) {
          setUsers(res.data.items);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.items.length);
        } else if (Array.isArray(res.data)) {
          setUsers(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadFamilies();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, approvalFilter, familyFilter, sortBy, page, limit]);

  // Open User Details Modal & fetch active cart, addresses, orders
  const openUserDetails = async (user: UserItem) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setDetailsTab('cart');
    try {
      const res = await fetchApi(`/admin/users/${user._id}`);
      if (res.success && res.data) {
        setUserDetails(res.data);
      } else {
        setUserDetails(null);
      }
    } catch (err) {
      console.error('Failed to load user full details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    const famId = typeof user.family === 'object' && user.family !== null ? user.family._id : user.family || '';
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'customer',
      status: user.status || 'active',
      family: famId,
      familyApprovalStatus: user.familyApprovalStatus || 'approved',
    });
    setShowEditModal(true);
  };

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        phone: createFormData.phone.trim() || undefined,
        password: createFormData.password || undefined,
        role: createFormData.role,
        status: createFormData.status,
        family: createFormData.family || undefined,
        familyApprovalStatus: createFormData.familyApprovalStatus,
      };

      const res = await fetchApi('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'customer',
          status: 'active',
          family: '',
          familyApprovalStatus: 'approved',
        });
        loadUsers();
        loadStats();
      } else {
        alert(res.message || 'Failed to create user');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const payload: any = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
        status: editFormData.status,
        family: editFormData.family || null,
        familyApprovalStatus: editFormData.familyApprovalStatus,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetchApi(`/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setShowEditModal(false);
        loadUsers();
        loadStats();
      } else {
        alert(res.message || 'Failed to update user');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve / Reject Family
  const handleFamilyApproval = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetchApi(`/admin/users/${userId}/family-approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        loadUsers();
        loadStats();
        if (selectedUser && selectedUser._id === userId) {
          openUserDetails({ ...selectedUser, familyApprovalStatus: status });
        }
      } else {
        alert(res.message || 'Failed to update family approval status');
      }
    } catch (err) {
      console.error('Approval status update error', err);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      const res = await fetchApi(`/admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success) {
        loadUsers();
        loadStats();
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  // Delete User
  const handleDeleteSubmit = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/users/${userToDelete._id}`, { method: 'DELETE' });
      if (res.success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
        loadStats();
      } else {
        alert(res.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  // Role pill style helper
  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Shield className="w-3 h-3" /> Super Admin
        </span>
      );
    }
    if (r === 'admin' || r === 'manager') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#57c5cc]/10 text-[#309fa6] dark:text-[#57c5cc] border border-[#57c5cc]/20">
          <Shield className="w-3 h-3" /> Admin
        </span>
      );
    }
    if (r === 'seller') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Seller
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-foreground/5 text-foreground/70 border border-border">
        Customer
      </span>
    );
  };

  // Status pill style helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    }
    if (s === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Blocked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Inactive
      </span>
    );
  };

  // Family approval pill helper
  const getApprovalBadge = (appStatus?: string) => {
    const a = (appStatus || '').toLowerCase();
    if (a === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
      );
    }
    if (a === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
          <Clock className="w-3 h-3" /> Pending Approval
        </span>
      );
    }
    if (a === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    }
    return <span className="text-foreground/40 text-xs">—</span>;
  };

  // User initials avatar helper
  const getAvatarInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#57c5cc]" />
            Users & Customers Management
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage user accounts, family memberships, approval workflows, saved addresses, and active shopping carts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadUsers();
            }}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 text-foreground/70 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white font-medium shadow-sm shadow-[#57c5cc]/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Global KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-xs text-foreground/50">{stats.customerUsers} customers · {stats.adminUsers} staff</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Active Users</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statsLoading ? '...' : stats.activeUsers.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Verified & active access</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Pending Family Approval</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsLoading ? '...' : stats.pendingApproval.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Awaiting admin review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Blocked / Inactive */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Blocked / Inactive</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statsLoading ? '...' : stats.blockedUsers.toLocaleString()}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Access restricted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#57c5cc] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="seller">Seller</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Family Approval Filter */}
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Approvals</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Family Filter */}
            <select
              value={familyFilter}
              onChange={(e) => {
                setFamilyFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition max-w-45"
            >
              <option value="ALL">All Families</option>
              {families.map((fam) => (
                <option key={fam._id} value={fam._id}>
                  {fam.name}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="role_asc">By Role</option>
            </select>

            {/* Rows Per Page */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border">
          <RefreshCw className="w-8 h-8 text-[#57c5cc] animate-spin mx-auto mb-3" />
          <p className="text-sm text-foreground/60 font-medium">Loading users catalog...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Users Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            No users match the selected filters or search term. Try adjusting your query or click Add User to create one.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
              setApprovalFilter('ALL');
              setFamilyFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-medium transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/2 text-foreground/60 text-xs font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Family & Approval</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const famName =
                    typeof user.family === 'object' && user.family !== null
                      ? user.family.name
                      : user.family
                      ? 'Assigned'
                      : 'None';

                  return (
                    <tr key={user._id} className="hover:bg-foreground/2 transition group">
                      {/* User Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#57c5cc] to-[#309fa6] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {getAvatarInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {user.name}
                              {user.isVerified && (
                                <span title="Verified Account">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#57c5cc]" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-foreground/50 font-mono flex items-center gap-1">
                              <span>ID: {user._id.slice(-6)}</span>
                              <button
                                onClick={() => handleCopy(user._id, user._id)}
                                className="text-foreground/40 hover:text-foreground"
                                title="Copy full ID"
                              >
                                {copiedId === user._id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-foreground flex items-center gap-1.5 font-medium">
                            <Mail className="w-3.5 h-3.5 text-foreground/40" />
                            {user.email}
                          </div>
                          {user.phone ? (
                            <div className="text-xs text-foreground/60 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-foreground/40" />
                              {user.phone}
                            </div>
                          ) : (
                            <span className="text-xs text-foreground/30 italic">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>

                      {/* Family & Approval */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#57c5cc]" />
                            {famName}
                          </div>
                          {user.familyApprovalStatus && (
                            <div>{getApprovalBadge(user.familyApprovalStatus)}</div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="focus:outline-none"
                          title="Click to toggle status"
                        >
                          {getStatusBadge(user.status)}
                        </button>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-xs text-foreground/60">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openUserDetails(user)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] hover:border-[#57c5cc]/30 text-foreground/70 transition"
                            title="View Full Details (Cart & Addresses)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30 text-foreground/70 transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 text-foreground/70 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const famName =
              typeof user.family === 'object' && user.family !== null
                ? user.family.name
                : user.family
                ? 'Assigned'
                : 'None';

            return (
              <div
                key={user._id}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between hover:border-[#57c5cc]/40 transition space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#57c5cc] to-[#309fa6] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                        {getAvatarInitials(user.name)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {user.name}
                          {user.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#57c5cc]" />}
                        </h4>
                        <p className="text-xs text-foreground/50 font-mono">ID: {user._id.slice(-6)}</p>
                      </div>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-foreground/80 font-medium">
                      <Mail className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Phone className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Building2 className="w-3.5 h-3.5 text-[#57c5cc] flex-shrink-0" />
                      <span>Family: {famName}</span>
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                    {getRoleBadge(user.role)}
                    {user.familyApprovalStatus && getApprovalBadge(user.familyApprovalStatus)}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-foreground/40">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openUserDetails(user)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 font-medium transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-amber-500/10 hover:text-amber-600 text-foreground/70 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && users.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> registered users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-medium text-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DETAILS MODAL (WITH ACTIVE CART, SAVED ADDRESSES & PROFILE)           */}
      {/* ========================================================================= */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-foreground/2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#57c5cc] to-[#309fa6] text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                  {getAvatarInitials(selectedUser.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-foreground/40" />
                      {selectedUser.email}
                    </span>
                    {selectedUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-foreground/40" />
                        {selectedUser.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-xl text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-2 border-b border-border bg-surface flex items-center gap-2">
              <button
                onClick={() => setDetailsTab('cart')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                  detailsTab === 'cart'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Active Shopping Cart
                {userDetails?.cart?.items && userDetails.cart.items.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-2xs bg-[#57c5cc]/20 text-[#57c5cc] font-bold">
                    {userDetails.cart.items.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setDetailsTab('addresses')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                  detailsTab === 'addresses'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Saved Addresses
                {userDetails?.addresses && userDetails.addresses.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-2xs bg-foreground/10 text-foreground font-bold">
                    {userDetails.addresses.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setDetailsTab('profile')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                  detailsTab === 'profile'
                    ? 'border-[#57c5cc] text-[#57c5cc]'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                <Shield className="w-4 h-4" />
                Profile & Family Membership
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailsLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 text-[#57c5cc] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-foreground/60 font-medium">Fetching user data, cart and addresses...</p>
                </div>
              ) : detailsTab === 'cart' ? (
                /* TAB: ACTIVE CART */
                <div className="space-y-4">
                  {userDetails?.cart?.items && userDetails.cart.items.length > 0 ? (
                    <>
                      {/* Cart Summary Banner */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#57c5cc]/10 via-[#57c5cc]/5 to-transparent border border-[#57c5cc]/20 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-[#57c5cc] font-semibold uppercase tracking-wider">
                            Active User Cart
                          </p>
                          <p className="text-xl font-bold text-foreground mt-0.5">
                            ₹
                            {(
                              userDetails.cart.summary?.totalAmount ||
                              userDetails.cart.items.reduce((acc, it) => acc + (it.subtotal || 0), 0)
                            ).toLocaleString()}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {userDetails.cart.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} total items
                            {userDetails.cart.summary?.couponCode && ` · Applied Coupon: ${userDetails.cart.summary.couponCode}`}
                          </p>
                        </div>
                        {userDetails.cart.summary?.discountAmount ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            Discount: -₹{userDetails.cart.summary.discountAmount}
                          </div>
                        ) : null}
                      </div>

                      {/* Itemized Cart Table */}
                      <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-foreground/2 text-foreground/60 font-semibold border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Product</th>
                              <th className="px-4 py-3">Variant / SKU</th>
                              <th className="px-4 py-3">Unit Price</th>
                              <th className="px-4 py-3">Quantity</th>
                              <th className="px-4 py-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {userDetails.cart.items.map((item, idx) => {
                              const prodImg =
                                item.variant?.images?.[0] || item.product?.images?.[0] || null;
                              return (
                                <tr key={item._id || idx} className="hover:bg-foreground/2">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {prodImg ? (
                                          <img
                                            src={prodImg}
                                            alt={item.product?.name || 'Product'}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Package className="w-5 h-5 text-foreground/30" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground">
                                          {item.product?.name || 'Catalog Item'}
                                        </p>
                                        <p className="text-foreground/40 text-2xs">
                                          Product ID: {item.product?._id ? item.product._id.slice(-6) : '—'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="space-y-0.5">
                                      <p className="font-medium text-foreground">
                                        {item.variant?.title || 'Default Variant'}
                                      </p>
                                      <p className="text-foreground/50 font-mono text-2xs">
                                        SKU: {item.variant?.sku || 'N/A'}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-foreground">
                                    ₹{(item.unitPrice || item.variant?.price || 0).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded-md bg-foreground/5 border border-border font-bold">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-foreground">
                                    ₹{(item.subtotal || item.unitPrice * item.quantity).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-border space-y-2">
                      <div className="w-12 h-12 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Cart is Empty</h4>
                      <p className="text-xs text-foreground/50 max-w-sm mx-auto">
                        This user does not currently have any active items in their shopping cart.
                      </p>
                    </div>
                  )}
                </div>
              ) : detailsTab === 'addresses' ? (
                /* TAB: SAVED ADDRESSES */
                <div className="space-y-4">
                  {userDetails?.addresses && userDetails.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDetails.addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-3 relative"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-md text-2xs font-bold uppercase bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20">
                              {addr.addressType || 'HOME'}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Default Primary
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{addr.fullName}</p>
                            <p className="text-xs text-foreground/60">{addr.phone}</p>
                          </div>
                          <div className="text-xs text-foreground/70 space-y-0.5 pt-2 border-t border-border">
                            <p>{addr.addressLine1}</p>
                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                            {addr.landmark && <p className="text-foreground/50">Landmark: {addr.landmark}</p>}
                            <p className="font-medium text-foreground">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <p className="text-foreground/50">{addr.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-border space-y-2">
                      <div className="w-12 h-12 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">No Saved Addresses</h4>
                      <p className="text-xs text-foreground/50">User hasn't saved any delivery addresses yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB: PROFILE & FAMILY MEMBERSHIP */
                <div className="space-y-6">
                  {/* Family Details Card */}
                  <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#57c5cc]" />
                        Brand Family Membership
                      </h4>
                      {selectedUser.familyApprovalStatus && getApprovalBadge(selectedUser.familyApprovalStatus)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-foreground/50">Assigned Family:</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {typeof selectedUser.family === 'object' && selectedUser.family !== null
                            ? selectedUser.family.name
                            : 'No Family Assigned'}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Approval Workflow Status:</p>
                        <p className="font-semibold text-foreground mt-0.5 capitalize">
                          {selectedUser.familyApprovalStatus || 'Not Applicable'}
                        </p>
                      </div>
                    </div>

                    {/* Quick approval buttons */}
                    {selectedUser.familyApprovalStatus === 'pending' && (
                      <div className="pt-3 border-t border-border flex items-center gap-3">
                        <button
                          onClick={() => handleFamilyApproval(selectedUser._id, 'approved')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Request & Activate User
                        </button>
                        <button
                          onClick={() => handleFamilyApproval(selectedUser._id, 'rejected')}
                          className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Request
                        </button>
                      </div>
                    )}
                  </div>

                  {/* General Profile Metadata */}
                  <div className="p-5 rounded-2xl bg-background border border-border space-y-3 text-xs">
                    <h4 className="font-semibold text-foreground">Account Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-foreground/50">User ID:</span>
                        <span className="font-mono text-foreground ml-2">{selectedUser._id}</span>
                      </div>
                      <div>
                        <span className="text-foreground/50">Verified Status:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground/50">Member Since:</span>
                        <span className="font-medium text-foreground ml-2">
                          {new Date(selectedUser.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground/50">Lifetime Orders:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {userDetails?.orders?.total ?? 0} orders
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-foreground/2 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedUser);
                }}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-semibold text-foreground transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                Edit Account Details
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white text-xs font-semibold shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE USER MODAL                                                         */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#57c5cc]" />
                Create New User
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground/70 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  />
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground/70 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Role</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Status</label>
                  <select
                    value={createFormData.status}
                    onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Brand Family</label>
                  <select
                    value={createFormData.family}
                    onChange={(e) => setCreateFormData({ ...createFormData, family: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="">None (General)</option>
                    {families.map((fam) => (
                      <option key={fam._id} value={fam._id}>
                        {fam.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Family Approval</label>
                  <select
                    value={createFormData.familyApprovalStatus}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, familyApprovalStatus: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-foreground/70 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL                                                           */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                Edit User: {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground/70 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  />
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground/70 font-semibold mb-1">
                  New Password <span className="font-normal text-foreground/40">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Brand Family</label>
                  <select
                    value={editFormData.family}
                    onChange={(e) => setEditFormData({ ...editFormData, family: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="">None (General)</option>
                    {families.map((fam) => (
                      <option key={fam._id} value={fam._id}>
                        {fam.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/70 font-semibold mb-1">Family Approval</label>
                  <select
                    value={editFormData.familyApprovalStatus}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, familyApprovalStatus: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-foreground/70 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete User Account</h3>
              <p className="text-xs text-foreground/60">
                Are you sure you want to delete <span className="font-semibold text-foreground">{userToDelete.name}</span> ({userToDelete.email})? This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-semibold text-foreground/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
