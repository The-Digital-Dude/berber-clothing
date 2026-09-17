"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Check, X, Trash2 } from "lucide-react"

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  isApproved: boolean
  createdAt: string
  user: { name?: string; email: string }
  product: { name: string; slug: string }
}

interface Props {
  initialReviews: Review[]
}

export default function ReviewsClient({ initialReviews }: Props) {
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending")
  const [reviews, setReviews] = useState(initialReviews)
  const [loading, setLoading] = useState<string | null>(null)

  async function act(id: string, action: string) {
    setLoading(id)
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setReviews((prev) =>
      action === "delete" ? prev.filter((r) => r.id !== id) : prev.map((r) => r.id === id ? { ...r, isApproved: action === "approve" } : r)
    )
    setLoading(null)
  }

  async function fetchByFilter(f: "pending" | "approved" | "all") {
    setFilter(f)
    const res = await fetch(`/api/admin/reviews?status=${f}`)
    const data = await res.json()
    setReviews(data.reviews)
  }

  const starColor = (n: number) => n >= 4 ? "text-green-500" : n >= 3 ? "text-yellow-500" : "text-red-500"

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => fetchByFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {reviews.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No reviews found</p>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`flex gap-0.5 ${starColor(r.rating)}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4" fill={i < r.rating ? "currentColor" : "none"} />
                    ))}
                  </span>
                  <Badge variant={r.isApproved ? "default" : "secondary"}>
                    {r.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                {r.title && <p className="font-medium">{r.title}</p>}
                {r.content && <p className="text-sm text-muted-foreground">{r.content}</p>}
                <p className="text-xs text-muted-foreground">
                  {r.user.name ?? r.user.email} · {r.product.name} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                {!r.isApproved && (
                  <Button size="sm" variant="outline" disabled={loading === r.id} onClick={() => act(r.id, "approve")}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                {r.isApproved && (
                  <Button size="sm" variant="outline" disabled={loading === r.id} onClick={() => act(r.id, "reject")}>
                    <X className="h-4 w-4 text-yellow-600" />
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={loading === r.id} onClick={() => act(r.id, "delete")}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
