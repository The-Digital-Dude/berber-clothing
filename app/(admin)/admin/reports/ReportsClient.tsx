"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Download, 
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt,
  PieChart as PieChartIcon,
  Package
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#09090b", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

export function ReportsClient() {
  const [range, setRange] = useState("30")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [range])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching reports", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!data?.exportData) return

    const headers = ["OrderNumber", "Date", "Status", "PaymentMethod", "PaymentStatus", "Total"]
    const csvContent = [
      headers.join(","),
      ...data.exportData.map((row: any) => [
        row.OrderNumber,
        new Date(row.Date).toISOString(),
        row.Status,
        row.PaymentMethod,
        row.PaymentStatus,
        row.Total,
      ].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `orders_export_${range}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-zinc-400">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-zinc-600">Aggregating financial reports & analytics…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center text-rose-700 text-xs font-semibold">
        Failed to load report dataset. Please refresh or try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-700">Reporting Timeframe:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
          >
            <option value="today">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Orders CSV
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Gross Sales</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{data.summary.totalRevenue.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">In selected period</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Order Volume</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{data.summary.totalOrders}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Total placed orders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Avg Order Value (AOV)</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{Math.round(data.summary.averageOrderValue).toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Basket size index</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">New Shoppers</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{data.summary.newCustomers}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Acquired customers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-900" />
            <h3 className="text-sm font-bold text-zinc-900">Profit &amp; Loss Overview (P&amp;L)</h3>
          </div>
          <span className="text-xs text-zinc-600 font-medium">Simplified cash-basis breakdown</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70">
            <p className="text-xs font-semibold text-zinc-600">Total Revenue</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">৳{data.pnl.revenue.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70">
            <p className="text-xs font-semibold text-zinc-600">Cost of Goods (COGS)</p>
            <p className="text-xl font-bold text-rose-700 mt-1">-৳{data.pnl.cogs.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70">
            <p className="text-xs font-semibold text-zinc-600">Operating Expenses</p>
            <p className="text-xl font-bold text-rose-700 mt-1">-৳{data.pnl.expenses.toLocaleString()}</p>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              data.pnl.netProfit >= 0
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                : "bg-rose-50/50 border-rose-200 text-rose-950"
            }`}
          >
            <p className="text-xs font-semibold text-zinc-700">Estimated Net Profit</p>
            <p
              className={`text-xl font-bold mt-1 ${
                data.pnl.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              ৳{data.pnl.netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {data.pnl.expensesByCategory.length > 0 && (
          <div className="pt-2 border-t border-zinc-100">
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5">
              Operating Expense Breakdown
            </p>
            <div className="flex flex-wrap gap-2">
              {data.pnl.expensesByCategory.map((c: any) => (
                <div
                  key={c.name}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100/80 border border-zinc-200 text-xs flex items-center gap-2"
                >
                  <span className="text-zinc-600 font-medium">{c.name}:</span>
                  <span className="font-bold text-zinc-900 font-mono">৳{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Daily Revenue Velocity</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} />
                <Tooltip
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#09090b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Order Volume by Status</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment methods & Top 10 products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Payment Gateways</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.paymentData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Top 10 Selling Products</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/40 hover:bg-zinc-50/40 border-zinc-200">
                  <TableHead className="text-xs font-bold text-zinc-700 pl-5">Product Name</TableHead>
                  <TableHead className="text-right text-xs font-bold text-zinc-700">Units Sold</TableHead>
                  <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50/80 transition-colors text-xs">
                    <td className="px-5 py-3 font-semibold text-zinc-900">{p.name}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-zinc-800">{p.units}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-zinc-900">৳{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
