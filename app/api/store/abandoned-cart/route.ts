import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Called by the client when a cart has been idle for a while — stores a snapshot.
export async function POST(req: Request) {
  try {
    const { sessionId, email, phone, name, items, subtotal } = await req.json()
    if (!sessionId || !items?.length) return NextResponse.json({ ok: true })

    const itemsJson = JSON.stringify(items)
    await prisma.abandonedCart.upsert({
      where: { sessionId },
      create: { sessionId, email: email || null, phone: phone || null, name: name || null, items: itemsJson, subtotal },
      update: { email: email || undefined, phone: phone || undefined, name: name || undefined, items: itemsJson, subtotal, updatedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("abandoned-cart upsert failed", err)
    return NextResponse.json({ ok: true })
  }
}
