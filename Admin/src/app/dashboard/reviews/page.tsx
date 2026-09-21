"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../utils/api';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  ShieldCheck,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Copy,
  ThumbsUp
} from 'lucide-react';

interface ProductInfo {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  price?: number;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
}

interface ReviewItem {
  _id: string;
  product?: ProductInfo | string;
  user?: UserInfo | string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewStats {
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  verifiedPurchases: number;
  avgRating: number;
}

export default function ReviewsManagementPage() {
  // Stats
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    verifiedPurchases: 0,
    avgRating: 0,
  });

  // Data
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals & Active Selections
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const res = await fetchApi('/admin/reviews/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load review stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load reviews list
  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (ratingFilter !== 'ALL') params.append('rating', ratingFilter);
      if (verifiedFilter !== 'ALL') params.append('isVerifiedPurchase', verifiedFilter);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetchApi(`/admin/reviews?${params.toString()}`);
      if (res.success) {
        if (res.data && res.data.items) {
          setReviews(res.data.items);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.items.length);
        } else if (Array.isArray(res.data)) {
          setReviews(res.data);
          setTotalPages(1);
          setTotalCount(res.data.length);
        } else {
          setReviews([]);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [search, statusFilter, ratingFilter, verifiedFilter, sortBy, page, limit]);

  // Toggle Approval Status
  const handleToggleApproval = async (review: ReviewItem) => {
    const nextStatus = !review.isApproved;
    try {
      const res = await fetchApi(`/admin/reviews/${review._id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved: nextStatus }),
      });
      if (res.success) {
        loadReviews();
        loadStats();
        if (selectedReview && selectedReview._id === review._id) {
          setSelectedReview({ ...selectedReview, isApproved: nextStatus });
        }
      } else {
        alert(res.message || 'Failed to update review status');
      }
    } catch (err) {
      console.error('Failed to toggle approval', err);
    }
  };

  // Delete Review
  const handleDeleteSubmit = async () => {
    if (!reviewToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetchApi(`/admin/reviews/${reviewToDelete._id}`, { method: 'DELETE' });
      if (res.success) {
        setReviewToDelete(null);
        if (selectedReview?._id === reviewToDelete._id) {
          setSelectedReview(null);
        }
        loadReviews();
        loadStats();
      } else {
        alert(res.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting review');
    } finally {
      setActionLoading(false);
    }
  };

  // Render Star Icons Helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-foreground/20'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#57c5cc]" />
            Product Reviews & Ratings
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Moderate customer feedback, approve verified testimonials, and monitor catalog satisfaction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadReviews();
            }}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-foreground/5 text-foreground/70 transition"
            title="Refresh Reviews"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? '...' : stats.totalReviews.toLocaleString()}
            </p>
            <p className="text-xs text-foreground/50">{stats.verifiedPurchases} verified purchases</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Reviews */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Approved & Live</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statsLoading ? '...' : stats.approvedReviews.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Published on website</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Pending Moderation</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsLoading ? '...' : stats.pendingReviews.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Needs admin review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Catalog Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? '...' : `${stats.avgRating} / 5`}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {renderStars(Math.round(stats.avgRating || 5))}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-500" />
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
              placeholder="Search by review text, customer, or product..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
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
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Moderation</option>
            </select>

            {/* Star Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>

            {/* Verified Filter */}
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-[#57c5cc] transition"
            >
              <option value="ALL">All Purchases</option>
              <option value="true">Verified Buyer Only</option>
              <option value="false">Unverified</option>
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
              <option value="rating_desc">Highest Rating</option>
              <option value="rating_asc">Lowest Rating</option>
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
          <p className="text-sm text-foreground/60 font-medium">Loading product reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Reviews Found</h3>
          <p className="text-sm text-foreground/60 max-w-md mx-auto">
            No customer reviews match your selected filter criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setRatingFilter('ALL');
              setVerifiedFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-xs font-medium transition"
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
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review Content</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((rev) => {
                  const prod =
                    typeof rev.product === 'object' && rev.product !== null
                      ? (rev.product as ProductInfo)
                      : null;
                  const usr =
                    typeof rev.user === 'object' && rev.user !== null ? (rev.user as UserInfo) : null;
                  const prodImg = prod?.images?.[0] || null;

                  return (
                    <tr
                      key={rev._id}
                      onClick={() => setSelectedReview(rev)}
                      className="hover:bg-foreground/2 transition group cursor-pointer"
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {prodImg ? (
                              <img src={prodImg} alt={prod?.name || 'Product'} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-foreground/30" />
                            )}
                          </div>
                          <div className="max-w-45">
                            <p className="font-semibold text-foreground text-xs truncate">
                              {prod?.name || 'Catalog Product'}
                            </p>
                            <p className="text-2xs text-foreground/40 font-mono">
                              ID: {prod?._id ? prod._id.slice(-6) : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {usr?.name || 'Customer'}
                            {rev.isVerifiedPurchase && (
                              <span title="Verified Buyer">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              </span>
                            )}
                          </p>
                          <p className="text-2xs text-foreground/50">{usr?.email || '—'}</p>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {renderStars(rev.rating)}
                          <span className="text-2xs font-bold text-foreground">{rev.rating}.0 / 5.0</span>
                        </div>
                      </td>

                      {/* Review Content */}
                      <td className="px-6 py-4 max-w-xs">
                        {rev.title && (
                          <p className="text-xs font-semibold text-foreground truncate">{rev.title}</p>
                        )}
                        <p className="text-xs text-foreground/70 line-clamp-2 mt-0.5">
                          {rev.comment || 'No written text'}
                        </p>
                        {rev.images && rev.images.length > 0 && (
                          <span className="inline-block mt-1 text-2xs font-medium text-[#57c5cc]">
                            📷 {rev.images.length} attached photo(s)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleApproval(rev)}
                          className="focus:outline-none"
                          title="Click to toggle live status"
                        >
                          {rev.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Live (Approved)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-foreground/60">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReview(rev)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition"
                            title="View Full Review"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReviewToDelete(rev)}
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:text-red-600 text-foreground/70 transition"
                            title="Delete Review"
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
          {reviews.map((rev) => {
            const prod =
              typeof rev.product === 'object' && rev.product !== null
                ? (rev.product as ProductInfo)
                : null;
            const usr =
              typeof rev.user === 'object' && rev.user !== null ? (rev.user as UserInfo) : null;
            const prodImg = prod?.images?.[0] || null;

            return (
              <div
                key={rev._id}
                onClick={() => setSelectedReview(rev)}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between hover:border-[#57c5cc]/40 transition space-y-4 cursor-pointer"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {renderStars(rev.rating)}
                      <span className="text-xs font-bold text-foreground">{rev.rating}.0</span>
                    </div>
                    {rev.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Customer info */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#57c5cc] to-[#309fa6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {usr?.name ? usr.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground flex items-center gap-1">
                          {usr?.name || 'Customer'}
                          {rev.isVerifiedPurchase && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        </p>
                        <p className="text-2xs text-foreground/40">{usr?.email || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review text */}
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                    {rev.title && <p className="font-semibold text-foreground">{rev.title}</p>}
                    <p className="text-foreground/70 line-clamp-3 leading-relaxed">
                      "{rev.comment || 'No comment text provided'}"
                    </p>
                  </div>

                  {/* Product Chip */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-foreground/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {prodImg ? (
                        <img src={prodImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-foreground/40" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {prod?.name || 'Product'}
                    </span>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div
                  className="pt-3 border-t border-border flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-2xs text-foreground/40">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleApproval(rev)}
                      className="px-2 py-1 rounded-lg border border-border bg-background hover:bg-foreground/5 text-foreground/70 text-2xs font-semibold transition"
                    >
                      {rev.isApproved ? 'Unpublish' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-[#57c5cc]/10 hover:text-[#57c5cc] text-foreground/70 transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReviewToDelete(rev)}
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
      {!loading && reviews.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> customer reviews
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
      {/* REVIEW DETAILS MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-foreground/2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#57c5cc]/10 text-[#57c5cc] flex items-center justify-center">
                  <Star className="w-6 h-6 fill-[#57c5cc]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm font-bold text-foreground">{selectedReview.rating}.0 / 5</span>
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    Submitted: {new Date(selectedReview.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Product Card */}
              {typeof selectedReview.product === 'object' && selectedReview.product !== null && (
                <div className="p-4 rounded-2xl bg-background border border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedReview.product.images?.[0] ? (
                      <img src={selectedReview.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-foreground/40" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xs font-semibold text-[#57c5cc] uppercase tracking-wider">Reviewed Product</p>
                    <p className="font-bold text-sm text-foreground">{selectedReview.product.name}</p>
                    <p className="text-2xs text-foreground/50 font-mono">ID: {selectedReview.product._id}</p>
                  </div>
                </div>
              )}

              {/* Reviewer Details */}
              <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
                <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">Reviewer</p>
                {typeof selectedReview.user === 'object' && selectedReview.user !== null ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        {selectedReview.user.name}
                        {selectedReview.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-2xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            <ShieldCheck className="w-3 h-3" /> Verified Buyer
                          </span>
                        )}
                      </p>
                      <p className="text-foreground/60">{selectedReview.user.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/70 font-mono">User ID: {typeof selectedReview.user === 'string' ? selectedReview.user : 'Unknown'}</p>
                )}
              </div>

              {/* Review Text */}
              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">Testimonial</p>
                {selectedReview.title && (
                  <h4 className="font-bold text-sm text-foreground">{selectedReview.title}</h4>
                )}
                <p className="text-foreground/80 leading-relaxed italic whitespace-pre-wrap">
                  "{selectedReview.comment || 'No review message provided'}"
                </p>
              </div>

              {/* Attached Photos */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-2xs font-semibold text-foreground/50 uppercase tracking-wider">Customer Photos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 rounded-xl border border-border overflow-hidden bg-foreground/5 hover:opacity-80 transition"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-foreground/2 flex items-center justify-between">
              <button
                onClick={() => handleToggleApproval(selectedReview)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                  selectedReview.isApproved
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedReview.isApproved ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {selectedReview.isApproved ? 'Unpublish from Website' : 'Approve & Publish Live'}
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2 rounded-xl bg-[#57c5cc] hover:bg-[#46b3ba] text-white text-xs font-semibold shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete Customer Review</h3>
              <p className="text-xs text-foreground/60">
                Are you sure you want to remove this {reviewToDelete.rating}-star review? This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setReviewToDelete(null)}
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