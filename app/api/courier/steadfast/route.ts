import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createConsignment, getConsignmentStatus } from "@/lib/steadfast"
import { sendOrderDelivered, sendOrderStatusUpdate } from "@/lib/email"
import { clawbackPointsForOrder } from "@/lib/loyalty"
import { createAdminNotification } from "@/lib/adminNotifications"

export const dynamic = "force-dynamic"

// Helper to calculate exact COD collect amount
export function calculateCodAmount(order: {
  paymentMethod: string
  paymentStatus: string
  total: any
  depositPaid?: boolean
  depositAmount?: any
  advancePaid?: boolean
  advanceCharge?: any
}): number {
  if (order.paymentStatus === "PAID") return 0
  if (order.paymentMethod !== "COD") return 0

  const total = Number(order.total) || 0
  const deposit = order.depositPaid ? Number(order.depositAmount) || 0 : 0
  const advance = order.advancePaid ? Number(order.advanceCharge) || 0 : 0
  const netDue = Math.max(0, total - deposit - advance)
  return Math.round(netDue)
}

// POST: create a Steadfast consignment for an order (1-Click Dispatch)
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order.shippingPhone) {
      return NextResponse.json({ error: "Order is missing shipping phone number" }, { status: 400 })
    }

    const addressParts = [
      order.shippingAddress,
      order.shippingArea,
      order.shippingDistrict,
      order.shippingDivision,
    ].filter(Boolean)

    const fullAddress = addressParts.join(", ") || "Address not provided"
    const codAmount = calculateCodAmount(order)

    const consignment = await createConsignment({
      invoice: order.orderNumber,
      recipient_name: order.shippingName || "Customer",
      recipient_phone: order.shippingPhone,
      recipient_address: fullAddress,
      cod_amount: codAmount,
      note: order.note ?? undefined,
    })

    // Upsert delivery record
    const delivery = await prisma.delivery.upsert({
      where: { orderId },
      create: {
        orderId,
        courier: "STEADFAST",
        consignmentId: String(consignment.consignment_id),
        trackingCode: consignment.tracking_code,
        status: consignment.status || "in_review",
      },
      update: {
        courier: "STEADFAST",
        consignmentId: String(consignment.consignment_id),
        trackingCode: consignment.tracking_code,
        status: consignment.status || "in_review",
      },
    })

    // Update order status to SHIPPED if currently PENDING, CONFIRMED, or PACKED
    if (["PENDING", "CONFIRMED", "PACKED"].includes(order.status)) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      })
    }

    return NextResponse.json({
      success: true,
      consignment,
      delivery,
      codAmount,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to dispatch order to Steadfast" },
      { status: 500 }
    )
  }
}

// GET: check status of a consignment
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const consignmentId = req.nextUrl.searchParams.get("consignmentId")
  if (!consignmentId) return NextResponse.json({ error: "consignmentId required" }, { status: 400 })

  try {
    const result = await getConsignmentStatus(consignmentId)

    // Map Steadfast statuses to our internal statuses. Per Steadfast's own
    // docs: "pending" = booked but not yet attempted, "in_review" = just
    // created, awaiting their approval (every parcel starts here), "hold" =
    // an address/payment problem needs attention -- none of these mean the
    // parcel has actually been picked up, so none of them should read as
    // "SHIPPED" (this previously caused orders to show Shipped, with a
    // tracking link that 404s on Steadfast's own site, while the parcel was
    // still just sitting in their queue unprocessed). Matches the mapping
    // the webhook handler already uses correctly.
    const statusMap: Record<string, string> = {
      delivered: "DELIVERED",
      partial_delivered: "DELIVERED",
      cancelled: "CANCELLED",
      returned: "RETURNED",
      partial_returned: "RETURNED",
      in_transit: "SHIPPED",
      picked_up: "SHIPPED",
      in_review: "PENDING",
      pending: "PENDING",
      hold: "HOLD",
    }
    const internalStatus = statusMap[result.status?.toLowerCase()] ?? "SHIPPED"

    const delivery = await prisma.delivery.findFirst({ where: { consignmentId } })

    // Update delivery record
    await prisma.delivery.updateMany({
      where: { consignmentId },
      data: { status: internalStatus },
    })

    // Keep the order's own status in sync, and notify the customer on delivery
    if (delivery && (internalStatus === "DELIVERED" || internalStatus === "RETURNED")) {
      const order = await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: internalStatus },
        include: {
          user: { select: { email: true, name: true } },
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      })
      const toEmail = order.user?.email || order.guestEmail
      if (toEmail && internalStatus === "DELIVERED") {
        sendOrderDelivered({
          to: toEmail,
          customerName: order.user?.name || order.shippingName || "Customer",
          orderNumber: order.orderNumber,
          productName: order.items[0]?.product?.name || "your order",
        }).catch(() => {})
      }
      if (toEmail && internalStatus === "RETURNED") {
        sendOrderStatusUpdate({
          to: toEmail,
          customerName: order.user?.name || order.shippingName || "Customer",
          orderNumber: order.orderNumber,
          status: "RETURNED",
        }).catch(() => {})
      }
      if (internalStatus === "RETURNED") {
        clawbackPointsForOrder(order.id).catch(() => {})
        createAdminNotification({
          type: "order_returned",
          title: `Order #${order.orderNumber} returned`,
          message: `${order.user?.name || order.shippingName || "Customer"}'s order was returned (Steadfast)`,
          link: `/admin/orders/${order.id}`,
          entityId: order.id,
        })
      }
    }

    return NextResponse.json({ status: result.status, internalStatus })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch Steadfast status" },
      { status: 500 }
    )
  }
}
