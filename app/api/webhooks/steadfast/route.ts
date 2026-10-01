import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
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
    const token = config.webhookSecret

    // Per Steadfast's documented webhook spec: the auth token (when set) signs
    // each request as X-Signature = HMAC-SHA256(raw body, token), hex-encoded.
    // Must be computed over the raw, unparsed body -- not the re-serialized
    // JSON, which can differ byte-for-byte from what was actually signed.
    const rawBody = await req.text()

    if (token) {
      const signature = req.headers.get("x-signature") || ""
      const expectedSignature = crypto.createHmac("sha256", token).update(rawBody).digest("hex")
      const sigBuf = Buffer.from(signature)
      const expBuf = Buffer.from(expectedSignature)
      const validSignature = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)

      if (!validSignature) {
        console.warn("[steadfast-webhook] Rejected: X-Signature mismatch")
        return NextResponse.json({ error: "Unauthorized: Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody || "null")
    if (!payload) {
      return NextResponse.json({ error: "Empty or invalid JSON body" }, { status: 400 })
    }

    console.log("[steadfast-webhook] Received payload:", JSON.stringify(payload))

    // Steadfast sends several notification_types (tracking_update,
    // consignment_update, payment_request, etc.) -- only delivery_status maps
    // to an order/delivery status change here. Acknowledge everything else
    // with 2xx so Steadfast doesn't retry a payload we were never going to act on.
    if (payload.notification_type && payload.notification_type !== "delivery_status") {
      return NextResponse.json({ ok: true, ignored: payload.notification_type })
    }

    const consignmentId = String(
      payload.consignment_id || payload.consignmentId || payload.cid || ""
    ).trim()

    const invoice = String(
      payload.invoice || payload.order_id || payload.order_number || payload.orderNumber || ""
    ).trim()

    const sfStatus = String(
      payload.status || payload.delivery_status || payload.event || ""
    ).trim()

    const trackingCode = String(
      payload.tracking_code || payload.trackingCode || payload.tracking_id || ""
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
