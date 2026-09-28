"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Star,
  Check,
  X,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  User,
  Clock,
  Filter,
  CheckCheck,
  Search,
  Maximize2,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import AdminPagination from "@/components/admin/AdminPagination"

interface ReviewMedia {
  id: string
  url: string
}

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  isApproved: boolean
  isFeatured?: boolean
  createdAt: string
  user: { name?: string; email: string }
  product: { name: string; slug: string; images?: { url: string }[] }
  media?: ReviewMedia[]
}

interface ReviewsClientProps {
  initialReviews: Review[]
  stats: {
    total: number
    pending: number
    approved: number
    averageRating: number
    ratingBreakdown: Record<number, number>
    withPhotosCount: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentFilter: string
}

export default function ReviewsClient({
  initialReviews,
  stats,
  pagination,
  currentSearch,
  currentFilter,
}: ReviewsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [searchQuery, setSearchQuery] = useState(currentSearch)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null)

  useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  useEffect(() => {
    setSearchQuery(currentSearch)
  }, [currentSearch])

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter && filter !== "all") {
      params.set("filter", filter)
    } else {
      params.delete("filter")
    }
    params.set("page", "1")
    router.push(`/admin/reviews?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/reviews?${params.toString()}`, { scroll: false })
  }

  // Moderation action
  async function act(id: string, action: "approve" | "reject" | "delete") {
    setLoadingId(id)
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Delete failed")
        setReviews((prev) => prev.filter((r) => r.id !== id))
        toast.success("Review deleted permanently")
      } else {
        const isApproved = action === "approve"
        const res = await fetch(`/api/admin/reviews/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isApproved }),
        })
        if (!res.ok) throw new Error("Update failed")
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved } : r))
        )
        toast.success(isApproved ? "Review approved & visible in store" : "Review hidden from store")
      }
      router.refresh()
    } catch {
      toast.error("Operation failed. Please try again.")
    } finally {
      setLoadingId(null)
    }
  }

  // Batch approve all pending on page
  async function approveAllPending() {
    const pendingIds = reviews.filter((r) => !r.isApproved).map((r) => r.id)
    if (pendingIds.length === 0) return

    setBatchLoading(true)
    try {
      await Promise.all(
        pendingIds.map((id) =>
          fetch(`/api/admin/reviews/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isApproved: true }),
          })
        )
      )
      setReviews((prev) => prev.map((r) => ({ ...r, isApproved: true })))
      toast.success(`Approved ${pendingIds.length} pending reviews!`)
      router.refresh()
    } catch {
      toast.error("Some reviews failed to approve")
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold text-zinc-900">{stats.averageRating.toFixed(1)}</h3>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.round(stats.averageRating) ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                    )}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-zinc-500 mt-1 block">From {stats.total.toLocaleString()} total reviews</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => handleFilterChange(currentFilter === "pending" ? "all" : "pending")}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between",
            currentFilter === "pending"
              ? "border-amber-400 bg-amber-50/50"
              : "border-zinc-200/90 bg-white hover:border-amber-300"
          )}
        >
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Moderation</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats.pending.toLocaleString()}</h3>
            <span className="text-xs text-amber-700/80 font-medium mt-1 block">Requires manual approval</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => handleFilterChange(currentFilter === "approved" ? "all" : "approved")}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between",
            currentFilter === "approved"
              ? "border-emerald-400 bg-emerald-50/50"
              : "border-zinc-200/90 bg-white hover:border-emerald-300"
          )}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved Live</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.approved.toLocaleString()}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Visible to storefront buyers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => handleFilterChange(currentFilter === "photos" ? "all" : "photos")}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between",
            currentFilter === "photos"
              ? "border-blue-400 bg-blue-50/50"
              : "border-zinc-200/90 bg-white hover:border-blue-300"
          )}
        >
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Customer Photos</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.withPhotosCount.toLocaleString()}</h3>
            <span className="text-xs text-blue-700/80 font-medium mt-1 block">Reviews with image proof</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search by buyer, email, product, review content…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 h-9 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "approved", label: `Approved (${stats.approved})` },
            { key: "photos", label: `With Photos (${stats.withPhotosCount})` },
            { key: "all", label: `All Reviews (${stats.total})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                currentFilter === tab.key || (!currentFilter && tab.key === "pending")
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}

          {stats.pending > 0 && currentFilter === "pending" && (
            <Button
              size="sm"
              onClick={approveAllPending}
              disabled={batchLoading}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shrink-0 gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Approve All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {reviews.length === 0 ? (
          <div className="p-12 text-center bg-white border border-zinc-200/90 rounded-2xl shadow-2xs">
            <Package className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-700">No reviews found matching your filter</p>
            <p className="text-xs text-zinc-500 mt-0.5">Try clearing filters or search terms.</p>
          </div>
        ) : (
          reviews.map((r) => {
            const isLoading = loadingId === r.id

            return (
              <div
                key={r.id}
                className={cn(
                  "p-5 rounded-2xl border transition-all bg-white shadow-2xs space-y-3.5",
                  !r.isApproved ? "border-amber-200/80 bg-amber-50/20" : "border-zinc-200/90"
                )}
              >
                {/* Top Row: User & Rating & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                      {(r.user?.name || r.user?.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-xs">
                          {r.user?.name || "Verified Customer"}
                        </span>
                        <span className="text-[11px] text-zinc-500">{r.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-zinc-400">•</span>
                        <span className="text-[11px] text-zinc-500">
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        r.isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                      )}
                    >
                      {r.isApproved ? "Approved Live" : "Pending Review"}
                    </span>

                    {!r.isApproved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => act(r.id, "approve")}
                        className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg gap-1 shadow-2xs border-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => act(r.id, "reject")}
                        className="h-8 px-2.5 text-xs bg-white text-zinc-700 hover:bg-zinc-100 rounded-lg gap-1 border-zinc-200"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => act(r.id, "delete")}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  {r.title && <h4 className="font-bold text-zinc-900 text-xs mb-1">{r.title}</h4>}
                  <p className="text-xs text-zinc-700 leading-relaxed">{r.content}</p>
                </div>

                {/* Media attachments */}
                {r.media && r.media.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-zinc-500 mb-1.5 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-zinc-400" />
                      <span>Customer Uploaded Media ({r.media.length})</span>
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {r.media.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActivePhotoModal(m.url)}
                          className="relative group rounded-xl overflow-hidden border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-all cursor-zoom-in"
                        >
                          <img
                            src={m.url}
                            alt="Customer review photo"
                            className="w-16 h-16 object-cover bg-zinc-100"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Reference Footer */}
                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Reviewed Product:</span>
                    <Link
                      href={`/shop/${r.product.slug}`}
                      target="_blank"
                      className="font-bold text-zinc-900 hover:text-amber-600 transition-colors flex items-center gap-1 text-xs"
                    >
                      <span>{r.product.name}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          basePath="/admin/reviews"
        />
      </div>

      {/* Photo Zoom Lightbox Modal */}
      {activePhotoModal && (
        <Dialog open={Boolean(activePhotoModal)} onOpenChange={() => setActivePhotoModal(null)}>
          <DialogContent className="sm:max-w-2xl p-2 bg-black border border-zinc-800 text-white rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={activePhotoModal}
              alt="Customer review photo preview"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
