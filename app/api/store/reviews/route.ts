import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: {
      user: { select: { name: true, image: true } },
      media: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const body = await req.json()
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: body.productId } },
  })
  if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 })
  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      productId: body.productId,
      rating: Number(body.rating),
      comment: body.comment || null,
    },
  })
  // add media if provided
  if (body.mediaUrls?.length) {
    await prisma.reviewMedia.createMany({
      data: body.mediaUrls.map((url: string) => ({
        reviewId: review.id,
        url,
        type: url.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE",
      })),
    })
  }
  return NextResponse.json(review)
}
