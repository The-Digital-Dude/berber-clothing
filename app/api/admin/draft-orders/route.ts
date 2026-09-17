import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const drafts = await prisma.draftOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(drafts)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { userId, guestEmail, items, subtotal, discount, total, note, expiresAt } = body

  const draft = await prisma.draftOrder.create({
    data: { userId, guestEmail, items: JSON.stringify(items), subtotal, discount, total, note, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
  })
  return NextResponse.json(draft)
}
