import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { sendOrderStatusUpdate } from "@/lib/email"

// Map Steadfast courier status to Berber internal status
function mapSteadfastStatus(sfStatus: string): {
  deliveryStatus: string
  orderStatus?: string
  paymentStatus?: string
  notifyCustomer: boolean
} {
  const s = sfStatus.toLowerCase().trim()

  switch (s) {
    case "delivered":
    case "delivered_approval_pending":
      return {
        deliveryStatus: "DELIVERED",
        orderStatus: "DELIVERED",
        paymentStatus: "PAID",
        notifyCustomer: true,
      }

    case "partial_delivered":
    case "partial_delivered_approval_pending":
      return {
        deliveryStatus: "PARTIAL_DELIVERED",
        orderStatus: "DELIVERED",
        paymentStatus: "PAID",
        notifyCustomer: true,
      }

    case "in_transit":
    case "accepted":
    case "picked_up":
    case "shipped":
      return {
        deliveryStatus: "IN_TRANSIT",
        orderStatus: "SHIPPED",
        notifyCustomer: false,
      }

    case "hold":
      return {
        deliveryStatus: "HOLD",
        notifyCustomer: false,
      }

    case "cancelled":
    case "cancelled_approval_pending":
      return {
        deliveryStatus: "CANCELLED",
        orderStatus: "CANCELLED",
        notifyCustomer: false,
      }

    case "returned":
    case "return_approval_pending":
    case "return_received":
      return {
        deliveryStatus: "RETURNED",
        orderStatus: "RETURNED",
        notifyCustomer: true,
      }

    case "pending":
    case "in_review":
    default:
      return {
        deliveryStatus: "PENDING",
        notifyCustomer: false,
      }
  }
}

import { getSteadfastConfig } from "@/lib/steadfast"

export async function POST(req: Request) {
  try {
    const config = await getSteadfastConfig()
    const expectedToken = config.webhookSecret || config.secretKey

    // Check Bearer token or secret headers if a secret is configured
    if (expectedToken) {
      const authHeader = req.headers.get("authorization") || ""
      const xToken =
        req.headers.get("x-steadfast-token") ||
        req.headers.get("x-webhook-secret") ||
        req.headers.get("secret-key") ||
        req.headers.get("x-api-key") ||
        ""

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim() || xToken.trim()

      if (token && token !== expectedToken && token !== config.apiKey) {
        console.warn("[steadfast-webhook] Rejected unauthorized webhook request. Token mismatch.")
        return NextResponse.json({ error: "Unauthorized: Invalid Bearer token" }, { status: 401 })
      }
    }

    const rawBody = await req.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: "Empty or invalid JSON body" }, { status: 400 })
    }

    console.log("[steadfast-webhook] Received payload:", JSON.stringify(rawBody))

    // Steadfast payload fields can vary based on webhook trigger
    const consignmentId = String(
      rawBody.consignment_id || rawBody.consignmentId || rawBody.cid || ""
    ).trim()

    const invoice = String(
      rawBody.invoice || rawBody.order_id || rawBody.order_number || rawBody.orderNumber || ""
    ).trim()

    const sfStatus = String(
      rawBody.status || rawBody.delivery_status || rawBody.event || ""
    ).trim()

    const trackingCode = String(
      rawBody.tracking_code || rawBody.trackingCode || rawBody.tracking_id || ""
    ).trim()

    if (!consignmentId && !invoice) {
      return NextResponse.json(
        { error: "Neither consignment_id nor invoice provided" },
        { status: 400 }
      )
    }

    // Find the order & delivery record
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          ...(consignmentId ? [{ consignmentId }] : []),
          ...(invoice ? [{ order: { orderNumber: invoice } }] : []),
        ],
      },
      include: {
        order: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    })

    if (!delivery || !delivery.order) {
      console.warn("[steadfast-webhook] No matching order found for:", { consignmentId, invoice })
      return NextResponse.json(
        { ok: true, message: "Order not found or not managed locally" },
        { status: 200 }
      )
    }

    const order = delivery.order
    const mapped = mapSteadfastStatus(sfStatus)

    // Update Delivery status
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: mapped.deliveryStatus,
        ...(trackingCode ? { trackingCode } : {}),
      },
    })

    // Update Order status if applicable
    const shouldUpdateOrder = mapped.orderStatus && order.status !== mapped.orderStatus
    const shouldUpdatePayment = mapped.paymentStatus && order.paymentStatus !== mapped.paymentStatus

    if (shouldUpdateOrder || shouldUpdatePayment) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          ...(shouldUpdateOrder ? { status: mapped.orderStatus } : {}),
          ...(shouldUpdatePayment ? { paymentStatus: mapped.paymentStatus } : {}),
        },
      })

      // Log status change
      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: mapped.orderStatus || order.status,
          note: `Auto-updated via Steadfast Courier webhook: ${sfStatus.toUpperCase()}`,
        },
      }).catch(() => {})

      // Send customer notification email if status changed to DELIVERED / RETURNED
      const customerEmail = order.guestEmail || order.user?.email
      const customerName = order.shippingName || order.user?.name || "there"

      if (mapped.notifyCustomer && customerEmail && shouldUpdateOrder) {
        sendOrderStatusUpdate({
          to: customerEmail,
          customerName,
          orderNumber: order.orderNumber,
          status: mapped.orderStatus!,
          note: `Courier update from Steadfast: ${sfStatus.replace(/_/g, " ").toUpperCase()}`,
        }).catch((err) => console.error("[steadfast-webhook] Email notify failed:", err))
      }
    }

    // Automatically purge & revalidate all relevant customer and admin views
    try {
      revalidatePath(`/order/${order.id}`)
      revalidatePath(`/admin/orders/${order.id}`)
      revalidatePath("/admin/orders")
      revalidatePath("/admin/delivery")
      revalidatePath("/account/orders")
      revalidatePath("/track")
    } catch {}

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      consignmentId: delivery.consignmentId,
      newDeliveryStatus: mapped.deliveryStatus,
      newOrderStatus: mapped.orderStatus || order.status,
    })
  } catch (err: any) {
    console.error("[steadfast-webhook] Processing error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to process webhook" },
      { status: 500 }
    )
  }
}

// Support GET for webhook health check or verification pings from Steadfast
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Steadfast Courier Webhook Listener",
    status: "active",
    endpoint: "/api/webhooks/steadfast",
  })
}
