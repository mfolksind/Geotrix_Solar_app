"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  MapPin,
  Home,
  Zap,
  Calendar,
  LayoutGrid,
  LayoutList,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  IndianRupee
} from 'lucide-react';

interface Lead {
  _id: string;
  fullName: string;
  propertyType: string;
  city: string;
  pinCode: string;
  whatsappNumber: string;
  monthlyBill: string;
  agreedToTerms: boolean;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  createdAt: string;
  updatedAt?: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  lostLeads: number;
}

export default function QueriesPage() {
  // Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Stats (Catalog-wide, unfiltered)
  const [globalStats, setGlobalStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    lostLeads: 0,
  });

  // Filter & Query States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Action Feedback
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // 1. Fetch Global Stats
  const loadGlobalStats = useCallback(async () => {
    try {
      const res = await fetchApi('/api/leads/stats');
      if (res && res.success && res.data) {
        setGlobalStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load query stats:', err);
    }
  }, []);

  // 2. Fetch Leads List
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/api/leads?${params.toString()}`);
      if (res && res.success) {
        setLeads(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotal(res.data?.length || 0);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to load queries/leads:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, sortBy, page, limit]);

  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Filter Event Handlers
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setPage(1);
  };

  const handleLimitChange = (val: number) => {
    setLimit(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || selectedStatus !== 'ALL' || sortBy !== 'newest';

  // Copy Phone Helper
  const handleCopyPhone = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Update Status directly
  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    setStatusUpdatingId(leadId);
    try {
      const res = await fetchApi(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res && res.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, status: nextStatus as any } : l))
        );
        if (viewingLead && viewingLead._id === leadId) {
          setViewingLead((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
        }
        loadGlobalStats();
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete Lead
  const handleConfirmDelete = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/api/leads/${deletingLead._id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setDeletingLead(null);
        if (viewingLead?._id === deletingLead._id) setViewingLead(null);
        loadLeads();
        loadGlobalStats();
      } else {
        alert(res?.message || 'Failed to delete query');
      }
    } catch (err) {
      alert('Error deleting query');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>New Lead</span>
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
            <Clock size={12} />
            <span>Contacted</span>
          </span>
        );
      case 'Qualified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 size={12} />
            <span>Qualified</span>
          </span>
        );
      case 'Lost':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-foreground/5 text-foreground/60 border border-border">
            <XCircle size={12} />
            <span>Lost / Closed</span>
          </span>
        );
    }
  };

  // Clean WhatsApp Link Generator
  const getWhatsAppLink = (number: string, leadName: string) => {
    const cleanNum = number.replace(/[^0-9]/g, '');
    const formattedNum = cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
    const msg = encodeURIComponent(`Hi ${leadName}, thank you for contacting Mfolks regarding your solar/energy requirements!`);
    return `https://wa.me/${formattedNum}?text=${msg}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Inquiries & Leads
            </h1>
            <span className="bg-[#57c5cc]/10 text-[#57c5cc] font-semibold text-xs px-2.5 py-1 rounded-full">
              {globalStats.totalLeads} Total Inquiries
            </span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Review customer consultation requests, energy estimations, location details, and follow-up statuses
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Table View"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#57c5cc] text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={loadLeads}
            disabled={loading}
            className="p-2.5 bg-surface border border-border text-foreground/70 hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-[#57c5cc]' : ''} />
          </button>
        </div>
      </div>

      {/* Global Stat Cards (Catalog Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Total Inquiries</p>
              <span className="text-[10px] text-foreground/40 font-mono">(All)</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.totalLeads}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">New / Unhandled</p>
              <span className="text-[10px] text-amber-600 font-mono font-bold">Action Needed</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.newLeads}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">In Contact</p>
              <span className="text-[10px] text-cyan-600 font-mono font-bold">Active</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.contactedLeads}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-foreground/60">Qualified Deals</p>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">
                {globalStats.totalLeads > 0
                  ? `${Math.round((globalStats.qualifiedLeads / globalStats.totalLeads) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mt-0.5">{globalStats.qualifiedLeads}</p>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by customer name, WhatsApp #, city, pin code, or property..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Table Count Selector & Reset Controls */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            {/* Show per page dropdown */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground/70">
              <span className="font-medium">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={0}>All rows</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RefreshCw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Inquiry Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="ALL">All Inquiry Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1.5">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30 focus:border-[#57c5cc] cursor-pointer"
            >
              <option value="newest">Newest Inquiries First</option>
              <option value="oldest">Oldest Inquiries First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-[#57c5cc] mb-3"></div>
          <p className="text-sm font-medium text-foreground/60">Loading inquiries...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-foreground/40 mx-auto mb-3">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No inquiries found</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No inquiries match your active search or filter criteria. Try resetting filters.'
              : 'Consultation requests from website visitors will appear here.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-border text-foreground/60 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">WhatsApp Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Property & Bill</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {leads.map((lead) => {
                  const leadDate = lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={lead._id}
                      onClick={() => setViewingLead(lead)}
                      className="hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold text-sm shrink-0">
                            {lead.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground group-hover:text-[#57c5cc] transition-colors">
                              {lead.fullName}
                            </div>
                            <div className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1.5">
                              <Calendar size={12} />
                              <span>{leadDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground/80 font-medium">
                            {lead.whatsappNumber}
                          </span>
                          <button
                            onClick={(e) => handleCopyPhone(lead.whatsappNumber, e)}
                            className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                            title="Copy Phone Number"
                          >
                            {copiedPhone === lead.whatsappNumber ? (
                              <Check size={12} className="text-[#57c5cc]" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <a
                            href={getWhatsAppLink(lead.whatsappNumber, lead.fullName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </a>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                          <MapPin size={13} className="text-foreground/40 shrink-0" />
                          <span>
                            {lead.city} {lead.pinCode && `(${lead.pinCode})`}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-background border border-border text-foreground">
                            <Home size={11} className="text-[#57c5cc]" />
                            <span>{lead.propertyType}</span>
                          </span>
                          {lead.monthlyBill && (
                            <span className="text-[10px] text-foreground/60 font-mono">
                              Bill: ₹{lead.monthlyBill}/mo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          disabled={statusUpdatingId === lead._id}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className="py-1 px-2.5 text-xs font-semibold rounded-full border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#57c5cc]/30"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setViewingLead(lead)}
                            className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                            title="View inquiry details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingLead(lead)}
                            className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={16} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead) => {
            const leadDate = lead.createdAt
              ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <div
                key={lead._id}
                onClick={() => setViewingLead(lead)}
                className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#57c5cc]/40 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold text-base shrink-0">
                        {lead.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{lead.fullName}</h3>
                        <div className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{leadDate}</span>
                        </div>
                      </div>
                    </div>

                    {getStatusBadge(lead.status)}
                  </div>

                  {/* Info Breakdown */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-background border border-border rounded-xl mb-4 text-xs">
                    <div>
                      <div className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                        Property Type
                      </div>
                      <div className="font-bold text-foreground truncate mt-0.5 flex items-center gap-1">
                        <Home size={13} className="text-[#57c5cc]" />
                        <span>{lead.propertyType}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                        Monthly Bill
                      </div>
                      <div className="font-bold text-foreground truncate mt-0.5">
                        ₹{lead.monthlyBill || 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-foreground/70 truncate">
                        <MapPin size={12} className="text-foreground/40" />
                        <span>
                          {lead.city}, {lead.pinCode}
                        </span>
                      </div>

                      <a
                        href={getWhatsAppLink(lead.whatsappNumber, lead.fullName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <MessageCircle size={13} />
                        <span>Chat</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-xs text-foreground/70 font-mono">
                    {lead.whatsappNumber}
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingLead(lead)}
                      className="p-1.5 text-foreground/40 hover:text-[#57c5cc] hover:bg-[#57c5cc]/10 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingLead(lead)}
                      className="p-1.5 text-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-foreground/60">
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-foreground">{total}</span> inquiries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-foreground px-3 py-1.5 bg-background border border-border rounded-xl">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          CONSULTATION DETAILS MODAL
         ========================================================= */}
      {viewingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] border border-[#57c5cc]/20 flex items-center justify-center font-bold text-sm">
                  {viewingLead.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{viewingLead.fullName}</span>
                  </h3>
                  <p className="text-xs text-foreground/50">
                    Received on{' '}
                    {viewingLead.createdAt
                      ? new Date(viewingLead.createdAt).toLocaleString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingLead(null)}
                className="p-1 text-foreground/40 hover:text-foreground rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status Selector in Modal */}
              <div className="p-3 bg-background border border-border rounded-2xl flex items-center justify-between">
                <span className="font-semibold text-foreground">Inquiry Status</span>
                <select
                  value={viewingLead.status}
                  onChange={(e) => handleStatusChange(viewingLead._id, e.target.value)}
                  className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-border bg-surface text-foreground cursor-pointer focus:ring-2 focus:ring-[#57c5cc]/30"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Contact Card */}
              <div className="bg-background border border-border rounded-2xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 block">
                  Contact Information
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-mono text-sm">
                    <Phone size={14} className="text-[#57c5cc]" />
                    <span>{viewingLead.whatsappNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopyPhone(viewingLead.whatsappNumber, e)}
                      className="px-2.5 py-1 bg-surface border border-border rounded-lg hover:bg-foreground/5 text-foreground/80 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPhone === viewingLead.whatsappNumber ? (
                        <Check size={12} className="text-[#57c5cc]" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>Copy</span>
                    </button>
                    <a
                      href={getWhatsAppLink(viewingLead.whatsappNumber, viewingLead.fullName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-semibold"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Requirement Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-border rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-foreground/50">Property Type</span>
                  <p className="text-sm font-bold text-foreground">{viewingLead.propertyType}</p>
                </div>

                <div className="bg-background border border-border rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-foreground/50">Monthly Bill</span>
                  <p className="text-sm font-bold text-foreground">₹{viewingLead.monthlyBill || 'Not specified'}</p>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-background border border-border rounded-2xl p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 block">
                  Installation Location
                </span>
                <p className="text-foreground text-sm font-semibold">
                  {viewingLead.city}
                </p>
                <p className="text-foreground/60">
                  Postal Code / PIN: <span className="font-mono">{viewingLead.pinCode || 'N/A'}</span>
                </p>
              </div>

              {/* Terms */}
              <div className="p-3 bg-background border border-border rounded-xl flex items-center gap-2 text-foreground/70">
                <ShieldCheck size={16} className="text-[#57c5cc] shrink-0" />
                <span>Customer agreed to terms and conditions during submission.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between mt-5">
              <button
                onClick={() => setDeletingLead(viewingLead)}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Inquiry</span>
              </button>

              <button
                onClick={() => setViewingLead(null)}
                className="px-4 py-2 bg-surface border border-border hover:bg-background text-foreground rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION DIALOG
         ========================================================= */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Delete Inquiry</h3>
            <p className="text-xs text-foreground/70 mt-2 leading-relaxed">
              Are you sure you want to delete inquiry from <strong className="text-foreground">&quot;{deletingLead.fullName}&quot;</strong>?
              This record will be permanently deleted.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingLead(null)}
                className="px-4 py-2 border border-border text-foreground/80 rounded-xl text-xs font-medium hover:bg-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
