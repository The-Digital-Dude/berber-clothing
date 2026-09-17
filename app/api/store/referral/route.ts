import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processReferral } from "@/lib/referral"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { referralCode, orderId } = await req.json()
  if (!referralCode || !orderId) {
    return NextResponse.json({ error: "Missing referralCode or orderId" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  await processReferral(session.user.id, referralCode, orderId)
  return NextResponse.json({ ok: true })
}
