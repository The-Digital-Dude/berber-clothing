import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, description, image, parentId, isActive, showOnNavbar, showOnHomepage, sortOrder } = body

    // Prevent setting category as its own parent
    if (parentId && parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(showOnNavbar !== undefined && { showOnNavbar }),
        ...(showOnHomepage !== undefined && { showOnHomepage }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
        _count: { select: { products: true, children: true } },
      },
    })
    return NextResponse.json(category)
  } catch (err: any) {
    if (err.code === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    // Detach any child categories first so they become top-level rather than breaking foreign keys
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

