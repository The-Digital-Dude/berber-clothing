import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { reviewId } = await req.json()
  if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 })
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { helpful: { increment: 1 } },
  })
  return NextResponse.json({ helpful: review.helpful })
}
