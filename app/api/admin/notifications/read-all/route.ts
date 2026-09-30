import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST() {
  const { session, error } = await requireAdmin()
  if (error) return error

  const unread = await prisma.adminNotification.findMany({
    where: { NOT: { readBy: { has: session!.user.id } } },
    select: { id: true },
    take: 200,
  })

  if (unread.length > 0) {
    await prisma.$transaction(
      unread.map((n) =>
        prisma.adminNotification.update({
          where: { id: n.id },
          data: { readBy: { push: session!.user.id } },
        })
      )
    )
  }

  return NextResponse.json({ ok: true })
}
