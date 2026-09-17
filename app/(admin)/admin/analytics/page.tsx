import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import AnalyticsDashboard from "./AnalyticsDashboard"

export default async function AnalyticsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [topSearches, funnelCounts] = await Promise.all([
    prisma.searchAnalytic.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 20,
    }),
    prisma.funnelEvent.groupBy({
      by: ["event"],
      _count: { event: true },
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ])

  return (
    <AnalyticsDashboard
      topSearches={topSearches.map((s) => ({ query: s.query, count: s._count.query }))}
      funnelCounts={Object.fromEntries(funnelCounts.map((f) => [f.event, f._count.event]))}
    />
  )
}
