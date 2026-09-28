import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ partner: null })
    }

    const partner = await prisma.affiliate.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ userId: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      include: {
        coupon: { select: { id: true, code: true, type: true, value: true } },
        _count: {
          select: {
            clicks: true,
            conversions: true,
            resellerOrders: true,
            payoutRequests: true,
          },
        },
        conversions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            order: { select: { orderNumber: true, status: true, total: true, createdAt: true } },
          },
        },
        resellerOrders: {
          orderBy: { createdAt: "desc" },
          take: 15,
          include: {
            items: { include: { product: { select: { name: true, images: true } } } },
          },
        },
        payoutRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ partner: null })
    }

    return NextResponse.json({ partner: JSON.parse(JSON.stringify(partner)) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
