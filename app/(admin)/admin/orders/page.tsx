import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import OrdersFilters from "./OrdersFilters"
import OrdersBulkClient from "./OrdersBulkClient"
import AdminPagination from "@/components/admin/AdminPagination"
import { getCustomerRiskBatch } from "@/lib/customerRisk"
import { serialize } from "@/lib/utils"
import { Download, PlusCircle, ShoppingCart, Clock, Truck, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 20

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentMethod?: string
    courier?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status || ""
  const paymentMethod = params.paymentMethod || ""
  const courier = params.courier || ""
  const page = Math.max(1, parseInt(params.page || "1"))
  const skip = (page - 1) * PAGE_SIZE

  // Base search conditions
  const where: any = {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { shippingName: { contains: search, mode: "insensitive" } },
            { shippingPhone: { contains: search, mode: "insensitive" } },
            { shippingArea: { contains: search, mode: "insensitive" } },
            { shippingDistrict: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(courier ? { delivery: { courier } } : {}),
  }

  // Parallel server-side data fetching
  const [
    orders,
    totalFiltered,
    totalAllOrders,
    pendingCount,
    fulfillmentCount,
    deliveredCount,
    cancelledCount,
    revenueAggr,
    statusGroupCounts,
  ] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { take: 3, select: { productName: true, size: true, color: true, quantity: true, price: true } },
        delivery: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.order.count({ where: { status: { in: ["PENDING"] } } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PACKED", "SHIPPED"] } } }).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED" } }).catch(() => 0),
    prisma.order.count({ where: { status: "CANCELLED" } }).catch(() => 0),
    prisma.order.aggregate({
      where: { ...where, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }).catch(() => []),
  ])

  // Compute status counts dictionary for tabs
  const statusCounts: Record<string, number> = {
    ALL: totalAllOrders,
    PENDING: 0,
    CONFIRMED: 0,
    PACKED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    RETURNED: 0,
  }
  for (const g of statusGroupCounts) {
    statusCounts[g.status] = g._count.id
  }

  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE)
  const serializedOrders = serialize(orders)
  const totalRev = Number(revenueAggr._sum.total || 0)

  // Risk batch lookup
  const phoneNumbers = orders.map((o: any) => o.shippingPhone).filter(Boolean)
  const riskMap = await getCustomerRiskBatch(phoneNumbers).catch(() => new Map())
  const riskByPhone = Object.fromEntries(riskMap)

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders Management</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
              {totalFiltered} matching
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage customer fulfillment, update ordered items/sizes, track courier parcels & print packing slips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/api/admin/orders/export${status ? `?status=${status}` : ""}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </Button>
          </a>
          <Link href="/admin/orders/new">
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Registry</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono mt-1">
              {totalAllOrders.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{deliveredCount} delivered</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Action Required: Pending */}
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Action</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-950 font-mono mt-1">
              {pendingCount}
            </p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting verification</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* In Fulfillment */}
        <div className="bg-white rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/30 to-white p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-700">In Fulfillment</p>
            <p className="text-2xl font-bold tracking-tight text-blue-950 font-mono mt-1">
              {fulfillmentCount}
            </p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Confirmed / Dispatched</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Order Volume Revenue */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 to-white p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-700">Filtered Value</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-950 font-mono mt-1">
              ৳{totalRev.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">{totalFiltered} matching orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Orders Table Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <OrdersFilters
          currentSearch={search}
          currentStatus={status}
          currentPayment={paymentMethod}
          currentCourier={courier}
          statusCounts={statusCounts}
        />
        <OrdersBulkClient orders={serializedOrders as any} riskByPhone={riskByPhone} />
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/40">
          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/orders" />
        </div>
      </div>
    </div>
  )
}
