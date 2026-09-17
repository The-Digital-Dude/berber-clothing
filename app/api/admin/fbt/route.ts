import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const productId = req.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  const pairs = await prisma.frequentlyBoughtTogether.findMany({
    where: { primaryId: productId },
    include: { secondary: { include: { images: { take: 1 } } } },
    orderBy: { score: "desc" },
  })

  return NextResponse.json({ pairs })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { primaryId, secondaryId, score } = await req.json()
  if (!primaryId || !secondaryId) return NextResponse.json({ error: "primaryId and secondaryId required" }, { status: 400 })

  const pair = await prisma.frequentlyBoughtTogether.upsert({
    where: { primaryId_secondaryId: { primaryId, secondaryId } },
    create: { primaryId, secondaryId, score: score ?? 1 },
    update: { score: score ?? 1 },
  })

  return NextResponse.json({ pair })
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await req.json()
  await prisma.frequentlyBoughtTogether.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
