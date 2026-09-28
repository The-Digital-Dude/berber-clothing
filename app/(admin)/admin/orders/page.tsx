import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import OrdersFilters from "./OrdersFilters"
import OrdersBulkClient from "./OrdersBulkClient"
import AdminPagination from "@/components/admin/AdminPagination"
import { getCustomerRiskBatch } from "@/lib/customerRisk"
import { serialize } from "@/lib/utils"
import { Download, PlusCircle, ShoppingCart } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 20

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; paymentMethod?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status || ""
  const paymentMethod = params.paymentMethod || ""
  const page = Math.max(1, parseInt(params.page || "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: any = {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { shippingName: { contains: search, mode: "insensitive" } },
            { shippingPhone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const serializedOrders = serialize(orders)

  const riskMap = await getCustomerRiskBatch(orders.map((o: any) => o.shippingPhone)).catch(() => new Map())
  const riskByPhone = Object.fromEntries(riskMap)

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {total} total
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage customer orders, track fulfillment states & packing slips
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
              className="h-9 px-3.5 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <OrdersFilters
          currentSearch={search}
          currentStatus={status}
          currentPayment={paymentMethod}
        />
        <OrdersBulkClient orders={serializedOrders as any} riskByPhone={riskByPhone} />
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/40">
          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/orders" />
        </div>
      </div>
    </div>
  )
}
