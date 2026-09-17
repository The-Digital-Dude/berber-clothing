import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const unanswered = req.nextUrl.searchParams.get("unanswered") === "true"
  const qas = await prisma.reviewQA.findMany({
    where: unanswered ? { answer: null } : undefined,
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return NextResponse.json(qas)
}
