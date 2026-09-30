import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createConsignment } from "@/lib/steadfast"
import { calculateCodAmount } from "@/app/api/courier/steadfast/route"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { orderIds } = await req.json()
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "orderIds array is required" }, { status: 400 })
    }

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: { notIn: ["CANCELLED", "DELIVERED", "RETURNED"] },
      },
      include: {
        delivery: true,
      },
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No eligible unfulfilled orders found for dispatch." },
        { status: 400 }
      )
    }

    const results: { orderId: string; orderNumber: string; success: boolean; consignmentId?: string; error?: string }[] = []

    for (const order of orders) {
      try {
        if (!order.shippingPhone) {
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            success: false,
            error: "Missing shipping phone",
          })
          continue
        }

        const fullAddress = [
          order.shippingAddress,
          order.shippingArea,
          order.shippingDistrict,
          order.shippingDivision,
        ]
          .filter(Boolean)
          .join(", ") || "Address not provided"

        const codAmount = calculateCodAmount(order)

        const consignment = await createConsignment({
          invoice: order.orderNumber,
          recipient_name: order.shippingName || "Customer",
          recipient_phone: order.shippingPhone,
          recipient_address: fullAddress,
          cod_amount: codAmount,
          note: order.note ?? undefined,
        })

        await prisma.delivery.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
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

        if (["PENDING", "CONFIRMED", "PACKED"].includes(order.status)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "SHIPPED" },
          })
        }

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: true,
          consignmentId: String(consignment.consignment_id),
        })
      } catch (err: any) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: err.message || "Steadfast dispatch failed",
        })
      }
    }

    const successfulCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: successfulCount > 0,
      dispatched: successfulCount,
      failed: failedCount,
      results,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Bulk dispatch failed" },
      { status: 500 }
    )
  }
}
