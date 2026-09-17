import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { email, variantId } = await req.json()
  if (!email || !variantId) return NextResponse.json({ error: "email and variantId required" }, { status: 400 })

  // Check variant is actually out of stock
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 })
  if (variant.stock > 0) return NextResponse.json({ error: "This variant is already in stock" }, { status: 400 })

  await prisma.stockAlert.upsert({
    where: { email_variantId: { email: email.toLowerCase(), variantId } },
    create: { email: email.toLowerCase(), variantId, notified: false },
    update: { notified: false }, // re-activate if previously notified
  })

  return NextResponse.json({ ok: true })
}
