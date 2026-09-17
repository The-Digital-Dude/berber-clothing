import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUddoktaPayConfig, verifyPayment } from "@/lib/uddoktapay"
import { processReferral } from "@/lib/referral"

export async function POST(req: NextRequest) {
  const config = await getUddoktaPayConfig()
  const apiKey = req.headers.get("RT-UDDOKTAPAY-API-KEY")
  if (apiKey !== config.apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const invoiceId = body.invoice_id
  const orderId = body.metadata?.order_id

  if (!invoiceId || !orderId) return NextResponse.json({ ok: false }, { status: 400 })

  const verification = await verifyPayment(invoiceId, config)
  if (verification.status !== "COMPLETED") return NextResponse.json({ ok: false })

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.paymentStatus === "PAID") return NextResponse.json({ ok: true })

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  })
  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: "COMPLETED", transactionId: invoiceId },
  }).catch(() => {})

  const points = Math.floor(Number(order.total) / 10)
  if (points > 0 && order.userId) {
    await prisma.loyaltyPoint.create({
      data: { userId: order.userId, points, type: "PURCHASE", description: `Order ${order.orderNumber}`, orderId },
    }).catch(() => {})
  }

  if (order.userId) {
    const user = await prisma.user.findUnique({ where: { id: order.userId } })
    if (user?.referredByCode) {
      await processReferral(order.userId, user.referredByCode, orderId).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
