import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const { title, image, link, isActive, sortOrder } = await req.json()
  const banner = await prisma.banner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(image !== undefined && { image }),
      ...(link !== undefined && { link: link || null }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })
  return NextResponse.json(banner)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  await prisma.banner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
