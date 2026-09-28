import prisma from "@/lib/prisma"
import ReviewsClient from "./ReviewsClient"
import { serialize } from "@/lib/utils"

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
      media: true,
    },
  })

  // Compute distribution & average rating
  const total = reviews.length
  let totalRatingSum = 0
  let pendingCount = 0
  let approvedCount = 0
  let withPhotosCount = 0
  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  reviews.forEach((r) => {
    totalRatingSum += r.rating
    if (!r.isApproved) pendingCount++
    else approvedCount++
    if (r.media && r.media.length > 0) withPhotosCount++
    if (r.rating >= 1 && r.rating <= 5) {
      ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1
    }
  })

  const averageRating = total > 0 ? totalRatingSum / total : 5.0

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Customer Reviews & Ratings
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {total} reviews
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Moderate customer feedback, verify buyer badges, inspect uploaded photos, and approve reviews for storefront display
          </p>
        </div>
      </div>

      <ReviewsClient
        initialReviews={serialize(reviews) as any}
        stats={{
          total,
          pending: pendingCount,
          approved: approvedCount,
          averageRating,
          ratingBreakdown,
          withPhotosCount,
        }}
      />
    </div>
  )
}
