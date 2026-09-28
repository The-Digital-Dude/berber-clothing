import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/auditLog"

// Lets a logged-in customer swap the size/color of an item on their own
// order — same product only, before it's been packed for shipping.
const EDITABLE_STATUSES = ["PENDING", "CONFIRMED"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to edit an order" }, { status: 401 })
  }

  const { id: orderId, itemId } = await params
  const { variantId: newVariantId } = await req.json()
  if (!newVariantId) {
    return NextResponse.json({ error: "variantId is required" }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "This isn't your order" }, { status: 403 })
    }
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return NextResponse.json({ error: "This order can no longer be edited — it's already being fulfilled" }, { status: 400 })
    }

    const item = order.items.find((i) => i.id === itemId)
    if (!item) return NextResponse.json({ error: "Item not found on this order" }, { status: 404 })

    if (item.variantId === newVariantId) {
      return NextResponse.json({ error: "That's already the selected size/color" }, { status: 400 })
    }

    // Prevent creating a duplicate line for a variant already elsewhere in this order
    if (order.items.some((i) => i.id !== itemId && i.variantId === newVariantId)) {
      return NextResponse.json({ error: "That size/color is already a separate item in this order" }, { status: 400 })
    }

    const newVariant = await prisma.productVariant.findUnique({ where: { id: newVariantId } })
    if (!newVariant || newVariant.productId !== item.productId) {
      return NextResponse.json({ error: "Invalid size/color selection" }, { status: 400 })
    }
    if (newVariant.stock < item.quantity) {
      return NextResponse.json({ error: `Only ${newVariant.stock} left in that size/color` }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    const newPrice = Number(newVariant.price ?? product?.price ?? item.price)
    const priceDelta = (newPrice - Number(item.price)) * item.quantity

    await prisma.$transaction(async (tx) => {
      // Return stock to the old variant, take it from the new one
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
      const decremented = await tx.productVariant.updateMany({
        where: { id: newVariantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (decremented.count === 0) {
        throw new Error(`Only a few left in that size/color — someone else just grabbed the last one`)
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { variantId: newVariantId, size: newVariant.size, color: newVariant.color, price: newPrice },
      })

      await tx.order.update({
        where: { id: orderId },
        data: { subtotal: { increment: priceDelta }, total: { increment: priceDelta } },
      })

      await tx.orderStatusLog.create({
        data: {
          orderId,
          status: order.status,
          note: `Customer changed "${item.productName}" from ${item.size}/${item.color} to ${newVariant.size}/${newVariant.color}`,
        },
      })
    })

    await logAudit({
      actorId: session.user.id,
      action: "order_item.edit",
      entityType: "Order",
      entityId: orderId,
      before: { itemId, size: item.size, color: item.color },
      after: { itemId, size: newVariant.size, color: newVariant.color },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 })
  }
}
