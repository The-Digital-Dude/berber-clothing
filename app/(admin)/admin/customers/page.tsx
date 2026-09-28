import prisma from "@/lib/prisma"
import { CustomerClient } from "./CustomerClient"
import { Users, UserPlus } from "lucide-react"

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

  // Guest orders (no user account) — includes orders with AND without guestEmail
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

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Customers</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {registeredCustomers.length} registered · {guestCustomers.length} guests
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage customer accounts, lifetime value, and order history
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <CustomerClient data={customers} />
      </div>
    </div>
  )
}
