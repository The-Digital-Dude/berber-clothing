import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { processReferral } from "@/lib/referral"
import { awardPoints } from "@/lib/loyalty"
import { validateSslPayment } from "@/lib/sslcommerz"

export async function POST(req: Request) {
  const formData = await req.formData()
  const valId = formData.get("val_id") as string
  const orderId = formData.get("value_a") as string
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || !(await validateSslPayment(valId, order))) return NextResponse.redirect(new URL("/checkout?ssl=fail", req.url))

  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    })

    // Award loyalty points
    if (order.userId) {
      await awardPoints(order.userId, orderId, Number(order.total)).catch(() => {})
    }

    // Process referral if applicable
    if (order.userId) {
      const user = await prisma.user.findUnique({ where: { id: order.userId } })
      if (user?.referredByCode) {
        await processReferral(order.userId, user.referredByCode, orderId).catch(() => {})
      }
    }
  }

  return NextResponse.redirect(new URL(`/order/${orderId}?payment=success`, req.url))
}
