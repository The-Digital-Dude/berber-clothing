import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { event, productId, orderId, metadata, sessionId } = await req.json()
  if (!event) return NextResponse.json({ ok: false }, { status: 400 })

  await prisma.funnelEvent.create({
    data: { event, productId, orderId, sessionId, metadata: metadata ? JSON.stringify(metadata) : undefined },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
