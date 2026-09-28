import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { notifyStockAlerts } from "@/lib/stockAlert"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id: productId, variantId } = await params
    const body = await req.json()
    const { stock, price, costPrice, sku } = body

    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!existing || existing.productId !== productId) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (stock !== undefined) updateData.stock = Math.max(0, parseInt(stock) || 0)
    if (price !== undefined) updateData.price = price === null || price === "" ? null : Number(price)
    if (costPrice !== undefined) updateData.costPrice = costPrice === null || costPrice === "" ? null : Number(costPrice)
    if (sku !== undefined) updateData.sku = sku ? String(sku).trim() : null

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    })

    // If restocked from 0 to positive, notify waitlist
    if (existing.stock === 0 && (updateData.stock ?? 0) > 0) {
      notifyStockAlerts(variantId).catch(() => {})
    }

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/shop")

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update variant" }, { status: 500 })
  }
}
