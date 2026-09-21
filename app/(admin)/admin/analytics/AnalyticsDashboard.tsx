"use client"

import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts"
import { TrendingUp, Users, ShoppingCart, Search, BarChart2, AlertCircle, Package } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  revenueByDay: { date: string; total: number }[]
  revenue7d: number
  revenue30d: number
  revenue90d: number
  aov: number
  orderCount30d: number
  newCustomers: number
  totalCustomers: number
  repeatCustomers: number
  funnelCounts: Record<string, number>
  topProductViews: { name: string; count: number }[]
  topProductCart: { name: string; count: number }[]
  topSearches: { query: string; count: number }[]
  zeroResultSearches: { query: string; count: number }[]
  ordersByStatus: { status: string; count: number }[]
}

// ─── Colours & labels ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  PENDING:    "#f59e0b",
  CONFIRMED:  "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED:    "#6366f1",
  DELIVERED:  "#10b981",
  CANCELLED:  "#ef4444",
  RETURNED:   "#f97316",
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing",
  SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled", RETURNED: "Returned",
}

const FUNNEL_STEPS = [
  { key: "page_view",      label: "Page Views",     color: "#f59e0b" },
  { key: "add_to_cart",   label: "Add to Cart",    color: "#3b82f6" },
  { key: "checkout_start",label: "Checkout Start",  color: "#8b5cf6" },
  { key: "purchase",      label: "Purchased",       color: "#10b981" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return `৳${n.toLocaleString()}` }

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string
  icon: any; accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-gray-900 mb-4">{children}</h2>
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalyticsDashboard({
  revenueByDay, revenue7d, revenue30d, revenue90d, aov, orderCount30d,
  newCustomers, totalCustomers, repeatCustomers,
  funnelCounts, topProductViews, topProductCart,
  topSearches, zeroResultSearches, ordersByStatus,
}: Props) {

  const maxViews = topProductViews[0]?.count ?? 1
  const maxCart  = topProductCart[0]?.count ?? 1
  const maxSearch = topSearches[0]?.count ?? 1

  // Funnel conversion rates
  const funnelRows = FUNNEL_STEPS.map((step, i) => {
    const count = funnelCounts[step.key] ?? 0
    const prev = i === 0 ? count : (funnelCounts[FUNNEL_STEPS[i - 1].key] ?? 0)
    const rate = i === 0 ? 100 : prev > 0 ? Math.round((count / prev) * 100) : 0
    return { ...step, count, rate }
  })

  const pieData = ordersByStatus.filter(o => o.count > 0).map(o => ({
    name: STATUS_LABEL[o.status] ?? o.status,
    value: o.count,
    fill: STATUS_COLOR[o.status] ?? "#94a3b8",
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Last 30 days unless noted</p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue (30d)" value={fmt(revenue30d)}
          sub={`৳${revenue7d.toLocaleString()} last 7d`}
          icon={TrendingUp} accent="bg-amber-50 text-amber-500" />
        <KpiCard label="Orders (30d)" value={String(orderCount30d)}
          sub={`Avg order ৳${aov.toLocaleString()}`}
          icon={ShoppingCart} accent="bg-blue-50 text-blue-500" />
        <KpiCard label="New Customers (30d)" value={String(newCustomers)}
          sub={`${totalCustomers.toLocaleString()} total`}
          icon={Users} accent="bg-violet-50 text-violet-500" />
        <KpiCard label="Repeat Customers" value={String(repeatCustomers)}
          sub={totalCustomers > 0 ? `${Math.round(repeatCustomers / totalCustomers * 100)}% of total` : undefined}
          icon={Users} accent="bg-emerald-50 text-emerald-500" />
      </div>

      {/* ── Revenue chart ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <SectionTitle>Revenue — Last 30 Days</SectionTitle>
            <p className="text-xs text-gray-400 -mt-3">Excludes cancelled orders</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>7d: <strong className="text-gray-900">{fmt(revenue7d)}</strong></span>
            <span>30d: <strong className="text-gray-900">{fmt(revenue30d)}</strong></span>
            <span>90d: <strong className="text-gray-900">{fmt(revenue90d)}</strong></span>
          </div>
        </div>
        {revenueByDay.every(d => d.total === 0) ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">
            No revenue data yet — orders will appear here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                interval={Math.floor(revenueByDay.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                tickFormatter={v => v === 0 ? "৳0" : `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#f59e0b" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Funnel + Order status ─────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Conversion Funnel — Last 30 Days</SectionTitle>
          <div className="space-y-3">
            {funnelRows.map((step, i) => (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{step.label}</span>
                  <div className="flex items-center gap-3">
                    {i > 0 && (
                      <span className={`text-xs font-semibold ${step.rate >= 50 ? "text-emerald-600" : step.rate >= 20 ? "text-amber-600" : "text-red-500"}`}>
                        {step.rate}%
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900 w-14 text-right">{step.count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: funnelRows[0].count > 0 ? `${(step.count / funnelRows[0].count) * 100}%` : "0%",
                      backgroundColor: step.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {funnelRows[0].count === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">No funnel data yet — tracking is live</p>
          )}
        </div>

        {/* Order status pie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Orders by Status</SectionTitle>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No orders yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                    <span className="text-xs text-gray-600 flex-1">{entry.name}</span>
                    <span className="text-xs font-semibold text-gray-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Product performance ───────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Top by page views */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Top Products by Page Views (30d)</SectionTitle>
          {topProductViews.length === 0 ? (
            <p className="text-xs text-gray-400">No product view data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topProductViews.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${(p.count / maxViews) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 shrink-0">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top by add-to-cart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Top Products by Add to Cart (30d)</SectionTitle>
          {topProductCart.length === 0 ? (
            <p className="text-xs text-gray-400">No cart data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topProductCart.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-blue-400 rounded-full" style={{ width: `${(p.count / maxCart) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 shrink-0">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search analytics ──────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Top searches */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Top Search Queries (All Time)</SectionTitle>
          {topSearches.length === 0 ? (
            <p className="text-xs text-gray-400">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {topSearches.map((s, i) => (
                <div key={s.query} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{s.query}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-violet-400 rounded-full" style={{ width: `${(s.count / maxSearch) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 shrink-0">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zero-result searches */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <h2 className="text-sm font-bold text-gray-900">Zero-Result Searches (30d)</h2>
          </div>
          {zeroResultSearches.length === 0 ? (
            <p className="text-xs text-gray-400">No zero-result searches — great!</p>
          ) : (
            <div className="space-y-2">
              {zeroResultSearches.map((s, i) => (
                <div key={s.query} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-700 truncate flex-1">{s.query}</span>
                  <span className="text-xs font-semibold text-red-500 shrink-0 ml-4">{s.count}×</span>
                </div>
              ))}
            </div>
          )}
          {zeroResultSearches.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-3">
              These are things customers searched for but found nothing — consider adding products or tags.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
