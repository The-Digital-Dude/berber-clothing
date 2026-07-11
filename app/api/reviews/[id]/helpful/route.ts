import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to vote." }, { status: 401 })
  }

  const { id: reviewId } = await params

  try {
    const existing = await prisma.reviewHelpfulVote.findFirst({
      where: {
        reviewId,
        userId: session.user.id,
      },
    })

    if (existing) {
      // Toggle off
      await prisma.reviewHelpfulVote.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ status: "removed" })
    } else {
      // Toggle on
      await prisma.reviewHelpfulVote.create({
        data: {
          reviewId,
          userId: session.user.id,
        },
      })
      return NextResponse.json({ status: "added" })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}
