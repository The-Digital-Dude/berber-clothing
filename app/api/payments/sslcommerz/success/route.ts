import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { processReferral } from "@/lib/referral"

export async function POST(req: Request) {
  const formData = await req.formData()
  const valId = formData.get("val_id") as string
  const orderId = formData.get("value_a") as string
  const storeId = process.env.SSL_STORE_ID
  const storePassword = process.env.SSL_STORE_PASSWORD
  const mode = process.env.SSL_MODE || "sandbox"

  const validationUrl =
    mode === "live"
      ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php`
      : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php`

  const valRes = await fetch(
    `${validationUrl}?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&format=json`
  )
  const valData = await valRes.json()

  if (valData.status !== "VALID" && valData.status !== "VALIDATED") {
    return NextResponse.redirect(
      new URL("/checkout?ssl=fail", req.url)
    )
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.redirect(new URL("/checkout?ssl=fail", req.url))

  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    })

    // Award loyalty points
    const points = Math.floor(Number(order.total) / 10)
    if (points > 0 && order.userId) {
      await prisma.loyaltyPoint.create({
        data: { userId: order.userId, points, type: "PURCHASE", description: `Order ${order.orderNumber}`, orderId },
      })
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
