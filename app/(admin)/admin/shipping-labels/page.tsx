import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ShippingLabelsClient from "./ShippingLabelsClient"

export const dynamic = "force-dynamic"

export default async function ShippingLabelsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const rawLabels = await prisma.shippingLabel.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const labelledOrderIds = rawLabels.map((l) => l.orderId)
  const labelOrders = labelledOrderIds.length > 0
    ? await prisma.order.findMany({ where: { id: { in: labelledOrderIds } }, select: { id: true, orderNumber: true, shippingName: true, shippingPhone: true, shippingAddress: true, shippingDistrict: true, total: true, paymentMethod: true } })
    : []
  const orderMap = Object.fromEntries(labelOrders.map((o) => [o.id, o]))
  const labels = rawLabels.map((l) => ({ ...l, order: orderMap[l.orderId] ?? null }))
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: { in: ["CONFIRMED", "PROCESSING", "PACKED"] },
      ...(labelledOrderIds.length > 0 ? { id: { notIn: labelledOrderIds } } : {}),
    },
    select: { id: true, orderNumber: true, shippingName: true, shippingPhone: true, shippingAddress: true, shippingDistrict: true, total: true, paymentMethod: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipping Labels</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and track courier labels for Steadfast and Pathao.</p>
      </div>
      <ShippingLabelsClient labels={JSON.parse(JSON.stringify(labels))} pendingOrders={JSON.parse(JSON.stringify(pendingOrders))} />
    </div>
  )
}
