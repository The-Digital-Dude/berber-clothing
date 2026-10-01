import prisma from "@/lib/prisma"
import BespokeOrdersAdminClient from "./BespokeOrdersAdminClient"

export const dynamic = "force-dynamic"

export default async function AdminBespokeOrdersPage() {
  const orders = await prisma.bespokeOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      measurementProfile: true,
      timelineLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const serialized = orders.map((o) => ({
    ...o,
    basePrice: Number(o.basePrice),
    customizationsPrice: Number(o.customizationsPrice),
    totalPrice: Number(o.totalPrice),
    depositAmount: o.depositAmount ? Number(o.depositAmount) : null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    targetDeliveryDate: o.targetDeliveryDate?.toISOString?.() || null,
    trialFittingDate: o.trialFittingDate?.toISOString?.() || null,
    alterationRequestedAt: o.alterationRequestedAt?.toISOString?.() || null,
    timelineLogs: o.timelineLogs.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BespokeOrdersAdminClient initialOrders={serialized} />
    </div>
  )
}
