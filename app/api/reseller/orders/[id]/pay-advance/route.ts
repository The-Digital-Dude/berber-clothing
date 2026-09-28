import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { method = "WALLET", transactionId } = body

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
      return NextResponse.json({ error: "Partner profile not found" }, { status: 403 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order || order.resellerId !== partner.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.advancePaid) {
      return NextResponse.json({ error: "Advance delivery charge is already paid for this order." }, { status: 400 })
    }

    const advanceCharge = Number(order.advanceCharge || 120)

    if (method === "WALLET") {
      const currentBalance = Number(partner.walletBalance || 0)
      if (currentBalance < advanceCharge) {
        return NextResponse.json({
          error: `Insufficient wallet balance (৳${currentBalance.toLocaleString()}). Required: ৳${advanceCharge}.`,
        }, { status: 400 })
      }

      await prisma.affiliate.update({
        where: { id: partner.id },
        data: { walletBalance: { decrement: advanceCharge } },
      })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        advancePaid: true,
        advanceMethod: method,
        advanceTrxId: transactionId || null,
        status: "CONFIRMED",
        paymentStatus: "PARTIALLY_PAID",
      },
    })

    await prisma.orderStatusLog.create({
      data: {
        orderId: id,
        status: "CONFIRMED",
        note: `Advance delivery charge (৳${advanceCharge}) paid via ${method}. Order confirmed.`,
      },
    })

    return NextResponse.json({ ok: true, order: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
