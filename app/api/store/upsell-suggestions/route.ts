import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      images: { take: 1 },
      variants: { where: { stock: { gt: 0 } }, take: 1 },
    },
  })
  return NextResponse.json({ products })
}
