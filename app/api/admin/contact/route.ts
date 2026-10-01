import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const searchParams = req.nextUrl.searchParams
  const filter = searchParams.get("filter") || "all" // "all" | "unread" | "replied"
  const query = searchParams.get("q") || ""

  const where: any = {}
  if (filter === "unread") where.isRead = false
  if (filter === "replied") where.isReplied = true

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      { message: { contains: query, mode: "insensitive" } },
    ]
  }

  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const unreadCount = await prisma.contactMessage.count({
    where: { isRead: false },
  })

  return NextResponse.json({ messages, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id, isRead } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: !!isRead },
  })

  return NextResponse.json({ message: updated })
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  // The client calls DELETE /api/admin/contact?id=X (no body) -- this used to
  // read `await req.json()`, which throws on an empty body, so delete never
  // actually worked.
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.contactMessage.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
