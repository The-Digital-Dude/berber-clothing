import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import AnalyticsDashboard from "./AnalyticsDashboard"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const now = new Date()
  const d30 = new Date(now); d30.setDate(d30.getDate() - 29); d30.setHours(0, 0, 0, 0)
  const d7  = new Date(now); d7.setDate(d7.getDate() - 6);   d7.setHours(0, 0, 0, 0)
  const d90 = new Date(now); d90.setDate(d90.getDate() - 89); d90.setHours(0, 0, 0, 0)

  const [
    // Revenue: daily for last 30 days
    revenueOrders,
    // Funnel: last 30 days
    funnelCounts,
    // Top products by page views (last 30 days)
    topProductViews,
    // Top products by add-to-cart (last 30 days)
    topProductCart,
    // Top searches (all time, top 20)
    topSearches,
    // Zero-result searches (last 30 days)
    zeroResultSearches,
    // Order counts by status
    ordersByStatus,
    // Revenue KPIs
    revenue7d,
    revenue30d,
    revenue90d,
    // AOV
    aovData,
    // New customers last 30d
    newCustomers,
    // Total customers
    totalCustomers,
    // Repeat customers (more than 1 order)
    repeatCustomers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: d30 }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }).catch(() => []),

    prisma.funnelEvent.groupBy({
      by: ["event"],
      _count: { event: true },
      where: { createdAt: { gte: d30 } },
    }).catch(() => []),

    prisma.funnelEvent.groupBy({
      by: ["productId"],
      _count: { productId: true },
      where: { event: "page_view", productId: { not: null }, createdAt: { gte: d30 } },
      orderBy: { _count: { productId: "desc" } },
      take: 8,
    }).catch(() => []),

    prisma.funnelEvent.groupBy({
      by: ["productId"],
      _count: { productId: true },
      where: { event: "add_to_cart", productId: { not: null }, createdAt: { gte: d30 } },
      orderBy: { _count: { productId: "desc" } },
      take: 8,
    }).catch(() => []),

    prisma.searchAnalytic.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 20,
    }).catch(() => []),

    prisma.searchAnalytic.findMany({
      where: { resultsCount: 0, createdAt: { gte: d30 } },
      select: { query: true },
    }).then(rows => {
      const freq: Record<string, number> = {}
      for (const r of rows) freq[r.query] = (freq[r.query] ?? 0) + 1
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }))
    }).catch(() => []),

    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }).catch(() => []),

    prisma.order.aggregate({ where: { createdAt: { gte: d7 }, status: { not: "CANCELLED" } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.aggregate({ where: { createdAt: { gte: d30 }, status: { not: "CANCELLED" } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.aggregate({ where: { createdAt: { gte: d90 }, status: { not: "CANCELLED" } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),

    prisma.order.aggregate({ where: { createdAt: { gte: d30 }, status: { not: "CANCELLED" } }, _avg: { total: true }, _count: true }).catch(() => ({ _avg: { total: 0 }, _count: 0 })),

    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    prisma.order.groupBy({ by: ["userId"], _count: { userId: true }, having: { userId: { _count: { gt: 1 } } } }).then(r => r.length).catch(() => 0),
  ])

  // Build 30-day revenue chart
  const dayMs = 86400000
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(d30.getTime() + i * dayMs)
    const ds = date.toDateString()
    const total = revenueOrders
      .filter(o => new Date(o.createdAt).toDateString() === ds)
      .reduce((s, o) => s + Number(o.total), 0)
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total,
    }
  })

  // Resolve product IDs → names
  const productIds = [
    ...new Set([
      ...topProductViews.map(r => r.productId!),
      ...topProductCart.map(r => r.productId!),
    ].filter(Boolean))
  ]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  }).catch(() => [])
  const productName = Object.fromEntries(products.map(p => [p.id, p.name]))

  const funnelMap = Object.fromEntries(funnelCounts.map(f => [f.event, f._count.event]))

  return (
    <AnalyticsDashboard
      revenueByDay={revenueByDay}
      revenue7d={Number(revenue7d._sum.total || 0)}
      revenue30d={Number(revenue30d._sum.total || 0)}
      revenue90d={Number(revenue90d._sum.total || 0)}
      aov={Math.round(Number(aovData._avg.total || 0))}
      orderCount30d={(aovData as any)._count ?? 0}
      newCustomers={newCustomers}
      totalCustomers={totalCustomers}
      repeatCustomers={repeatCustomers}
      funnelCounts={funnelMap}
      topProductViews={topProductViews.map(r => ({ name: productName[r.productId!] ?? r.productId!, count: r._count.productId }))}
      topProductCart={topProductCart.map(r => ({ name: productName[r.productId!] ?? r.productId!, count: r._count.productId }))}
      topSearches={topSearches.map(s => ({ query: s.query, count: s._count.query }))}
      zeroResultSearches={zeroResultSearches}
      ordersByStatus={ordersByStatus.map(o => ({ status: o.status, count: o._count.status }))}
    />
  )
}
