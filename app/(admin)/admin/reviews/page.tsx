import prisma from "@/lib/prisma"
import ReviewsClient from "./ReviewsClient"

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
      media: true,
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
      <ReviewsClient initialReviews={reviews as any} />
    </div>
  )
}
