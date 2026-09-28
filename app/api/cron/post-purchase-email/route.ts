import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendReviewRequest } from "@/lib/email"

// Called by Supabase pg_cron (Vercel Cron was removed from vercel.json to
// avoid duplicate/triple firing — see abandoned-cart route for the same note)
// Sends "How was your order?" emails 3 days after delivery
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Find orders delivered 3-7 days ago that haven't had a post-purchase email
  // We use statusLogs to find DELIVERED timestamp
  const deliveredOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      updatedAt: { gte: sevenDaysAgo, lte: threeDaysAgo },
    },
    include: {
      user: { select: { email: true, name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
    take: 50,
  })

  if (deliveredOrders.length === 0) {
    return NextResponse.json({ sent: 0, message: "Nothing to send" })
  }

  let sent = 0
  for (const order of deliveredOrders) {
    const email = order.user?.email ?? order.guestEmail
    if (!email) continue

    const productName = order.items[0]?.product?.name ?? "your order"
    const customerName = order.user?.name ?? "there"

    await sendReviewRequest({
      to: email,
      customerName,
      orderNumber: order.orderNumber,
      productName,
    }).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent })
}
