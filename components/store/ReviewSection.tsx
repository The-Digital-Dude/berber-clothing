"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useSession"
import { Star, Loader2, ThumbsUp, Camera, X } from "lucide-react"
import { toast } from "sonner"

type Review = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string | null }
  _count?: { helpfulVotes: number }
  helpfulVotes?: { userId: string }[]
}

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-berber-gold text-berber-gold" : "text-berber-border"}
        />
      ))}
    </div>
  )
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const load = () => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || [])
        setAverage(d.average || 0)
        setCount(d.count || 0)
      })
      .finally(() => setLoading(false))
  }

  async function toggleHelpful(reviewId: string) {
    if (!session?.user) {
      toast.error("Please sign in to vote")
      return
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" })
      if (res.ok) {
        load()
      } else {
        toast.error("Failed to register vote")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  useEffect(() => {
    load()
  }, [productId])

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return }
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.url) setPhotos((p) => [...p, d.url])
    } catch { toast.error("Photo upload failed") }
    finally { setUploadingPhoto(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) {
      toast.error("Please select a star rating")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, photos }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review")
      } else {
        toast.success("Thanks for your review!")
        setShowForm(false)
        setRating(0)
        setComment("")
        setPhotos([])
        load()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <StarRow value={average} size={20} />
        <span className="text-sm text-berber-text-muted">
          {count > 0 ? `${average.toFixed(1)} out of 5 (${count} review${count === 1 ? "" : "s"})` : "No reviews yet"}
        </span>
      </div>

      {session?.user ? (
        showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-berber-border rounded-xl bg-berber-muted/30">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star
                    width={24}
                    height={24}
                    className={n <= rating ? "fill-berber-gold text-berber-gold" : "text-berber-border"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product (optional)"
              rows={3}
              className="w-full bg-white border border-berber-border rounded-lg px-3 py-2 text-sm outline-none focus:border-berber-gold resize-none"
            />
            {/* Photo upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {photos.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-berber-border">
                    <img src={url} alt="Review photo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="w-16 h-16 border-2 border-dashed border-berber-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-berber-gold transition-colors text-berber-text-muted hover:text-berber-gold">
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <span className="text-[9px] mt-0.5">Add photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-berber-text-muted">Add up to 4 photos (optional)</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-berber-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-berber-gold transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-berber-text-muted hover:text-berber-black"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold uppercase tracking-widest text-berber-gold hover:underline"
          >
            Write a Review
          </button>
        )
      ) : (
        <p className="text-xs text-berber-text-muted">
          <a href="/login" className="underline hover:text-berber-gold">Sign in</a> to write a review.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-berber-text-muted">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-berber-text-muted">Be the first to review this product.</p>
      ) : (
        <div className="space-y-4 pt-2">
          {reviews.map((r) => (
            <div key={r.id} className="border-t border-berber-border pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-berber-black">{r.user.name || "Anonymous"}</span>
                <span className="text-xs text-berber-text-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-BD")}
                </span>
              </div>
              <StarRow value={r.rating} />
              {r.comment && <p className="text-sm text-berber-text-muted mt-2">{r.comment}</p>}
              <div className="mt-3 flex items-center">
                <button
                  onClick={() => toggleHelpful(r.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                    r.helpfulVotes?.some((v) => v.userId === session?.user?.id)
                      ? "text-berber-gold"
                      : "text-berber-text-muted hover:text-berber-black"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful ({r._count?.helpfulVotes || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
