import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.bespokeOrder.findUnique({
      where: { id },
      include: {
        user: true,
        measurementProfile: true,
        timelineLogs: {
          orderBy: { createdAt: "desc" },
        },
        appointments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_ORDER_GET]", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
