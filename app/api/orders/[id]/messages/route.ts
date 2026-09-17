import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: orderId } = await params
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  })

  // Mark customer messages as read
  await prisma.orderMessage.updateMany({
    where: { orderId, senderRole: "ADMIN", isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: orderId } = await params
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  const msg = await prisma.orderMessage.create({
    data: { orderId, senderId: session.user.id, senderRole: "CUSTOMER", message: message.trim() },
  })

  return NextResponse.json({ message: msg })
}
