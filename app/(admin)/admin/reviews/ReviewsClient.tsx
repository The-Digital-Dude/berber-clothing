"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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

export default function ReviewsClient({
  initialReviews,
  stats,
}: {
  initialReviews: Review[]
  stats: {
    total: number
    pending: number
    approved: number
    averageRating: number
    ratingBreakdown: Record<number, number>
    withPhotosCount: number
  }
}) {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [filter, setFilter] = useState<"pending" | "approved" | "photos" | "all">("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null)

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    // Status filter
    if (filter === "pending" && r.isApproved) return false
    if (filter === "approved" && !r.isApproved) return false
    if (filter === "photos" && (!r.media || r.media.length === 0)) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (r.user?.name || "").toLowerCase().includes(q)
      const matchEmail = (r.user?.email || "").toLowerCase().includes(q)
      const matchProduct = (r.product?.name || "").toLowerCase().includes(q)
      const matchContent = (r.content || "").toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchProduct && !matchContent) return false
    }

    return true
  })

  // Moderation action
  async function act(id: string, action: "approve" | "reject" | "delete") {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        if (action === "delete") {
          setReviews((prev) => prev.filter((r) => r.id !== id))
          toast.success("Review deleted")
        } else {
          setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, isApproved: action === "approve" } : r))
          )
          toast.success(`Review ${action === "approve" ? "approved & live" : "rejected / hidden"}`)
        }
        router.refresh()
      } else {
        toast.error("Failed to update review")
      }
    } catch {
      toast.error("Error updating review")
    } finally {
      setLoadingId(null)
    }
  }

  // Batch approve pending
  async function batchApprovePending() {
    const pendingIds = reviews.filter((r) => !r.isApproved).map((r) => r.id)
    if (pendingIds.length === 0) {
      toast.info("No pending reviews to approve.")
      return
    }

    setBatchLoading(true)
    try {
      await Promise.all(
        pendingIds.map((id) =>
          fetch(`/api/admin/reviews/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve" }),
          })
        )
      )
      setReviews((prev) => prev.map((r) => ({ ...r, isApproved: true })))
      toast.success(`Approved ${pendingIds.length} pending reviews!`)
      router.refresh()
    } catch {
      toast.error("Failed to approve batch reviews")
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analytics & Star Distribution Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Overall Score Card: 4 cols */}
        <div className="md:col-span-4 p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Customer Rating Score
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {stats.total} total reviews
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-4xl font-black text-zinc-900 font-mono">
                {stats.averageRating.toFixed(1)}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < Math.round(stats.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-200"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 font-medium">Out of 5.0 stars</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Pending Moderation:</span>
            <span
              className={cn(
                "font-mono font-bold px-2 py-0.5 rounded-full",
                stats.pending > 0
                  ? "bg-amber-100 text-amber-800 animate-pulse"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {stats.pending} pending
            </span>
          </div>
        </div>

        {/* 5-Star Distribution Breakdown: 8 cols */}
        <div className="md:col-span-8 p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Rating Distribution Breakdown
            </h3>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>{stats.withPhotosCount} reviews with customer photos</span>
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.ratingBreakdown[stars] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold font-mono text-zinc-700 flex items-center gap-1">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        stars >= 4
                          ? "bg-emerald-500"
                          : stars === 3
                          ? "bg-amber-400"
                          : "bg-rose-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-zinc-400 text-[11px]">
                    {count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer",
              filter === "pending"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70"
            )}
          >
            <span>Pending Review</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                filter === "pending" ? "bg-zinc-700 text-white" : "bg-zinc-200 text-zinc-700"
              )}
            >
              {reviews.filter((r) => !r.isApproved).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer",
              filter === "approved"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70"
            )}
          >
            <span>Approved & Live</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                filter === "approved" ? "bg-zinc-700 text-white" : "bg-zinc-200 text-zinc-700"
              )}
            >
              {reviews.filter((r) => r.isApproved).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("photos")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer",
              filter === "photos"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70"
            )}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Photo Reviews</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                filter === "photos" ? "bg-zinc-700 text-white" : "bg-zinc-200 text-zinc-700"
              )}
            >
              {reviews.filter((r) => r.media && r.media.length > 0).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer",
              filter === "all"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70"
            )}
          >
            <span>All ({reviews.length})</span>
          </button>
        </div>

        {/* Right Search & Batch Approve */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer or product…"
              className="h-8.5 pl-8 text-xs rounded-xl border-zinc-200 bg-zinc-50/50 shadow-2xs"
            />
          </div>

          {filter === "pending" && reviews.some((r) => !r.isApproved) && (
            <button
              type="button"
              onClick={batchApprovePending}
              disabled={batchLoading}
              className="h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{batchLoading ? "Approving…" : "Approve All Pending"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Cards Feed */}
      <div className="space-y-3.5">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <Star className="w-6 h-6" />
            </div>
            <p className="font-bold text-zinc-800 text-sm">No reviews match your criteria</p>
            <p className="text-xs text-zinc-400">Try changing the status tab or clearing your search query.</p>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isPending = !r.isApproved
            const hasMedia = r.media && r.media.length > 0

            return (
              <div
                key={r.id}
                className={cn(
                  "p-5 rounded-2xl border bg-white shadow-2xs transition-all space-y-3.5",
                  isPending ? "border-amber-200/90 bg-amber-50/20" : "border-zinc-200/80"
                )}
              >
                {/* Header: User + Rating + Status + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0">
                      {r.user.name ? r.user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-zinc-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-xs">{r.user.name || "Customer"}</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified Buyer
                        </span>
                        <span className="text-[11px] text-zinc-400">· {r.user.email}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Submitted {new Date(r.createdAt).toLocaleDateString()} at {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Moderation Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        r.isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {r.isApproved ? "Approved & Live" : "Pending Review"}
                    </span>

                    {!r.isApproved ? (
                      <button
                        type="button"
                        onClick={() => act(r.id, "approve")}
                        disabled={loadingId === r.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Approve Review"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => act(r.id, "reject")}
                        disabled={loadingId === r.id}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Reject & Hide Review"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => act(r.id, "delete")}
                      disabled={loadingId === r.id}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rating Stars + Title & Body */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-mono font-bold text-xs text-zinc-800">{r.rating}.0</span>
                    {r.title && <span className="font-bold text-zinc-900 text-xs">— {r.title}</span>}
                  </div>

                  {r.content && (
                    <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                      "{r.content}"
                    </p>
                  )}
                </div>

                {/* Customer Uploaded Photo Gallery */}
                {hasMedia && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-zinc-400" />
                      <span>Customer Uploaded Media ({r.media!.length})</span>
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {r.media!.map((m) => (
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
