import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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

  const storeId = process.env.SSL_STORE_ID
  const storePassword = process.env.SSL_STORE_PASSWORD
  const mode = process.env.SSL_MODE || "sandbox"
  const apiUrl =
    mode === "live"
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"

  const base = APP_URL
  const params = new URLSearchParams({
    store_id: storeId!,
    store_passwd: storePassword!,
    total_amount: order.total.toString(),
    currency: "BDT",
    tran_id: orderId,
    success_url: `${base}/api/payments/sslcommerz/success`,
    fail_url: `${base}/api/payments/sslcommerz/fail`,
    cancel_url: `${base}/api/payments/sslcommerz/cancel`,
    ipn_url: `${base}/api/payments/sslcommerz/ipn`,
    cus_name: order.shippingName,
    cus_email: order.user?.email ?? "guest@example.com",
    cus_phone: order.shippingPhone,
    cus_add1: order.shippingAddress,
    cus_city: order.shippingCity ?? "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "Courier",
    product_name: `Order ${order.orderNumber}`,
    product_category: "General",
    product_profile: "general",
    value_a: orderId,
  })

  const res = await fetch(apiUrl, { method: "POST", body: params })
  const data = await res.json()

  if (data.status !== "SUCCESS") {
    return NextResponse.json({ error: data.failedreason ?? "SSLCommerz init failed" }, { status: 500 })
  }

  return NextResponse.json({ GatewayPageURL: data.GatewayPageURL })
}
