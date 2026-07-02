import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(bundles)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const bundle = await prisma.bundle.create({
    data: {
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
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
    include: { items: true },
  })
  return NextResponse.json(bundle)
}
