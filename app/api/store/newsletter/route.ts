import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { brevoSubscribe } from "@/lib/brevo"
import { ensureWelcomeCoupon } from "@/lib/welcomeCoupon"
import { sendNewsletterWelcome } from "@/lib/email"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed } = await checkRateLimit(ip, "newsletter")
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const existing = await prisma.marketingSubscriber.findUnique({ where: { email } })
  const alreadySubscribed = !!existing && existing.status !== "unsubscribed"

  // brevoSubscribe both calls the real Brevo API and upserts the
  // MarketingSubscriber row -- the previous code here only did the latter,
  // so subscribers were never actually added to the mailing list.
  await brevoSubscribe(email)

  if (alreadySubscribed) {
    return NextResponse.json({ ok: true, message: "Already subscribed" })
  }

  // First-time subscription (or a returning unsubscribe) — grant the
  // "10% off first order" code the footer promises. The coupon enforces one
  // redemption per customer, so this is safe to email on every fresh signup.
  const couponCode = await ensureWelcomeCoupon()
  sendNewsletterWelcome({ to: email, couponCode }).catch(() => {})

  return NextResponse.json({ ok: true, message: "Subscribed successfully", couponCode })
}
