import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendOrderDelivered } from "@/lib/email"

// Steadfast Courier Webhook Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { status, consignment_id, tracking_code, invoice } = body

    if (!consignment_id && !tracking_code && !invoice) {
      return NextResponse.json({ error: "Missing identifier in payload" }, { status: 400 })
    }

    const cidStr = consignment_id ? String(consignment_id) : undefined

    // Find delivery or order
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          ...(cidStr ? [{ consignmentId: cidStr }] : []),
          ...(tracking_code ? [{ trackingCode: tracking_code }] : []),
        ],
      },
      include: { order: true },
    })

    const statusMap: Record<string, string> = {
      delivered: "DELIVERED",
      partial_delivered: "DELIVERED",
      returned: "RETURNED",
      partial_returned: "RETURNED",
      cancelled: "CANCELLED",
      in_review: "SHIPPED",
      pending: "PACKED",
    }

    const normalizedStatus = status ? status.toLowerCase() : ""
    const internalStatus = statusMap[normalizedStatus] || "SHIPPED"

    const orderId = delivery?.orderId || (
      invoice ? (await prisma.order.findUnique({ where: { orderNumber: invoice } }))?.id : null
    )

    if (!orderId) {
      return NextResponse.json({ message: "No matching order found, acknowledged" }, { status: 200 })
    }

    // Update Delivery status
    if (cidStr || tracking_code) {
      await prisma.delivery.updateMany({
        where: {
          orderId,
        },
        data: {
          status: internalStatus,
          ...(tracking_code ? { trackingCode: tracking_code } : {}),
          ...(cidStr ? { consignmentId: cidStr } : {}),
        },
      })
    }

    // Update Order status & log status change
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
        items: { take: 1, include: { product: { select: { name: true } } } },
      },
    })

    if (currentOrder && currentOrder.status !== internalStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: internalStatus,
          ...(internalStatus === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
        },
      })

      await prisma.orderStatusLog.create({
        data: {
          orderId,
          status: internalStatus,
          note: `Steadfast courier status update: ${status || internalStatus}`,
        },
      })

      // Send delivery confirmation email if delivered
      const customerEmail = currentOrder.user?.email || currentOrder.guestEmail
      if (customerEmail && internalStatus === "DELIVERED") {
        sendOrderDelivered({
          to: customerEmail,
          customerName: currentOrder.user?.name || currentOrder.shippingName || "Customer",
          orderNumber: currentOrder.orderNumber,
          productName: currentOrder.items[0]?.product?.name || "your items",
        }).catch((err) => {
          console.error("[Steadfast Webhook] Email error:", err)
        })
      }
    }

    return NextResponse.json({ success: true, internalStatus })
  } catch (err: any) {
    console.error("[Steadfast Webhook Error]:", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
