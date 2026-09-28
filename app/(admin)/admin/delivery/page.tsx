import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { DeliveryClient } from "./DeliveryClient"
import { startOfMonth, endOfMonth } from "date-fns"
import { Truck, Send, CheckCircle2, AlertTriangle, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ courier?: string; status?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const resolvedParams = await searchParams
  const courierFilter = resolvedParams?.courier
  const statusFilter = resolvedParams?.status

  const where: any = {}
  if (courierFilter) where.courier = courierFilter
  if (statusFilter) where.status = statusFilter

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const startMonth = startOfMonth(now)
  const endMonth = endOfMonth(now)

  const monthStats = await prisma.delivery.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: startMonth,
        lte: endMonth,
      },
    },
    _count: {
      _all: true,
    },
  })

  const stats = {
    totalSent: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
  }

  monthStats.forEach((stat) => {
    stats.totalSent += stat._count._all
    if (stat.status === "IN_TRANSIT") stats.inTransit += stat._count._all
    if (stat.status === "DELIVERED") stats.delivered += stat._count._all
    if (stat.status === "FAILED" || stat.status === "RETURNED") stats.failed += stat._count._all
  })

  const formattedData = deliveries.map((d) => ({
    id: d.id,
    orderId: d.orderId,
    orderNumber: d.order.orderNumber,
    customerName: d.order.user?.name || d.order.shippingName,
    shippingPhone: d.order.shippingPhone,
    courier: d.courier,
    consignmentId: d.consignmentId,
    trackingCode: d.trackingCode,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Truck className="w-3.5 h-3.5" />
              Logistics & Couriers
            </span>
            <span className="text-xs text-zinc-600 font-medium">Pathao & Steadfast integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Delivery & Courier Dispatch</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Monitor consignment tracking, real-time parcel transit states, failed attempts, and automatic courier sync.
          </p>
        </div>
      </div>

      <DeliveryClient data={formattedData} stats={stats} />
    </div>
  )
}
