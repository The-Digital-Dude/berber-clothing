import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const draft = await prisma.draftOrder.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.items ? { items: JSON.stringify(body.items) } : {}),
    },
  })
  return NextResponse.json(draft)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.draftOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
