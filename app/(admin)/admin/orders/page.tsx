import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import OrdersFilters from "./OrdersFilters"
import OrdersBulkClient from "./OrdersBulkClient"
import AdminPagination from "@/components/admin/AdminPagination"
import { serialize } from "@/lib/utils"
import { Download, PlusCircle, ShoppingCart, Clock, Truck, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentMethod?: string
    courier?: string
    page?: string
    limit?: string
  }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status || ""
  const paymentMethod = params.paymentMethod || ""
  const courier = params.courier || ""
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "20", 10)))
  const skip = (page - 1) * limit

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
      take: limit,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.order.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["PROCESSING", "CONFIRMED", "SHIPPED"] } } }).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED" } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["CANCELLED", "RETURNED"] } } }).catch(() => 0),
    prisma.order.aggregate({
      where,
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: null } })),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }).catch(() => []),
  ])

  // Process status counts for filter tabs
  const statusCounts: Record<string, number> = {}
  statusGroupCounts.forEach((item: any) => {
    statusCounts[item.status] = item._count._all
  })

  const totalPages = Math.ceil(totalFiltered / limit) || 1
  const serializedOrders = serialize(orders)
  const totalRev = Number(revenueAggr._sum.total || 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalAllOrders.toLocaleString()} Total Orders
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage store orders, bulk dispatch shipments, print invoices, and update delivery statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/orders/export">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </Button>
          </Link>
          <Link href="/admin/orders/new">
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Operations KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Pending Action */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">Pending Review</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono mt-1">
              {pendingCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Requires confirmation</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Processing / In Fulfillment */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">In Fulfillment</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono mt-1">
              {fulfillmentCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Processing / In Transit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Successfully Delivered */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">Delivered</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono mt-1">
              {deliveredCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Completed orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Cancelled / Returns */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">Cancelled / Return</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono mt-1">
              {cancelledCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Unfulfilled / Returned</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
            <AlertTriangle className="w-5 h-5" />
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
        <OrdersBulkClient
          key={`orders-${page}-${limit}-${search}-${status}-${paymentMethod}-${courier}`}
          orders={serializedOrders as any}
        />
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/40">
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalFiltered}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50, 100]}
            basePath="/admin/orders"
          />
        </div>
      </div>
    </div>
  )
}
