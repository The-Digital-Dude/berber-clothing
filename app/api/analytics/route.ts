import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body

  if (type === "search") {
    const { query, resultsCount, sessionId } = body
    if (!query) return NextResponse.json({ ok: false }, { status: 400 })
    await prisma.searchAnalytic.create({
      data: { query, resultsCount: resultsCount ?? 0, sessionId },
    }).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  const { event, productId, orderId, metadata, sessionId } = body
  if (!event) return NextResponse.json({ ok: false }, { status: 400 })

  await prisma.funnelEvent.create({
    data: { event, productId, orderId, sessionId, metadata: metadata ? JSON.stringify(metadata) : undefined },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
