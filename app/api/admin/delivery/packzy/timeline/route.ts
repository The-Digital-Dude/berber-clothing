import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { getTrackingTimeline, getConsignmentStatusWithReturn } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const invoice = req.nextUrl.searchParams.get("invoice")
    if (!invoice) {
      return NextResponse.json({ error: "invoice is required" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: invoice.trim() },
          { id: invoice.trim() },
          { orderNumber: { equals: invoice.trim(), mode: "insensitive" } },
        ],
      },
      include: {
        delivery: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    })

    let timeline: any[] = []
    let liveStatus: string | null = null
    let returnStatus: string | null = null

    // 1. Try querying Packzy's live tracking timeline endpoint
    try {
      timeline = await getTrackingTimeline(invoice.trim())
    } catch {
      timeline = []
    }

    // 2. Query live status by consignment ID
    if (order?.delivery?.consignmentId) {
      try {
        const statusRes = await getConsignmentStatusWithReturn(order.delivery.consignmentId)
        if (statusRes?.status) {
          liveStatus = statusRes.status
          returnStatus = statusRes.return_status || null
        }
      } catch {}
    }

    // 3. If Packzy's /trackings_by_invoice/ returned empty (or 401 due to sub-account profile mapping),
    // synthesize the complete journey timeline from order logs + live courier state
    if (!Array.isArray(timeline) || timeline.length === 0) {
      timeline = []

      if (order) {
        // Order Placed
        timeline.push({
          status: "Order Placed",
          message: "Customer placed the order online.",
          created_at: order.createdAt,
        })

        // Status logs (Confirmed, Packed, Shipped)
        for (const log of order.statusLogs) {
          timeline.push({
            status: log.status ? log.status.replace(/_/g, " ") : "Status Updated",
            message: log.note || `Order status moved to ${log.status}`,
            created_at: log.createdAt,
          })
        }

        // Consignment Dispatched / Booked with Courier
        if (order.delivery) {
          const courierName = "Packzy / Steadfast Courier"
          const cid = order.delivery.consignmentId
          const code = order.delivery.trackingCode
          const currentDeliveryStatus = liveStatus || order.delivery.status || "in_review"

          const courierMsgMap: Record<string, string> = {
            in_review: "Consignment created, awaiting rider pickup from warehouse.",
            pending: "Rider assigned, parcel scheduled for pickup.",
            picked_up: "Picked up by courier rider, en route to sorting hub.",
            in_transit: "In transit to destination delivery branch.",
            out_for_delivery: "Out for delivery with your local courier rider.",
            delivered: "Parcel delivered successfully to customer.",
            partial_delivered: "Parcel partially delivered.",
            cancelled: "Delivery cancelled.",
            returned: "Parcel returned to warehouse.",
            hold: "Delivery placed on temporary hold by courier.",
          }

          timeline.push({
            status: "Consignment Dispatched",
            message: `Booked with ${courierName}. CID: ${cid || "—"} | Tracking: ${code || "—"}`,
            created_at: order.delivery.createdAt,
          })

          // Add live courier status event
          timeline.push({
            status: currentDeliveryStatus ? currentDeliveryStatus.toUpperCase().replace(/_/g, " ") : "IN TRANSIT",
            message: courierMsgMap[currentDeliveryStatus.toLowerCase()] || `Courier Status: ${currentDeliveryStatus}`,
            created_at: order.delivery.updatedAt || order.delivery.createdAt,
          })
        }
      }
    }

    return NextResponse.json({
      invoice,
      consignmentId: order?.delivery?.consignmentId || null,
      trackingCode: order?.delivery?.trackingCode || null,
      liveStatus: liveStatus || order?.delivery?.status || "in_review",
      returnStatus,
      timeline,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch tracking timeline" }, { status: 500 })
  }
}
