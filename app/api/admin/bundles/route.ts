import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { isValidFixedSuitBundle } from "@/lib/suitPurchasePolicy"

async function validateBundleItems(data: any) {
  if (data.type && data.type !== "FIXED") return false
  const requestedItems = Array.isArray(data.items) ? data.items : []
  const products = await prisma.product.findMany({
    where: { id: { in: requestedItems.map((item: any) => item.productId) } },
    include: { category: true },
  })
  const byId = new Map(products.map((product) => [product.id, product]))
  if (products.length !== requestedItems.length) return false
  return isValidFixedSuitBundle(requestedItems.map((item: any) => ({
    quantity: Number(item.quantity) || 1,
    product: byId.get(item.productId)!,
  })))
}

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
  if (!(await validateBundleItems(data))) {
    return NextResponse.json({ error: "A bundle must be Blazer + Trouser, with an optional Waistcoat." }, { status: 400 })
  }
  const bundle = await prisma.bundle.create({
    data: {
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description || null,
      price: 0, // display price is computed from individual product prices
      comparePrice: null,
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
