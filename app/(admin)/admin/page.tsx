import Link from "next/link"
import prisma from "@/lib/prisma"
import RevenueChart from "@/components/admin/RevenueChart"
import {
  ShoppingCart, Users, Package, TrendingUp, Clock,
  RotateCcw, ArrowUpRight, ChevronRight, PlusCircle,
  MessageSquare, ArrowDownRight, Sparkles, CheckCircle2, ShieldAlert
} from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCESSING: { label: "Processing", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SHIPPED:    { label: "Shipped",    cls: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-rose-50 text-rose-700 border-rose-200" },
  RETURNED:   { label: "Returned",   cls: "bg-orange-50 text-orange-700 border-orange-200" },
}

export default async function DashboardPage() {
  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const sixtyDaysAgo = new Date(today); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59)

  const [
    ordersToday,
    ordersYesterday,
    pendingOrders,
    customersTotal,
    newCustomersToday,
    lowStockCount,
    outOfStockCount,
    pendingReturns,
    unreadMessages,
    revenueOrders7d,
    revenueTodayAggr,
    revenueYesterdayAggr,
    revenue30dAggr,
    revenuePrior30dAggr,
    recentOrders,
  ] = await Promise.all([
    // Today's orders count
    prisma.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    // Yesterday's orders count
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }).catch(() => 0),
    // Orders needing action
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }).catch(() => 0),
    // Total customers
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    // Customers joined today
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today } } }).catch(() => 0),
    // Low stock SKUs
    prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }).catch(() => 0),
    // Out of stock SKUs
    prisma.productVariant.count({ where: { stock: 0 } }).catch(() => 0),
    // Pending return requests
    prisma.returnRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    // Unread support messages
    prisma.contactMessage.count({ where: { isRead: false } }).catch(() => 0),
    // 7-day orders for chart
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }).catch(() => []),
    // Revenue today
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    // Revenue yesterday
    prisma.order.aggregate({
      where: { createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    // Revenue 30d
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { total: 0 }, _count: { id: 0 } })),
    // Revenue prior 30d (for MoM comparison)
    prisma.order.aggregate({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    // Recent 6 orders
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { take: 1, select: { productName: true } },
      },
    }).catch(() => []),
  ])

  // Revenue chart by day
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sevenDaysAgo)
    date.setDate(date.getDate() + i)
    const dayOrders = revenueOrders7d.filter(
      (o) => new Date(o.createdAt).toDateString() === date.toDateString()
    )
    const total = dayOrders.reduce((s, o) => s + Number(o.total), 0)
    return {
      name: dayNames[date.getDay()],
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total,
      orders: dayOrders.length,
    }
  })

  const revToday = Number(revenueTodayAggr._sum.total || 0)
  const revYesterday = Number(revenueYesterdayAggr._sum.total || 0)
  const rev30d = Number(revenue30dAggr._sum.total || 0)
  const revPrior30d = Number(revenuePrior30dAggr._sum.total || 0)

  // Trends
  const dayTrend = revYesterday > 0 ? ((revToday - revYesterday) / revYesterday) * 100 : revToday > 0 ? 100 : 0
  const momTrend = revPrior30d > 0 ? ((rev30d - revPrior30d) / revPrior30d) * 100 : rev30d > 0 ? 100 : 0
  const aovToday = ordersToday > 0 ? Math.round(revToday / ordersToday) : 0

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Triage alert queue
  const alerts = [
    pendingOrders > 0 && {
      href: "/admin/orders?status=PENDING",
      icon: Clock,
      label: "Needs Confirmation",
      count: pendingOrders,
      text: `${pendingOrders} order${pendingOrders > 1 ? "s" : ""} awaiting processing`,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      pillBg: "bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 text-amber-900",
    },
    unreadMessages > 0 && {
      href: "/admin/contact",
      icon: MessageSquare,
      label: "Inbox",
      count: unreadMessages,
      text: `${unreadMessages} unread customer message${unreadMessages > 1 ? "s" : ""}`,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      pillBg: "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200 text-blue-900",
    },
    outOfStockCount > 0 && {
      href: "/admin/inventory",
      icon: ShieldAlert,
      label: "Stockout",
      count: outOfStockCount,
      text: `${outOfStockCount} variant${outOfStockCount > 1 ? "s" : ""} out of stock`,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      pillBg: "bg-rose-50/80 hover:bg-rose-100/80 border-rose-200 text-rose-900",
    },
    lowStockCount > 0 && {
      href: "/admin/inventory",
      icon: Package,
      label: "Low Stock",
      count: lowStockCount,
      text: `${lowStockCount} variant${lowStockCount > 1 ? "s" : ""} low on inventory`,
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      pillBg: "bg-orange-50/80 hover:bg-orange-100/80 border-orange-200 text-orange-900",
    },
    pendingReturns > 0 && {
      href: "/admin/returns",
      icon: RotateCcw,
      label: "Returns",
      count: pendingReturns,
      text: `${pendingReturns} RMA return${pendingReturns > 1 ? "s" : ""} pending review`,
      badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
      pillBg: "bg-violet-50/80 hover:bg-violet-100/80 border-violet-200 text-violet-900",
    },
  ].filter(Boolean) as any[]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Store Dashboard</h1>
          <p className="text-xs font-medium text-zinc-500 mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-2xs hover:border-zinc-300"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-zinc-500" />
            <span>New Order</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-amber-500 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Operational Triage Action Queue */}
      {alerts.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Action Required ({alerts.reduce((acc, a) => acc + a.count, 0)} items)
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">Click to resolve</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alerts.map((alert, idx) => (
              <Link
                key={idx}
                href={alert.href}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all group ${alert.pillBg}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-white/80 shadow-2xs shrink-0">
                    <alert.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{alert.text}</p>
                    <p className="text-[10px] opacity-75">{alert.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${alert.badgeColor}`}>
                    {alert.count}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All store systems operating normally. No pending orders, stockouts, or unread messages.</span>
        </div>
      )}

      {/* Comparative KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Revenue Today"
          value={`৳${revToday.toLocaleString()}`}
          sub={
            dayTrend === 0
              ? "Same as yesterday"
              : `${dayTrend > 0 ? "+" : ""}${dayTrend.toFixed(1)}% vs yesterday`
          }
          trend={dayTrend >= 0 ? "up" : "down"}
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          title="Orders Today"
          value={String(ordersToday)}
          sub={
            aovToday > 0
              ? `Avg ৳${aovToday.toLocaleString()} / order`
              : `${pendingOrders} pending confirmation`
          }
          trend={ordersToday >= ordersYesterday ? "up" : "down"}
          icon={ShoppingCart}
          color="blue"
          href="/admin/orders"
        />
        <KpiCard
          title="30-Day Gross Revenue"
          value={`৳${rev30d.toLocaleString()}`}
          sub={
            momTrend === 0
              ? "Steady month"
              : `${momTrend > 0 ? "+" : ""}${momTrend.toFixed(1)}% vs prior month`
          }
          trend={momTrend >= 0 ? "up" : "down"}
          icon={Sparkles}
          color="violet"
          href="/admin/analytics"
        />
        <KpiCard
          title="Customer Base"
          value={customersTotal.toLocaleString()}
          sub={
            newCustomersToday > 0
              ? `+${newCustomersToday} new customer${newCustomersToday > 1 ? "s" : ""} today`
              : "Active shopper registry"
          }
          trend="up"
          icon={Users}
          color="emerald"
          href="/admin/customers"
        />
      </div>

      {/* Chart + Recent Orders Section */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Revenue 7-Day Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Revenue Performance</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Last 7 days overview</p>
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RevenueChart data={revenueByDay} />
        </div>

        {/* Live Recent Orders Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/40">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Recent Orders</h2>
              <p className="text-[11px] text-zinc-400">Latest checkout activity</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 flex-1">
            {recentOrders.length === 0 ? (
              <div className="py-14 text-center text-xs text-zinc-400">
                No orders recorded yet.
              </div>
            ) : (
              recentOrders.map((order: any) => {
                const s =
                  STATUS_STYLES[order.status] || {
                    label: order.status,
                    cls: "bg-zinc-100 text-zinc-700 border-zinc-200",
                  }
                const firstItem = order.items?.[0]?.productName || "Order item"
                const customerName = order.user?.name || order.shippingName || "Guest Customer"

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-zinc-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-amber-400/60 transition-colors">
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                            {order.orderNumber}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.2 ${s.cls}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {customerName} · <span className="text-zinc-500">{firstItem}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-zinc-900 font-mono">
                        ৳{Number(order.total).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Operations Quick Jump Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {[
          { href: "/admin/products", label: "Catalog", count: "Products & Variants", icon: Package },
          { href: "/admin/inventory", label: "Inventory", count: "Stock levels", icon: ShieldAlert },
          { href: "/admin/customers", label: "Customers", count: "User profiles", icon: Users },
          { href: "/admin/coupons", label: "Discounts", count: "Coupons & Deals", icon: Sparkles },
          { href: "/admin/contact", label: "Support Inbox", count: "Customer inquiries", icon: MessageSquare },
          { href: "/admin/settings", label: "Settings", count: "Store preferences", icon: TrendingUp },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col p-4 bg-white rounded-2xl border border-zinc-200/90 hover:border-amber-400/80 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-100 group-hover:bg-amber-50 flex items-center justify-center transition-colors mb-3">
              <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-amber-600 transition-colors" />
            </div>
            <span className="text-xs font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">
              {item.label}
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  sub,
  trend,
  icon: Icon,
  color,
  href,
}: {
  title: string
  value: string
  sub: string
  trend?: "up" | "down"
  icon: any
  color: "amber" | "blue" | "violet" | "emerald"
  href?: string
}) {
  const colors = {
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600", border: "border-amber-200/60" },
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600",  border: "border-blue-200/60" },
    violet:  { bg: "bg-violet-50",  icon: "text-violet-600", border: "border-violet-200/60" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200/60" },
  }
  const c = colors[color]
  const Wrapper = href ? Link : "div"

  return (
    <Wrapper
      href={href as string}
      className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">{value}</p>
        <p className="text-xs font-medium text-zinc-500 mt-1">{title}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {trend === "up" ? (
            <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <ArrowDownRight className="w-3 h-3 text-rose-500 shrink-0" />
          )}
          <span className="text-[11px] font-medium text-zinc-500 truncate">{sub}</span>
        </div>
      </div>
    </Wrapper>
  )
}
