import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  await prisma.bundleItem.deleteMany({ where: { bundleId: id } })
  const bundle = await prisma.bundle.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: Number(data.price),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : null,
      image: data.image || null,
      type: data.type || "FIXED",
      minItems: data.minItems ? Number(data.minItems) : null,
      maxItems: data.maxItems ? Number(data.maxItems) : null,
      discountPct: data.discountPct ? Number(data.discountPct) : null,
      isActive: data.isActive ?? true,
      items: {
        create: (data.items || []).map((item: { productId: string; quantity: number }, i: number) => ({
          productId: item.productId,
          quantity: item.quantity || 1,
          sortOrder: i,
        })),
      },
    },
  })
  return NextResponse.json(bundle)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.bundle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
