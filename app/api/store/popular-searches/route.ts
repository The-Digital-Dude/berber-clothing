import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const [categories, topProducts] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, showOnNavbar: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        select: { name: true },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 3,
      }),
    ])

    const terms = [
      ...categories.map((c) => c.name),
      ...topProducts.map((p) => p.productName),
    ]

    return NextResponse.json({ terms })
  } catch {
    return NextResponse.json({ terms: [] })
  }
}
