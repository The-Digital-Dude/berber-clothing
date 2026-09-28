import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    const { items, shippingCharge, discount, note } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      )
    }

    // 1. Fetch current order with existing items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Guardrail: check fulfillment status
    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot edit items for an order that is already ${order.status}.` },
        { status: 400 }
      )
    }

    // 2. Perform atomic database transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // A. Calculate stock adjustments:
      // Map existing variant quantities
      const oldVariantQtyMap: Record<string, number> = {}
      for (const item of order.items) {
        oldVariantQtyMap[item.variantId] = (oldVariantQtyMap[item.variantId] || 0) + item.quantity
      }

      // Map new variant quantities
      const newVariantQtyMap: Record<string, number> = {}
      for (const item of items) {
        newVariantQtyMap[item.variantId] = (newVariantQtyMap[item.variantId] || 0) + Number(item.quantity)
      }

      // Combine all affected variant IDs
      const allVariantIds = Array.from(
        new Set([...Object.keys(oldVariantQtyMap), ...Object.keys(newVariantQtyMap)])
      )

      // Adjust inventory for each variant
      for (const vId of allVariantIds) {
        const oldQty = oldVariantQtyMap[vId] || 0
        const newQty = newVariantQtyMap[vId] || 0
        const delta = newQty - oldQty // if > 0: need to deduct more stock. If < 0: restock

        if (delta !== 0) {
          await tx.productVariant.update({
            where: { id: vId },
            data: {
              stock: {
                decrement: delta, // positive delta decreases stock, negative delta increases stock
              },
            },
          })
        }
      }

      // B. Delete existing items and recreate
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      })

      const createdItems = await Promise.all(
        items.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId: id,
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              size: item.size || "Standard",
              color: item.color || "Default",
              quantity: Number(item.quantity),
              price: Number(item.price),
            },
          })
        )
      )

      // C. Recalculate financial totals
      const subtotal = items.reduce(
        (sum: number, it: any) => sum + Number(it.price) * Number(it.quantity),
        0
      )
      const finalShippingCharge =
        shippingCharge !== undefined ? Number(shippingCharge) : Number(order.shippingCharge)
      const finalDiscount =
        discount !== undefined ? Number(discount) : Number(order.discount)
      const total = Math.max(0, subtotal + finalShippingCharge - finalDiscount)

      // D. Update order header
      const savedOrder = await tx.order.update({
        where: { id },
        data: {
          subtotal,
          shippingCharge: finalShippingCharge,
          discount: finalDiscount,
          total,
        },
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
          payment: true,
          delivery: true,
          statusLogs: { orderBy: { createdAt: "desc" } },
        },
      })

      // E. Write audit status log
      const itemSummary = items
        .map((i: any) => `${i.productName} (${i.size}/${i.color}) x${i.quantity}`)
        .join(", ")

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          status: order.status,
          note: `Admin modified items (${note ? `${note} · ` : ""}${itemSummary}). New total: ৳${total.toLocaleString()}`,
        },
      })

      return savedOrder
    })

    revalidatePath(`/admin/orders`)
    revalidatePath(`/admin/orders/${id}`)
    revalidatePath(`/order/${id}/invoice`)

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
