import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const partner = await prisma.affiliate.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ userId: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
        isActive: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: "No active partner/reseller profile found" }, { status: 403 })
    }

    const discountPct = Number(partner.resellerDiscountPct || 15)

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { stock: { gt: 0 } } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const formatted = products.map((p) => {
      const retailPrice = Number(p.price)
      const wholesaleBasePrice = Math.round(retailPrice * (1 - discountPct / 100))
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        retailPrice,
        wholesaleBasePrice,
        discountPct,
        image: p.images[0]?.url || "/placeholder.jpg",
        category: p.category?.name || "Apparel",
        variants: p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
          price: v.price ? Number(v.price) : retailPrice,
          wholesalePrice: v.price
            ? Math.round(Number(v.price) * (1 - discountPct / 100))
            : wholesaleBasePrice,
        })),
      }
    })

    return NextResponse.json({ products: formatted, discountPct })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
