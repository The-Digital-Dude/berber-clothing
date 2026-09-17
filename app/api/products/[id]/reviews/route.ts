import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params

  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { 
        user: { select: { name: true } },
        _count: { select: { helpfulVotes: true } },
        helpfulVotes: { select: { userId: true } }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  return NextResponse.json({
    reviews,
    average: agg._avg.rating ?? 0,
    count: agg._count.rating,
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to write a review" }, { status: 401 })
  }

  const { id: productId } = await params
  const { rating, comment, photos } = await req.json()

  const numRating = Number(rating)
  if (!numRating || numRating < 1 || numRating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  // Verify the user actually purchased and received this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.user.id, status: "DELIVERED" },
    },
  })

  if (!purchased) {
    return NextResponse.json(
      { error: "You can only review products you've purchased and received" },
      { status: 403 }
    )
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: {
      userId: session.user.id,
      productId,
      rating: numRating,
      comment: comment?.trim() || null,
      isApproved: true,
    },
    update: {
      rating: numRating,
      comment: comment?.trim() || null,
    },
  })

  // Save uploaded photos as ReviewMedia
  if (Array.isArray(photos) && photos.length > 0) {
    const validPhotos = photos.filter((u: any) => typeof u === "string" && u.startsWith("http")).slice(0, 4)
    if (validPhotos.length > 0) {
      // Delete existing media for this review first (upsert may re-use the review)
      await prisma.reviewMedia.deleteMany({ where: { reviewId: review.id } }).catch(() => {})
      await prisma.reviewMedia.createMany({
        data: validPhotos.map((url: string) => ({
          reviewId: review.id,
          url,
          type: "IMAGE",
          reviewerName: session.user.name || "Customer",
        })),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ review }, { status: 201 })
}
