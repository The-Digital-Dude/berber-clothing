import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { locked } = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: { isLocked: locked },
    select: { id: true, email: true, isLocked: true },
  })

  await logAudit({
    actorId: session!.user.id,
    actorEmail: session!.user.email,
    actorRole: session!.user.role,
    action: locked ? "customer.locked" : "customer.unlocked",
    entityType: "User",
    entityId: id,
  })

  return NextResponse.json({ user })
}
