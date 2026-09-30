import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
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
    console.error("[admin-abandoned-cart] Failed to upsert COMEBACK5 coupon:", err)
    return null
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { cartId } = await req.json()
    if (!cartId) return NextResponse.json({ error: "cartId is required" }, { status: 400 })

    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId },
    })

    if (!cart) return NextResponse.json({ error: "Abandoned cart not found" }, { status: 404 })
    if (!cart.email) return NextResponse.json({ error: "Cart has no email address" }, { status: 400 })

    const items = JSON.parse(cart.items || "[]") as any[]
    if (!items.length) return NextResponse.json({ error: "Cart has no items" }, { status: 400 })

    await ensureComebackCoupon()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"
    const cartTotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)

    await sendAbandonedCartEmail({
      to: cart.email,
      customerName: cart.name || "there",
      cartItems: items,
      cartTotal,
      couponCode: "COMEBACK5",
      discountPercent: 5,
      recoveryUrl: `${siteUrl}/checkout?recover=${cart.sessionId}&coupon=COMEBACK5`,
      note: "Your reserved bag is waiting with an exclusive 5% discount code COMEBACK5 pre-applied at checkout!",
    })

    const updated = await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        email1SentAt: cart.email1SentAt || new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `5% Recovery email sent to ${cart.email}`,
      cart: updated,
    })
  } catch (err: any) {
    console.error("[admin-abandoned-cart] Send error:", err)
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 })
  }
}
