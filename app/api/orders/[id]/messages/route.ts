import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id: orderId } = await params

  // Fetch order to verify ownership if logged in or guest
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, guestEmail: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // If logged in, verify order belongs to user or admin
  if (session?.user && order.userId && session.user.id !== order.userId && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id: orderId } = await params
  const body = await req.json().catch(() => ({}))
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, orderNumber: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (session?.user && order.userId && session.user.id !== order.userId && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const senderId = session?.user?.id || "GUEST_CUSTOMER"
  const senderRole = session?.user?.role === "ADMIN" ? "ADMIN" : "CUSTOMER"

  const createdMessage = await prisma.orderMessage.create({
    data: {
      orderId,
      senderId,
      senderRole,
      message,
      isRead: false,
    },
  })

  return NextResponse.json({ message: createdMessage })
}
