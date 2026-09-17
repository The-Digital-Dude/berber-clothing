import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAbandonedCartEmail } from "@/lib/email"

// Called by Vercel Cron every hour: GET /api/cron/abandoned-cart
// Sends email 1 at 1h, email 2 at 24h (with optional coupon incentive)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const setting = await prisma.setting.findUnique({ where: { key: "abandoned_cart_email_enabled" } })
  if (setting?.value !== "true") return NextResponse.json({ skipped: true })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"
  const now = Date.now()

  // ── Email 1: after 1 hour ────────────────────────────────────────────────
  const email1Cutoff = new Date(now - 60 * 60 * 1000)
  const email1Carts = await prisma.abandonedCart.findMany({
    where: {
      email1SentAt: null,
      isRecovered: false,
      email: { not: null },
      updatedAt: { lte: email1Cutoff },
    },
    take: 100,
  })

  let sent1 = 0
  for (const cart of email1Carts) {
    try {
      const items = JSON.parse(cart.items || "[]") as any[]
      if (!items.length || !cart.email) continue
      const cartTotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
      await sendAbandonedCartEmail({
        to: cart.email,
        customerName: cart.name || "there",
        cartItems: items,
        cartTotal,
        recoveryUrl: `${siteUrl}/checkout?recover=${cart.sessionId}`,
      })
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { email1SentAt: new Date(), emailSent: true, emailSentAt: new Date() },
      })
      sent1++
    } catch {}
  }

  // ── Email 2: after 24 hours (with discount coupon if available) ──────────
  const email2Cutoff = new Date(now - 24 * 60 * 60 * 1000)
  const email2Carts = await prisma.abandonedCart.findMany({
    where: {
      email1SentAt: { not: null },
      email2SentAt: null,
      isRecovered: false,
      email: { not: null },
      updatedAt: { lte: email2Cutoff },
    },
    take: 100,
  })

  // Look for an auto-coupon reserved for abandoned cart recovery
  const recoveryCoupon = await prisma.coupon.findFirst({
    where: { code: { startsWith: "COMEBACK" }, isActive: true },
  }).catch(() => null)

  let sent2 = 0
  for (const cart of email2Carts) {
    try {
      const items = JSON.parse(cart.items || "[]") as any[]
      if (!items.length || !cart.email) continue
      const cartTotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)

      // Build recovery URL — include coupon code if available
      let recoveryUrl = `${siteUrl}/checkout?recover=${cart.sessionId}`
      if (recoveryCoupon) recoveryUrl += `&coupon=${recoveryCoupon.code}`

      // Reuse the same email template; add note about discount
      await sendAbandonedCartEmail({
        to: cart.email,
        customerName: cart.name || "there",
        cartItems: items,
        cartTotal,
        recoveryUrl,
        note: recoveryCoupon
          ? `Use code ${recoveryCoupon.code} for ${recoveryCoupon.type === "PERCENTAGE" ? `${recoveryCoupon.value}% off` : `৳${recoveryCoupon.value} off`} — today only!`
          : "Your items won't stay reserved for long.",
      })
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { email2SentAt: new Date() },
      })
      sent2++
    } catch {}
  }

  return NextResponse.json({ email1: { processed: email1Carts.length, sent: sent1 }, email2: { processed: email2Carts.length, sent: sent2 } })
}
