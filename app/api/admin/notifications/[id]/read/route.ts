import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const notification = await prisma.adminNotification.findUnique({ where: { id } })
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!notification.readBy.includes(session!.user.id)) {
    await prisma.adminNotification.update({
      where: { id },
      data: { readBy: { push: session!.user.id } },
    })
  }

  return NextResponse.json({ ok: true })
}
