import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUddoktaPayConfig, verifyPayment } from "@/lib/uddoktapay"
import { processReferral } from "@/lib/referral"
import { awardPoints } from "@/lib/loyalty"

export async function GET(req: NextRequest) {
  const invoiceId = req.nextUrl.searchParams.get("invoice_id") ?? ""
  const orderId = req.nextUrl.searchParams.get("orderId") ?? ""

  const config = await getUddoktaPayConfig()
  const verification = await verifyPayment(invoiceId, config)

  if (verification.status !== "COMPLETED") {
    return NextResponse.redirect(new URL("/checkout?uddokta=fail", req.url))
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.redirect(new URL("/checkout?uddokta=fail", req.url))

  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    })
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: "COMPLETED", transactionId: invoiceId },
    }).catch(() => {})

    if (order.userId) {
      await awardPoints(order.userId, orderId, Number(order.total)).catch(() => {})
    }

    if (order.userId) {
      const user = await prisma.user.findUnique({ where: { id: order.userId } })
      if (user?.referredByCode) {
        await processReferral(order.userId, user.referredByCode, orderId).catch(() => {})
      }
    }
  }

  return NextResponse.redirect(new URL(`/order/${orderId}?payment=success`, req.url))
}
