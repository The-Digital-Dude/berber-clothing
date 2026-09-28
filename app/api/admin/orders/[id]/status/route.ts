import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendOrderStatusUpdate, sendShippingDispatched, sendOrderDelivered } from "@/lib/email"
import { buildWhatsAppMessage, buildWaLink, sendWhatsAppMessage } from "@/lib/whatsapp"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      updateData.payment = {
        update: { status: paymentStatus }
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { email: true, name: true } },
        items: { take: 1, include: { product: { select: { name: true } } } },
        reseller: true,
      },
    })

    // Reseller profit crediting on successful delivery
    if (status === "DELIVERED" && order.isResellerOrder && order.resellerId && !order.resellerProfitPaid) {
      const profit = Number(order.resellerProfit || 0)
      if (profit > 0) {
        await prisma.$transaction([
          prisma.affiliate.update({
            where: { id: order.resellerId },
            data: {
              walletBalance: { increment: profit },
              totalEarned: { increment: profit },
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { resellerProfitPaid: true },
          }),
        ]).catch(() => {})
      }
    }

    // WhatsApp notification — Cloud API if configured, otherwise return wa.me link for manual send
    let waLink: string | null = null
    if (status && order.shippingPhone) {
      const waMsg = buildWhatsAppMessage({
        customerName: order.user?.name || order.shippingName,
        orderNumber: order.orderNumber,
        status,
        trackingNumber: body.trackingNumber,
        note: body.note,
      })
      const sent = await sendWhatsAppMessage(order.shippingPhone, waMsg).catch(() => false)
      if (!sent) waLink = buildWaLink(order.shippingPhone, waMsg)
    }

    if (status) {
      await prisma.orderStatusLog.create({
        data: { orderId: id, status, note: `Status updated to ${status} via Admin Panel` },
      })

      // Email notification (fire-and-forget)
      const toEmail = order.user?.email || order.guestEmail
      const customerName = order.user?.name || order.shippingName
      if (toEmail) {
        if (status === "SHIPPED") {
          sendShippingDispatched({
            to: toEmail,
            customerName: customerName || "Customer",
            orderNumber: order.orderNumber,
            courierName: body.courierName || "Our courier",
            trackingNumber: body.trackingNumber || "",
            trackingUrl: body.trackingUrl,
          }).catch(() => {})
        } else if (status === "DELIVERED") {
          sendOrderDelivered({
            to: toEmail,
            customerName: customerName || "Customer",
            orderNumber: order.orderNumber,
            productName: order.items[0]?.product?.name || "your order",
          }).catch(() => {})
        } else if (["CONFIRMED", "PROCESSING", "CANCELLED"].includes(status)) {
          sendOrderStatusUpdate({
            to: toEmail,
            customerName: customerName || "Customer",
            orderNumber: order.orderNumber,
            status,
            note: body.note,
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ ...order, waLink })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
