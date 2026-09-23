"use client";

import React, { useEffect, useState, useRef } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  User,
  Send,
  Shield,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Tag,
  Calendar,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  profilePicture?: string;
}

interface TicketMessage {
  _id: string;
  ticket: string;
  sender?: UserInfo | string;
  message: string;
  attachments?: { url: string; fileName?: string }[];
  isInternalNote?: boolean;
  createdAt: string;
}

interface TicketItem {
  _id: string;
  ticketNumber: string;
  user?: UserInfo | string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  assignedTo?: UserInfo | string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
}

export default function SupportTicketsPage() {
  // Stats
  const [stats, setStats] = useState<TicketStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    urgentTickets: 0,
  });

  // Data
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Conversation Modal State
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Load Staff Members for Agent Assignment
  const loadStaffUsers = async () => {
    try {
      const res = await fetchApi('/admin/users?role=admin&limit=100');
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setStaffUsers(list);
      }
    } catch (err) {
      console.error('Failed to load staff users', err);
    }
  };

  // Load stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchApi('/admin/support/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load ticket stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/admin/support?${params.toString()}`);
      if (res.success) {
        if (res.data && res.data.items) {
          setTickets(res.data.items);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.items.length);
        } else if (Array.isArray(res.data)) {
          setTickets(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setTickets([]);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadStaffUsers();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [search, statusFilter, priorityFilter, categoryFilter, sortBy, page, limit]);

  // Open Conversation
  const openConversation = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setMessagesLoading(true);
    setReplyText('');
    setIsInternalNote(false);
    try {
      const res = await fetchApi(`/admin/support/${ticket._id}`);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        if (res.data.ticket) {
          setSelectedTicket(res.data.ticket);
        }
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send Reply / Internal Note
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetchApi(`/admin/support/${selectedTicket._id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyText.trim(),
          isInternalNote: isInternalNote,
        }),
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setReplyText('');
        loadTickets();
        loadStats();
      } else {
        alert(res.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Failed to reply', err);
      alert('Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Update Status
  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const res = await fetchApi(`/admin/support/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        loadTickets();
        loadStats();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  // Update Priority
  const handlePriorityChange = async (ticketId: string, priority: string) => {
    try {
      const res = await fetchApi(`/admin/support/${ticketId}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
      if (res.success) {
        loadTickets();
        loadStats();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket({ ...selectedTicket, priority });
        }
      } else {
        alert(res.message || 'Failed to update priority');
      }
    } catch (err) {
      console.error('Priority update failed', err);
    }
  };

  // Assign Agent
  const handleAssignAgent = async (ticketId: string, agentId: string) => {
    try {
      const res = await fetchApi(`/admin/support/${ticketId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId }),
      });
      if (res.success) {
        loadTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            assignedTo: staffUsers.find((u) => u._id === agentId) || agentId,
          });
        }
      } else {
        alert(res.message || 'Failed to assign agent');
      }
    } catch (err) {
      console.error('Agent assignment failed', err);
    }
  };

  // Delete Ticket
  const handleDeleteSubmit = async () => {
    if (!ticketToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/support/${ticketToDelete._id}`, { method: 'DELETE' });
      if (res.success) {
        setTicketToDelete(null);
        if (selectedTicket?._id === ticketToDelete._id) {
          setSelectedTicket(null);
        }
        loadTickets();
        loadStats();
      } else {
        alert(res.message || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Open
        </span>
      );
    }
    if (s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      );
    }
    if (s === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <CheckCircle2 className="w-3 h-3" /> Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-foreground/10 text-foreground/70 border border-border">
        <XCircle className="w-3 h-3" /> Closed
      </span>
    );
  };

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
          <AlertTriangle className="w-3 h-3" /> Urgent
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-3 h-3" /> High
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium uppercase bg-foreground/5 text-foreground/60 border border-border">
        Low
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LifeBuoy className="w-8 h-8 text-[#57c5cc]" />
            Support Tickets & Helpdesk
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Resolve customer inquiries, communicate via chat threads, delegate tickets to agents, and manage resolution statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadTickets();
              loadStaffUsers();
            }}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 text-foreground/70 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats.totalTickets.toLocaleString()}
            </p>
            <p className="text-xs text-foreground/50">{stats.urgentTickets} marked urgent</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
            <LifeBuoy className="w-6 h-6" />
          </div>
        </div>

        {/* Open & Unresolved */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statsLoading ? '...' : stats.openTickets.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Awaiting agent response</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsLoading ? '...' : stats.inProgressTickets.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Actively being handled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved / Closed */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Resolved & Closed</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statsLoading ? '...' : (stats.resolvedTickets + stats.closedTickets).toLocaleString()}
            </p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">{stats.resolvedTickets} resolved</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
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
              placeholder="Search by ticket #, subject, or customer name/email..."
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="ORDER">Order Issue</option>
              <option value="PRODUCT">Product Inquiry</option>
              <option value="BILLING">Billing & GST</option>
              <option value="TECHNICAL">Technical Support</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority_desc">Priority (High to Low)</option>
              <option value="priority_asc">Priority (Low to High)</option>
            </select>

            {/* Rows Per Page */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
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
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
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
          <p className="text-sm text-foreground/60 font-medium">Loading support tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Support Tickets Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            No support inquiries match your selected filter criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-medium transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/2 text-foreground/60 text-xs font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Subject & Category</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => {
                  const userObj = typeof t.user === 'object' && t.user !== null ? (t.user as UserInfo) : null;
                  const assignedObj = typeof t.assignedTo === 'object' && t.assignedTo !== null ? (t.assignedTo as UserInfo) : null;

                  return (
                    <tr
                      key={t._id}
                      onClick={() => openConversation(t)}
                      className="hover:bg-foreground/2 transition group cursor-pointer"
                    >
                      {/* Ticket Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                          <span className="text-[#57c5cc]">{t.ticketNumber}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(t.ticketNumber, t._id);
                            }}
                            className="text-foreground/40 hover:text-foreground p-0.5"
                            title="Copy Ticket ID"
                          >
                            {copiedId === t._id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        {userObj ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-xs text-foreground flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#57c5cc]" />
                              {userObj.name}
                            </p>
                            <p className="text-2xs text-foreground/50">{userObj.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/40 font-mono">
                            User #{typeof t.user === 'string' ? t.user.slice(-6) : '—'}
                          </span>
                        )}
                      </td>

                      {/* Subject & Category */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-xs text-foreground truncate">{t.subject}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-2xs font-semibold bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20">
                          {t.category || 'GENERAL'}
                        </span>
                      </td>

                      {/* Assigned Agent */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={assignedObj?._id || (typeof t.assignedTo === 'string' ? t.assignedTo : '')}
                          onChange={(e) => handleAssignAgent(t._id, e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs font-medium border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] cursor-pointer max-w-[130px] truncate"
                        >
                          <option value="">Unassigned</option>
                          {staffUsers.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.priority}
                          onChange={(e) => handlePriorityChange(t._id, e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] cursor-pointer"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t._id, e.target.value)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-background focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>

                      {/* Last Activity */}
                      <td className="px-6 py-4 text-xs text-foreground/60">
                        {new Date(t.lastMessageAt || t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openConversation(t)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition cursor-pointer"
                            title="Open Conversation & Reply"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTicketToDelete(t)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition cursor-pointer"
                            title="Delete Ticket"
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
          {tickets.map((t) => {
            const userObj = typeof t.user === 'object' && t.user !== null ? (t.user as UserInfo) : null;
            const assignedObj = typeof t.assignedTo === 'object' && t.assignedTo !== null ? (t.assignedTo as UserInfo) : null;

            return (
              <div
                key={t._id}
                onClick={() => openConversation(t)}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between hover:border-[#57c5cc]/40 transition space-y-4 cursor-pointer"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#57c5cc]">{t.ticketNumber}</span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Subject & Category */}
                  <div className="mt-3">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-2">{t.subject}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-2xs font-semibold bg-[#57c5cc]/10 text-[#57c5cc]">
                      {t.category || 'GENERAL'}
                    </span>
                  </div>

                  {/* Customer & Agent Info */}
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#57c5cc]" />
                        {userObj?.name || 'Customer'}
                      </p>
                      <span className="text-2xs text-foreground/50">{userObj?.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-2xs text-foreground/60" onClick={(e) => e.stopPropagation()}>
                      <UserCheck className="w-3 h-3 text-indigo-500" />
                      <span>Agent: <b>{assignedObj?.name || 'Unassigned'}</b></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div
                  className="pt-3 border-t border-border flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-2xs text-foreground/40">
                    {new Date(t.lastMessageAt || t.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openConversation(t)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] font-semibold text-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat / Reply
                    </button>
                    <button
                      onClick={() => setTicketToDelete(t)}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition cursor-pointer"
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
      {!loading && tickets.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> support tickets
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TICKET CONVERSATION & REPLY DRAWER MODAL                                  */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl h-[85vh] bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-foreground/2">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-[#57c5cc]">{selectedTicket.ticketNumber}</span>
                  <h3 className="text-base font-bold text-foreground truncate max-w-md">{selectedTicket.subject}</h3>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1">
                  <span>Category: <b>{selectedTicket.category || 'General'}</b></span>
                  <span>·</span>
                  <span>Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>
                    Assigned: <b>{(selectedTicket.assignedTo as any)?.name || 'Unassigned'}</b>
                  </span>
                </div>
              </div>

              {/* Status & Priority Quick Switches in Modal Header */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handlePriorityChange(selectedTicket._id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
                  title="Change Priority"
                >
                  <option value="LOW">Priority: Low</option>
                  <option value="MEDIUM">Priority: Medium</option>
                  <option value="HIGH">Priority: High</option>
                  <option value="URGENT">Priority: Urgent</option>
                </select>

                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-background text-foreground focus:outline-none focus:border-[#57c5cc] transition cursor-pointer"
                  title="Change Status"
                >
                  <option value="OPEN">Status: Open</option>
                  <option value="IN_PROGRESS">Status: In Progress</option>
                  <option value="RESOLVED">Status: Resolved</option>
                  <option value="CLOSED">Status: Closed</option>
                </select>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/50">
              {messagesLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 text-[#57c5cc] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-foreground/60">Loading conversation thread...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border space-y-2">
                  <MessageSquare className="w-8 h-8 text-foreground/30 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">No Messages in this Ticket Yet</p>
                  <p className="text-xs text-foreground/50">Type below to send the first response to the customer.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderObj = typeof msg.sender === 'object' && msg.sender !== null ? (msg.sender as UserInfo) : null;
                  const isStaff = senderObj?.role === 'admin' || senderObj?.role === 'super_admin' || senderObj?.role === 'manager';
                  const isNote = !!msg.isInternalNote;

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex flex-col ${isNote ? 'items-center' : isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-2xs font-semibold text-foreground/70">
                          {senderObj?.name || (isStaff ? 'Staff Support' : 'Customer')}
                        </span>
                        {isNote ? (
                          <span className="px-1.5 py-0.2 rounded text-3xs font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Internal Staff Note
                          </span>
                        ) : isStaff ? (
                          <span className="px-1.5 py-0.2 rounded text-3xs font-bold uppercase bg-[#57c5cc]/20 text-[#57c5cc]">
                            Support Agent
                          </span>
                        ) : null}
                        <span className="text-3xs text-foreground/40">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                          isNote
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                            : isStaff
                            ? 'bg-[#57c5cc] text-white rounded-tr-xs'
                            : 'bg-surface border border-border text-foreground rounded-tl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Form Footer with Internal Note Toggle */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-border bg-surface flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                      !isInternalNote
                        ? 'bg-[#57c5cc] text-white'
                        : 'bg-background border border-border text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    Public Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                      isInternalNote
                        ? 'bg-amber-500 text-white'
                        : 'bg-background border border-border text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Internal Staff Note
                  </button>
                </div>
                <span className="text-2xs text-foreground/40">
                  {isInternalNote ? 'Visible only to staff & admins' : 'Customer will see this reply'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder={isInternalNote ? "Write an internal note for staff members..." : "Type your reply to the customer..."}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  className={`flex-1 px-4 py-3 rounded-2xl border text-xs focus:outline-none transition ${
                    isInternalNote
                      ? 'border-amber-500/40 bg-amber-50/20 text-foreground focus:border-amber-500'
                      : 'border-border bg-background text-foreground focus:border-[#57c5cc]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className={`px-5 py-3 rounded-2xl text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                    isInternalNote ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#57c5cc] hover:bg-[#46b3ba]'
                  }`}
                >
                  {sendingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isInternalNote ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isInternalNote ? 'Add Note' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete Support Ticket</h3>
              <p className="text-xs text-foreground/60">
                Are you sure you want to delete ticket <span className="font-semibold text-foreground">{ticketToDelete.ticketNumber}</span>?
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-semibold text-foreground/70 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
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