import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Resend } from "resend"

// Called by Vercel Cron (set in vercel.json) or a cron service
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

  if (!process.env.RESEND_API_KEY || deliveredOrders.length === 0) {
    return NextResponse.json({ sent: 0, message: "Nothing to send or Resend not configured" })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@berber.clothing"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

  let sent = 0
  for (const order of deliveredOrders) {
    const email = order.user?.email ?? order.guestEmail
    if (!email) continue

    const productName = order.items[0]?.product?.name ?? "your order"
    const customerName = order.user?.name ?? "there"

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `How was your ${productName}?`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
          <h2 style="margin-bottom:8px">Hi ${customerName}!</h2>
          <p>We hope you're loving your order #${order.orderNumber}.</p>
          <p>Would you mind leaving a quick review? It helps other customers and supports our small team.</p>
          <a href="${siteUrl}/account/orders" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f0e0c;color:#fff;text-decoration:none;border-radius:6px">Leave a Review</a>
          <p style="margin-top:32px;color:#888;font-size:12px">Berber · Made in Bangladesh</p>
        </div>
      `,
    }).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent })
}
