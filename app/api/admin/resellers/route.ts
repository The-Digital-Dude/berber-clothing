import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const resellers = await prisma.affiliate.findMany({
      where: {
        partnerType: { in: ["RESELLER", "BOTH"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { resellerOrders: true, payoutRequests: true },
        },
        resellerOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            resellerProfit: true,
            advancePaid: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(JSON.parse(JSON.stringify(resellers)))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
