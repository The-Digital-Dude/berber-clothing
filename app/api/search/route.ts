import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ products: [] })

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] })
  }
}
