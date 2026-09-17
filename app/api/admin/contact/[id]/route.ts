import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { action } = await req.json()

  if (action === "markRead") {
    await prisma.contactMessage.update({ where: { id }, data: { isRead: true } })
  } else if (action === "markReplied") {
    await prisma.contactMessage.update({ where: { id }, data: { isReplied: true, isRead: true } })
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
