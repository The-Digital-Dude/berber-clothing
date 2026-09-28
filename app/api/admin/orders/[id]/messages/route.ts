import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendOrderMessageNotification } from "@/lib/email"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id: orderId } = await params

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  })

  // Mark customer messages as read by admin
  await prisma.orderMessage.updateMany({
    where: { orderId, senderRole: "CUSTOMER", isRead: false },
    data: { isRead: true },
  }).catch(() => {})

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id: orderId } = await params
  const body = await req.json().catch(() => ({}))
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const senderId = session?.user?.id || "ADMIN"

  const createdMessage = await prisma.orderMessage.create({
    data: {
      orderId,
      senderId,
      senderRole: "ADMIN",
      message,
      isRead: false,
    },
  })

  // Send automated email notification to customer
  const customerEmail = order.user?.email || order.guestEmail
  if (customerEmail) {
    sendOrderMessageNotification({
      to: customerEmail,
      customerName: order.user?.name || order.shippingName || "Valued Customer",
      orderNumber: order.orderNumber,
      orderId: order.id,
      message,
    }).catch((err) => {
      console.error("[sendOrderMessageNotification] error:", err)
    })
  }

  return NextResponse.json({ message: createdMessage })
}
