import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { name, slug, description, rules, isActive, sortOrder } = await req.json()

  const collection = await prisma.smartCollection.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      rules: rules !== undefined ? JSON.stringify(rules) : undefined,
      isActive,
      sortOrder,
    },
  })
  return NextResponse.json({ collection })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.smartCollection.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
