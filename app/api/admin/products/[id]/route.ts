import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { notifyStockAlerts } from "@/lib/stockAlert"
import { sendAdminLowStockAlert } from "@/lib/email"

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
    const { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, seoTitle, seoDescription, seoKeywords, ogImage, videoUrl, sizeChartImage, images, variants } = body

    // Update product fields
    const product = await prisma.product.update({
      where: { id },
      data: { name, slug, description, price, comparePrice: comparePrice ? Number(comparePrice) : null, categoryId, tags, isActive, isFeatured, seoTitle: seoTitle || null, seoDescription: seoDescription || null, seoKeywords: seoKeywords || null, ogImage: ogImage || null, videoUrl: videoUrl || null, sizeChartImage: sizeChartImage || null },
    })

    // Sync images: delete old, recreate
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: id,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || null,
            alt: img.alt || "",
            sortOrder: i,
          })),
        })
      }
    }

    // Sync variants if provided
    let warningMessage: string | null = null
    if (Array.isArray(variants)) {
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: id },
        include: {
          orderItems: { select: { id: true }, take: 1 },
          purchaseOrderItems: { select: { id: true }, take: 1 },
        },
      })

      const existingMap = new Map<string, (typeof existingVariants)[number]>(
        existingVariants.map((v) => [v.id, v])
      )
      const incomingIds = new Set(
        variants
          .filter((v: any) => v.id && String(v.id).trim() !== "")
          .map((v: any) => String(v.id).trim())
      )

      // 1. Deleted variants (in DB but omitted in incoming form payload)
      const preservedVariants: string[] = []
      for (const existing of existingVariants) {
        if (!incomingIds.has(existing.id)) {
          const hasOrders =
            existing.orderItems.length > 0 || existing.purchaseOrderItems.length > 0
          if (hasOrders) {
            // Retain variant with 0 stock to protect historical order records
            await prisma.productVariant.update({
              where: { id: existing.id },
              data: { stock: 0 },
            })
            preservedVariants.push(`${existing.size}/${existing.color}`)
          } else {
            // Safe to permanently delete: clean up carts first
            await prisma.cartItem.deleteMany({ where: { variantId: existing.id } })
            await prisma.productVariant.delete({ where: { id: existing.id } })
          }
        }
      }

      if (preservedVariants.length > 0) {
        warningMessage = `Variant(s) ${preservedVariants.join(", ")} have past order history, so stock was set to 0 instead of being deleted.`
      }

      // 2. Updated and newly added variants
      const slugBase =
        product.slug ||
        product.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      const ts = Date.now()

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        const vId = v.id && String(v.id).trim() !== "" ? String(v.id).trim() : null

        if (vId && existingMap.has(vId)) {
          const existing = existingMap.get(vId)!
          const newStock = Number(v.stock) || 0
          const prevStock = existing.stock

          await prisma.productVariant.update({
            where: { id: vId },
            data: {
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || null,
              sku: v.sku?.trim() || existing.sku,
              stock: newStock,
              price:
                v.price !== null && v.price !== undefined && v.price !== ""
                  ? Number(v.price)
                  : null,
              comparePrice:
                v.comparePrice !== null &&
                v.comparePrice !== undefined &&
                v.comparePrice !== ""
                  ? Number(v.comparePrice)
                  : null,
            },
          })

          // Notify back-in-stock subscribers
          if (newStock > 0 && prevStock === 0) {
            notifyStockAlerts(vId).catch(() => {})
          }

          // Alert admin when stock drops to low threshold (1–5)
          if (newStock > 0 && newStock <= 5 && prevStock > 5) {
            sendAdminLowStockAlert({
              productName: product.name,
              sku: v.sku || vId,
              size: v.size,
              color: v.color,
              stock: newStock,
              productId: id,
            }).catch(() => {})
          }
        } else {
          // New variant added in edit mode
          const generatedSku =
            v.sku?.trim() ||
            `${slugBase}-${v.size || "OS"}-${v.color || "DEF"}-${ts}-${i}`
              .toUpperCase()
              .replace(/\s+/g, "-")
          await prisma.productVariant.create({
            data: {
              productId: id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || null,
              sku: generatedSku,
              stock: Number(v.stock) || 0,
              price:
                v.price !== null && v.price !== undefined && v.price !== ""
                  ? Number(v.price)
                  : null,
              comparePrice:
                v.comparePrice !== null &&
                v.comparePrice !== undefined &&
                v.comparePrice !== ""
                  ? Number(v.comparePrice)
                  : null,
            },
          })
        }
      }
    }

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)
    revalidatePath("/")
    revalidatePath("/shop")
    revalidatePath(`/shop/${product.slug}`)
    return NextResponse.json({ ...product, warning: warningMessage })
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.join(", ") || "field"
      return NextResponse.json(
        { error: `Duplicate value on ${field}. Check that the SKU or slug is unique.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    // P2003 = foreign key constraint (product has orders)
    if (error.code === "P2003") {
      // Soft-delete: deactivate instead of deleting
      await prisma.product.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true, softDeleted: true, message: "Product has orders — it has been deactivated instead of deleted." })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  try {
    const body = await req.json()
    const updated = await prisma.product.update({
      where: { id },
      data: body,
    })
    revalidatePath("/")
    revalidatePath("/shop")
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
