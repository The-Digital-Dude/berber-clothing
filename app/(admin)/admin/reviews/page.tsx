import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import ReviewsClient from "./ReviewsClient"
import { serialize } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string; rating?: string; page?: string; limit?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const filter = (params.filter || "pending").trim()
  const rating = params.rating ? parseInt(params.rating, 10) : null
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { product: { name: { contains: search, mode: "insensitive" } } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filter === "pending"
      ? { isApproved: false }
      : filter === "approved"
      ? { isApproved: true }
      : filter === "photos"
      ? { media: { some: {} } }
      : {}),
    ...(rating ? { rating } : {}),
  }

  const [
    reviews,
    totalFiltered,
    totalCount,
    pendingCount,
    approvedCount,
    withPhotosCount,
    ratingGroup,
  ] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
        media: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.review.count(),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.count({ where: { media: { some: {} } } }),
    prisma.review.groupBy({
      by: ["rating"],
      _count: { _all: true },
    }),
  ])

  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let totalRatingSum = 0
  let totalRatingsSampled = 0
  for (const group of ratingGroup) {
    if (group.rating >= 1 && group.rating <= 5) {
      ratingBreakdown[group.rating] = group._count._all
      totalRatingSum += group.rating * group._count._all
      totalRatingsSampled += group._count._all
    }
  }

  const averageRating = totalRatingsSampled > 0 ? totalRatingSum / totalRatingsSampled : 5.0
  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Customer Reviews & Ratings
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalCount.toLocaleString()} total
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
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          averageRating,
          ratingBreakdown,
          withPhotosCount,
        }}
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  )
}
