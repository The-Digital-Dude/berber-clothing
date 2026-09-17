import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const collections = await prisma.smartCollection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  })
  return NextResponse.json({ collections })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { name, slug, description, rules, isActive, sortOrder } = await req.json()
  if (!name || !slug || !rules) {
    return NextResponse.json({ error: "name, slug, rules required" }, { status: 400 })
  }

  const collection = await prisma.smartCollection.create({
    data: { name, slug, description, rules: JSON.stringify(rules), isActive: isActive ?? true, sortOrder: sortOrder ?? 0 },
  })
  return NextResponse.json({ collection })
}
