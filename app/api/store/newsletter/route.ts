import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"

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
  if (existing) {
    if (!existing.isActive) {
      await prisma.marketingSubscriber.update({ where: { email }, data: { isActive: true } })
    }
    return NextResponse.json({ ok: true, message: "Already subscribed" })
  }

  await prisma.marketingSubscriber.create({ data: { email, source: "FOOTER_FORM" } })
  return NextResponse.json({ ok: true, message: "Subscribed successfully" })
}
