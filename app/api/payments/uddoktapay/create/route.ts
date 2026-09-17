import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUddoktaPayConfig, createCharge } from "@/lib/uddoktapay"
import { APP_URL } from "@/lib/appUrl"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderId } = await req.json()
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const config = await getUddoktaPayConfig()
  const base = APP_URL

  const result = await createCharge(
    {
      full_name: order.shippingName,
      email: order.user?.email ?? "guest@example.com",
      amount: Number(order.total),
      metadata: { order_id: orderId },
      redirect_url: `${base}/api/payments/uddoktapay/callback?orderId=${orderId}`,
      cancel_url: `${base}/checkout?uddokta=cancel`,
      webhook_url: `${base}/api/payments/uddoktapay/webhook`,
    },
    config
  )

  await prisma.payment.upsert({
    where: { orderId },
    create: { orderId, method: "UDDOKTAPAY", status: "PENDING", transactionId: result.invoice_id, amount: order.total },
    update: { transactionId: result.invoice_id, status: "PENDING" },
  }).catch(() => {})

  return NextResponse.json({ payment_url: result.payment_url })
}
