import prisma from "@/lib/prisma"
import { CustomerClient } from "./CustomerClient"
import { Users, UserCheck, ShoppingBag, DollarSign, ArrowUpRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search = "" } = await searchParams

  const searchWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {}

  // Registered users
  const users = await prisma.user.findMany({
    where: searchWhere,
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Guest orders (no user account)
  const guestOrders = await prisma.order.findMany({
    where: {
      userId: null,
      ...(search
        ? {
            OR: [
              { shippingName: { contains: search, mode: "insensitive" } },
              { guestEmail: { contains: search, mode: "insensitive" } },
              { shippingPhone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by guestEmail when present, otherwise by "name|phone" fingerprint
  const guestMap = new Map<string, typeof guestOrders>()
  for (const o of guestOrders) {
    const key = o.guestEmail
      ? `email:${o.guestEmail}`
      : `name:${(o.shippingName || "Guest").toLowerCase().trim()}|${(o.shippingPhone || "").trim()}`
    if (!guestMap.has(key)) guestMap.set(key, [])
    guestMap.get(key)!.push(o)
  }

  const registeredCustomers = users.map((user) => {
    const totalSpent = user.orders
      .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0)
    return {
      id: user.id,
      name: user.name || "—",
      email: user.email,
      phone: user.phone || "—",
      role: user.role,
      isLocked: user.isLocked,
      joinedDate: user.createdAt.toISOString(),
      totalOrders: user.orders.length,
      totalSpent,
      lastOrderAt: user.orders[0]?.createdAt.toISOString() ?? user.createdAt.toISOString(),
      orders: user.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    }
  })

  const guestCustomers = Array.from(guestMap.entries()).map(([, orders]) => {
    const latest = orders[0]
    const totalSpent = orders
      .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0)
    const email = latest.guestEmail ?? `guest-${latest.id}@no-email`
    return {
      id: `guest:${email}`,
      name: latest.shippingName || "Guest",
      email: latest.guestEmail ?? "—",
      phone: latest.shippingPhone || "—",
      role: "GUEST",
      isLocked: false,
      joinedDate: latest.createdAt.toISOString(),
      totalOrders: orders.length,
      totalSpent,
      lastOrderAt: latest.createdAt.toISOString(),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    }
  })

  // Merge and sort by most recent activity
  const customers = [...registeredCustomers, ...guestCustomers].sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  )

  const totalLTV = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrdersCount = customers.reduce((sum, c) => sum + c.totalOrders, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <Users className="w-3.5 h-3.5" />
              Customer Relationship Hub
            </span>
            <span className="text-xs text-zinc-600 font-medium">Unified registered & guest directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Customer Accounts & LTV</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Monitor lifetime customer value, order history, repeat purchase rates, and account access permissions.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Unique Shoppers</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{customers.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Registered & Guest unified</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Registered Accounts</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{registeredCustomers.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">
              {customers.length > 0 ? Math.round((registeredCustomers.length / customers.length) * 100) : 0}% of total shoppers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Lifetime Value</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{totalLTV.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">
              Avg ৳{customers.length > 0 ? Math.round(totalLTV / customers.length).toLocaleString() : 0} / customer
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Completed Orders</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{totalOrdersCount}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Lifetime purchases</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Customer Client & Table */}
      <CustomerClient data={customers} />
    </div>
  )
}
