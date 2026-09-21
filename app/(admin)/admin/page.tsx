import Link from "next/link"
import prisma from "@/lib/prisma"
import RevenueChart from "@/components/admin/RevenueChart"
import {
  ShoppingCart, Users, Package, TrendingUp, Clock, AlertTriangle,
  RotateCcw, ArrowUpRight, ChevronRight, PlusCircle, ExternalLink,
} from "lucide-react"

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCESSING: { label: "Processing", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  SHIPPED:    { label: "Shipped",    cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  DELIVERED:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-red-50 text-red-700 border-red-200" },
  RETURNED:   { label: "Returned",   cls: "bg-orange-50 text-orange-700 border-orange-200" },
}

export default async function DashboardPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [
    ordersToday, pendingOrders, customersTotal, newCustomersToday,
    lowStockCount, outOfStockCount, pendingReturns,
    revenueOrders, revenue30d, recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }).catch(() => 0),
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today } } }).catch(() => 0),
    prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }).catch(() => 0),
    prisma.productVariant.count({ where: { stock: 0 } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.order.findMany({ where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } }, select: { createdAt: true, total: true } }).catch(() => []),
    prisma.order.aggregate({ where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }).catch(() => []),
  ])

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sevenDaysAgo); date.setDate(date.getDate() + i)
    const total = revenueOrders
      .filter(o => new Date(o.createdAt).toDateString() === date.toDateString())
      .reduce((s, o) => s + Number(o.total), 0)
    return { name: dayNames[date.getDay()], total }
  })

  const revenueToday = revenueOrders.filter(o => new Date(o.createdAt).toDateString() === today.toDateString()).reduce((s, o) => s + Number(o.total), 0)
  const revenue30dTotal = Number(revenue30d._sum.total || 0)
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const alerts = [
    pendingOrders > 0 && { href: "/admin/orders", icon: Clock, color: "amber", text: `${pendingOrders} order${pendingOrders > 1 ? "s" : ""} need confirmation` },
    outOfStockCount > 0 && { href: "/admin/inventory", icon: AlertTriangle, color: "red", text: `${outOfStockCount} variant${outOfStockCount > 1 ? "s" : ""} out of stock` },
    lowStockCount > 0 && { href: "/admin/inventory", icon: Package, color: "orange", text: `${lowStockCount} variant${lowStockCount > 1 ? "s" : ""} running low` },
    pendingReturns > 0 && { href: "/admin/returns", icon: RotateCcw, color: "purple", text: `${pendingReturns} return${pendingReturns > 1 ? "s" : ""} to review` },
  ].filter(Boolean) as { href: string; icon: any; color: string; text: string }[]

  const alertColors: Record<string, string> = {
    amber:  "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    red:    "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
    orange: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
    purple: "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders/new"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <ShoppingCart className="w-3.5 h-3.5" /> New Order
          </Link>
          <Link href="/admin/products/new"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-amber-500 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20">
            <PlusCircle className="w-3.5 h-3.5" /> Add Product
          </Link>
        </div>
      </div>

      {/* Alert banners */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <Link key={i} href={a.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${alertColors[a.color]}`}>
              <a.icon className="w-4 h-4 shrink-0" />
              {a.text}
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            </Link>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Revenue Today" value={`৳${revenueToday.toLocaleString()}`}
          sub={`৳${revenue30dTotal.toLocaleString()} · 30 days`}
          icon={TrendingUp} color="amber"
        />
        <KpiCard
          title="Orders Today" value={String(ordersToday)}
          sub={pendingOrders > 0 ? `${pendingOrders} pending` : "All confirmed"}
          icon={ShoppingCart} color={pendingOrders > 0 ? "orange" : "blue"}
          href="/admin/orders"
        />
        <KpiCard
          title="Total Customers" value={customersTotal.toLocaleString()}
          sub={newCustomersToday > 0 ? `+${newCustomersToday} today` : "No new today"}
          icon={Users} color="violet"
          href="/admin/customers"
        />
        <KpiCard
          title="Stock Alerts" value={String(lowStockCount + outOfStockCount)}
          sub={outOfStockCount > 0 ? `${outOfStockCount} out of stock` : "No stockouts"}
          icon={Package} color={outOfStockCount > 0 ? "red" : "emerald"}
          href="/admin/inventory"
        />
      </div>

      {/* Chart + recent orders */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">
              Full report <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <RevenueChart data={revenueByDay} />
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No orders yet</div>
            )}
            {recentOrders.map((order: any) => {
              const s = STATUS_STYLES[order.status] || { label: order.status, cls: "bg-gray-100 text-gray-600 border-gray-200" }
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-600 transition-colors truncate">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{order.user?.name || order.shippingName || "Guest"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-bold text-gray-900">৳{Number(order.total).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: "/admin/products", label: "Products", icon: Package },
          { href: "/admin/customers", label: "Customers", icon: Users },
          { href: "/admin/coupons", label: "Coupons", icon: ShoppingCart },
          { href: "/admin/inventory", label: "Inventory", icon: Package },
          { href: "/admin/returns", label: "Returns", icon: RotateCcw },
          { href: "/admin/settings", label: "Settings", icon: TrendingUp },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 hover:border-amber-300 hover:shadow-sm hover:shadow-amber-50 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function KpiCard({ title, value, sub, icon: Icon, color, href }: {
  title: string; value: string; sub: string; icon: any
  color: "amber" | "blue" | "violet" | "emerald" | "red" | "orange"
  href?: string
}) {
  const colors = {
    amber:   { bg: "bg-amber-50",   icon: "text-amber-500",   ring: "ring-amber-200" },
    blue:    { bg: "bg-blue-50",    icon: "text-blue-500",    ring: "ring-blue-200" },
    violet:  { bg: "bg-violet-50",  icon: "text-violet-500",  ring: "ring-violet-200" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", ring: "ring-emerald-200" },
    red:     { bg: "bg-red-50",     icon: "text-red-500",     ring: "ring-red-200" },
    orange:  { bg: "bg-orange-50",  icon: "text-orange-500",  ring: "ring-orange-200" },
  }
  const c = colors[color]
  const Wrapper = href ? Link : "div"

  return (
    <Wrapper href={href as string}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {href && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </Wrapper>
  )
}
