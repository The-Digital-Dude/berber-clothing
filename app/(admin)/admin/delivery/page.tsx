import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { DeliveryClient } from "./DeliveryClient"
import { startOfMonth, endOfMonth } from "date-fns"
import { Truck, Send, CheckCircle2, AlertTriangle, Clock, Zap, Settings } from "lucide-react"
import Link from "next/link"
import { getSteadfastConfig } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ courier?: string; status?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const resolvedParams = await searchParams
  const statusFilter = resolvedParams?.status

  const where: any = {}
  if (statusFilter) where.status = statusFilter

  const [deliveries, config] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getSteadfastConfig(),
  ])

  const isConfigured = Boolean(config.apiKey && config.secretKey)

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
    if (stat.status === "IN_TRANSIT" || stat.status === "PICKED_UP" || stat.status === "in_review") stats.inTransit += stat._count._all
    if (stat.status === "DELIVERED" || stat.status === "delivered" || stat.status === "partial_delivered") stats.delivered += stat._count._all
    if (stat.status === "FAILED" || stat.status === "RETURNED" || stat.status === "returned" || stat.status === "cancelled") stats.failed += stat._count._all
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Zap className="w-3.5 h-3.5" />
              Steadfast Courier Logistics Hub
            </span>
            <span className="text-xs text-zinc-600 font-medium">Automated parcel dispatch & live tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Delivery & Courier Dispatch</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Monitor Steadfast consignment tracking, real-time parcel transit states, failed attempts, and automatic courier sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span>Courier API Settings</span>
          </Link>
        </div>
      </div>

      {!isConfigured && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/80 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Steadfast API Key & Secret Key are not configured</p>
              <p className="text-amber-700 mt-0.5">
                Configure your Steadfast credentials in Admin Settings to enable 1-Click Dispatches and automated tracking updates.
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shrink-0"
          >
            Configure Keys Now
          </Link>
        </div>
      )}

      <DeliveryClient data={formattedData} stats={stats} />
    </div>
  )
}
