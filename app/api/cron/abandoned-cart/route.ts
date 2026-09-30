import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAbandonedCartEmail } from "@/lib/email"

async function ensureComebackCoupon() {
  try {
    return await prisma.coupon.upsert({
      where: { code: "COMEBACK5" },
      update: { isActive: true, value: 5, type: "PERCENTAGE" },
      create: {
        code: "COMEBACK5",
        type: "PERCENTAGE",
        value: 5,
        isActive: true,
      },
    })
  } catch (err) {
    console.error("[abandoned-cart] Failed to upsert COMEBACK5 coupon:", err)
    return null
  }
}

// Called hourly by Supabase pg_cron: GET /api/cron/abandoned-cart
// Sends email 1 at 1h, email 2 at 24h (with 5% COMEBACK5 discount voucher)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const setting = await prisma.setting.findUnique({ where: { key: "abandoned_cart_email_enabled" } })
  if (setting?.value !== "true") return NextResponse.json({ skipped: true })

  // Ensure 5% discount coupon exists in the database
  await ensureComebackCoupon()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"
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
        couponCode: "COMEBACK5",
        discountPercent: 5,
        recoveryUrl: `${siteUrl}/checkout?recover=${cart.sessionId}&coupon=COMEBACK5`,
        note: "Complete your order now and enjoy an exclusive 5% discount with code COMEBACK5.",
      })
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { email1SentAt: new Date(), emailSent: true, emailSentAt: new Date() },
      })
      sent1++
    } catch (err) {
      console.error("[abandoned-cart] Failed to send email 1:", err)
    }
  }

  // ── Email 2: after 24 hours (with discount coupon reminder) ──────────────
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

  let sent2 = 0
  for (const cart of email2Carts) {
    try {
      const items = JSON.parse(cart.items || "[]") as any[]
      if (!items.length || !cart.email) continue
      const cartTotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)

      await sendAbandonedCartEmail({
        to: cart.email,
        customerName: cart.name || "there",
        cartItems: items,
        cartTotal,
        couponCode: "COMEBACK5",
        discountPercent: 5,
        recoveryUrl: `${siteUrl}/checkout?recover=${cart.sessionId}&coupon=COMEBACK5`,
        note: "Your reserved bag won't stay saved for long! Use code COMEBACK5 for 5% off before items sell out.",
      })
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { email2SentAt: new Date() },
      })
      sent2++
    } catch (err) {
      console.error("[abandoned-cart] Failed to send email 2:", err)
    }
  }

  return NextResponse.json({
    email1: { processed: email1Carts.length, sent: sent1 },
    email2: { processed: email2Carts.length, sent: sent2 },
  })
}
