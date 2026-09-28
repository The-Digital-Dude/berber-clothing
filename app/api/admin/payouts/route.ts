import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const payouts = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            shopName: true,
            partnerType: true,
            code: true,
            walletBalance: true,
          },
        },
      },
    })

    return NextResponse.json(JSON.parse(JSON.stringify(payouts)))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
