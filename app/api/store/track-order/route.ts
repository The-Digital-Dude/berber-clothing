import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getConsignmentStatus } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber") || req.nextUrl.searchParams.get("order")
  if (!orderNumber) {
    return NextResponse.json({ error: "Order number is required" }, { status: 400 })
  }
  return handleTrackOrder(orderNumber.trim())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const orderNumber = body.orderNumber || body.order
    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }
    return handleTrackOrder(String(orderNumber).trim())
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 500 })
  }
}

async function handleTrackOrder(orderNumber: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderNumber },
          { id: orderNumber },
          { orderNumber: { equals: orderNumber, mode: "insensitive" } },
        ],
      },
      include: {
        items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } },
        delivery: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "No order found with that order number" }, { status: 404 })
    }

    let liveCourierStatus: string | null = null
    let liveCourierMessage: string | null = null

    // If order has a Steadfast consignment, check real-time status from Steadfast API
    if (order.delivery?.consignmentId) {
      try {
        const sfResult = await getConsignmentStatus(order.delivery.consignmentId)
        if (sfResult?.status) {
          liveCourierStatus = sfResult.status
          
          // Map to human friendly message
          const msgMap: Record<string, string> = {
            in_review: "Consignment created, awaiting rider pickup from warehouse.",
            pending: "Rider assigned, parcel scheduled for pickup.",
            picked_up: "Picked up by Steadfast rider, en route to sorting hub.",
            in_transit: "In transit to destination delivery branch.",
            out_for_delivery: "Out for delivery with your local Steadfast rider.",
            delivered: "Parcel delivered successfully.",
            partial_delivered: "Parcel partially delivered.",
            cancelled: "Delivery cancelled.",
            returned: "Parcel returned to warehouse.",
            hold: "Delivery placed on temporary hold by courier.",
          }
          liveCourierMessage = msgMap[sfResult.status.toLowerCase()] || `Steadfast Status: ${sfResult.status}`
        }
      } catch (sfErr) {
        // Fallback gracefully to database delivery status if API fails
        liveCourierStatus = order.delivery.status
      }
    }

    const netCodDue = order.paymentStatus === "PAID"
      ? 0
      : Math.max(0, Math.round(Number(order.total) - (order.depositPaid ? Number(order.depositAmount || 0) : 0) - (order.advancePaid ? Number(order.advanceCharge || 0) : 0)))

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCharge: Number(order.shippingCharge),
      discount: Number(order.discount),
      depositPaid: order.depositPaid,
      depositAmount: Number(order.depositAmount || 0),
      netCodDue,
      createdAt: order.createdAt,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone ? `${order.shippingPhone.slice(0, 4)}****${order.shippingPhone.slice(-3)}` : null,
      shippingAddress: order.shippingAddress,
      shippingArea: order.shippingArea,
      shippingDistrict: order.shippingDistrict,
      items: order.items.map((i) => ({
        productName: i.productName,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: Number(i.price),
        image: i.product?.images?.[0]?.url || null,
      })),
      delivery: order.delivery
        ? {
            courier: order.delivery.courier || "STEADFAST",
            consignmentId: order.delivery.consignmentId,
            trackingCode: order.delivery.trackingCode,
            status: order.delivery.status,
            liveCourierStatus,
            liveCourierMessage,
          }
        : null,
      statusLogs: order.statusLogs.map((l) => ({ status: l.status, createdAt: l.createdAt })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query order" }, { status: 500 })
  }
}
