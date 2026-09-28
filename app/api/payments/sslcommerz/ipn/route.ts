import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { processReferral } from "@/lib/referral"
import { awardPoints } from "@/lib/loyalty"

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
    return NextResponse.json({ ok: false })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.paymentStatus === "PAID") return NextResponse.json({ ok: true })

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  })

  if (order.userId) {
    await awardPoints(order.userId, orderId, Number(order.total)).catch(() => {})
  }

  if (order.userId) {
    const user = await prisma.user.findUnique({ where: { id: order.userId } })
    if (user?.referredByCode) {
      await processReferral(order.userId, user.referredByCode, orderId).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
