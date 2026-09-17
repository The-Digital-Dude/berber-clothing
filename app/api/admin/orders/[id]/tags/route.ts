import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { tags } = await req.json() // array of strings

  const tagsStr = Array.isArray(tags) ? tags.join(",") : tags

  const order = await prisma.order.update({
    where: { id },
    data: { tags: tagsStr },
    select: { id: true, tags: true },
  })

  return NextResponse.json({ order })
}
