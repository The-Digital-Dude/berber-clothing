import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { notifyStockAlerts } from "@/lib/stockAlert"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, seoTitle, seoDescription, seoKeywords, images, variants } = body

    // Update product fields
    const product = await prisma.product.update({
      where: { id },
      data: { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, seoTitle: seoTitle || null, seoDescription: seoDescription || null, seoKeywords: seoKeywords || null },
    })

    // Sync images: delete old, recreate
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt || "",
            sortOrder: i,
          })),
        })
      }
    }

    // Sync variants if provided
    if (Array.isArray(variants)) {
      // Fetch current stock to detect 0→positive transitions
      const variantIds = variants.filter((v: any) => v.id).map((v: any) => v.id)
      const currentVariants = variantIds.length > 0
        ? await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, stock: true } })
        : []
      const currentStockMap = Object.fromEntries(currentVariants.map((v) => [v.id, v.stock]))

      for (const v of variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { size: v.size, color: v.color, colorHex: v.colorHex || null, sku: v.sku, stock: v.stock, price: v.price || null, comparePrice: v.comparePrice || null },
          }).catch(() => {})

          // Notify back-in-stock subscribers
          if (v.stock > 0 && (currentStockMap[v.id] ?? 0) === 0) {
            notifyStockAlerts(v.id).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
