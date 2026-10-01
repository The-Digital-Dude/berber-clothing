import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ orders: [] })
    }

    const orders = await prisma.bespokeOrder.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        measurementProfile: true,
        timelineLogs: {
          orderBy: { createdAt: "desc" },
        },
        appointments: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[ACCOUNT_BESPOKE_ORDERS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch bespoke orders" }, { status: 500 })
  }
}
