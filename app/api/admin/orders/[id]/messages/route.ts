import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id: orderId } = await params
  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  })

  await prisma.orderMessage.updateMany({
    where: { orderId, senderRole: "CUSTOMER", isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id: orderId } = await params
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  const msg = await prisma.orderMessage.create({
    data: {
      orderId,
      senderId: session!.user.id,
      senderRole: "ADMIN",
      message: message.trim(),
    },
  })

  return NextResponse.json({ message: msg })
}
