import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { orderNumber } = await req.json()
    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: orderNumber.trim() },
      include: {
        items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } },
        delivery: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "No order found with that order number" }, { status: 404 })
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        productName: i.productName,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
        image: i.product.images[0]?.url || null,
      })),
      delivery: order.delivery
        ? { courier: order.delivery.courier, trackingCode: order.delivery.trackingCode }
        : null,
      statusLogs: order.statusLogs.map((l) => ({ status: l.status, createdAt: l.createdAt })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
