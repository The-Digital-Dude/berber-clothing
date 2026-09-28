import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createConsignment, getConsignmentStatus } from "@/lib/steadfast"
import { sendOrderDelivered } from "@/lib/email"
import { clawbackPointsForOrder } from "@/lib/loyalty"

// POST: create a Steadfast consignment for an order
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { orderId } = await req.json()
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const consignment = await createConsignment({
    invoice: order.orderNumber,
    recipient_name: order.shippingName,
    recipient_phone: order.shippingPhone,
    recipient_address: `${order.shippingAddress}, ${order.shippingArea}, ${order.shippingDistrict}`,
    cod_amount: order.paymentMethod === "COD" ? Number(order.total) : 0,
    note: order.note ?? undefined,
  })

  // Upsert delivery record
  await prisma.delivery.upsert({
    where: { orderId },
    create: {
      orderId,
      courier: "STEADFAST",
      consignmentId: String(consignment.consignment_id),
      trackingCode: consignment.tracking_code,
      status: consignment.status,
    },
    update: {
      courier: "STEADFAST",
      consignmentId: String(consignment.consignment_id),
      trackingCode: consignment.tracking_code,
      status: consignment.status,
    },
  })

  // Update order status to PACKED
  await prisma.order.update({ where: { id: orderId }, data: { status: "PACKED" } })

  return NextResponse.json({ consignment })
}

// GET: check status of a consignment
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const consignmentId = req.nextUrl.searchParams.get("consignmentId")
  if (!consignmentId) return NextResponse.json({ error: "consignmentId required" }, { status: 400 })

  const result = await getConsignmentStatus(consignmentId)

  // Map Steadfast statuses to our internal statuses
  const statusMap: Record<string, string> = {
    "delivered": "DELIVERED",
    "partial_delivered": "DELIVERED",
    "returned": "RETURNED",
    "partial_returned": "RETURNED",
    "in_review": "SHIPPED",
  }
  const internalStatus = statusMap[result.status] ?? "SHIPPED"

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
    if (internalStatus === "RETURNED") {
      clawbackPointsForOrder(order.id).catch(() => {})
    }
  }

  return NextResponse.json({ status: result.status, internalStatus })
}
