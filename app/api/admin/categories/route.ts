import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      },
      attributeConfig: true,
      _count: { select: { products: true, children: true } },
    },
  })
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, slug, description, image, parentId, isActive, showOnNavbar, showOnHomepage, sortOrder } = body
    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        isActive: isActive ?? true,
        showOnNavbar: showOnNavbar ?? true,
        showOnHomepage: showOnHomepage ?? true,
        sortOrder: sortOrder ?? 0,
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

