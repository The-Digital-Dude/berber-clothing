import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""

    const products = await prisma.product.findMany({
      where: {
        name: { contains: search, mode: "insensitive" },
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, seoTitle, seoDescription, seoKeywords, images, variants } = body

    const slugBase = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const ts = Date.now()

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugBase,
        description,
        price,
        comparePrice,
        categoryId,
        tags,
        isActive,
        isFeatured,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        images: {
          create: (images || []).map((img: any, i: number) => ({ url: img.url, alt: img.alt || "", sortOrder: i }))
        },
        variants: {
          create: (variants || []).map((v: any, i: number) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex || null,
            sku: v.sku?.trim() || `${slugBase}-${v.size || "OS"}-${v.color || "DEF"}-${ts}-${i}`.toUpperCase().replace(/\s+/g, "-"),
            stock: v.stock ?? 0,
            price: v.price || null,
            comparePrice: v.comparePrice || null,
          }))
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.join(", ") || "field"
      return NextResponse.json({ error: `Duplicate value on ${field}. Check that the SKU or slug is unique.` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
