import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAbandonedCartEmail } from "@/lib/email"

// Called by Vercel Cron every hour: GET /api/cron/abandoned-cart
// Vercel cron config in vercel.json
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const setting = await prisma.setting.findUnique({ where: { key: "abandoned_cart_email_enabled" } })
  if (setting?.value !== "true") return NextResponse.json({ skipped: true })

  const delaySetting = await prisma.setting.findUnique({ where: { key: "abandoned_cart_delay_minutes" } })
  const delayMinutes = Number(delaySetting?.value || 60)
  const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000)

  const carts = await prisma.abandonedCart.findMany({
    where: {
      emailSent: false,
      isRecovered: false,
      updatedAt: { lte: cutoff },
      email: { not: null },
    },
    take: 100,
  })

  let sent = 0
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://drip.fashion"

  for (const cart of carts) {
    try {
      const items = (cart.items as any[]) || []
      if (!items.length || !cart.email) continue

      const cartTotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
      const recoveryUrl = `${siteUrl}/checkout?recover=${cart.sessionId}`

      await sendAbandonedCartEmail({
        to: cart.email,
        customerName: cart.name || "there",
        cartItems: items.map((i: any) => ({
          name: i.name,
          size: i.size || "",
          color: i.color || "",
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
        cartTotal,
        recoveryUrl,
      })

      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { emailSent: true, emailSentAt: new Date() },
      })
      sent++
    } catch {
      // per-cart error — continue with others
    }
  }

  return NextResponse.json({ processed: carts.length, sent })
}
