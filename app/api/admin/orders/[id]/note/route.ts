import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { codCallNote } = await req.json()

  const order = await prisma.order.update({
    where: { id },
    data: { codCallNote },
    select: { id: true, codCallNote: true },
  })

  return NextResponse.json({ order })
}
