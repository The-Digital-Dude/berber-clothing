"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Search,
  Filter,
  Package,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

type Delivery = {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  shippingPhone?: string | null
  courier: string
  consignmentId: string | null
  trackingCode: string | null
  status: string
  createdAt: string
}

export function DeliveryClient({
  data,
  stats,
}: {
  data: Delivery[]
  stats: { totalSent: number; inTransit: number; delivered: number; failed: number }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/delivery?${params.toString()}`, { scroll: false })
  }

  const handleRefreshStatus = async (orderId: string) => {
    setRefreshing(orderId)
    try {
      const res = await fetch(`/api/admin/delivery/${orderId}/refresh`, {
        method: "POST",
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Failed to refresh status from courier API")
      }
    } catch (err) {
      alert("Error refreshing courier status")
    } finally {
      setRefreshing(null)
    }
  }

  const filteredData = data.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.orderNumber.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      (d.consignmentId || "").toLowerCase().includes(q) ||
      (d.trackingCode || "").toLowerCase().includes(q) ||
      (d.shippingPhone || "").includes(q)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      case "IN_TRANSIT":
        return "bg-blue-50 text-blue-700 border-blue-200/60"
      case "PICKED_UP":
        return "bg-purple-50 text-purple-700 border-purple-200/60"
      case "FAILED":
      case "RETURNED":
        return "bg-rose-50 text-rose-700 border-rose-200/60"
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/60"
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Dispatched (Month)</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalSent}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Total shipments booked</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Transit</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.inTransit}</h3>
            <span className="text-xs text-blue-700/80 font-medium mt-1 block">En route with courier rider</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Delivered</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.delivered}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Successfully handed over</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Failed / Returned</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">{stats.failed}</h3>
            <span className="text-xs text-rose-700/80 font-medium mt-1 block">Customer canceled or undelivered</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search order #, customer, tracking…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={searchParams.get("courier") || "all"}
            onChange={(e) => handleFilterChange("courier", e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
          >
            <option value="all">All Couriers</option>
            <option value="PATHAO">Pathao Express</option>
            <option value="STEADFAST">Steadfast Courier</option>
          </select>

          <select
            value={searchParams.get("status") || "all"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Pickup</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Courier</th>
                <th className="px-4 py-3.5">Consignment ID</th>
                <th className="px-4 py-3.5">Tracking Code</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No courier dispatches found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((delivery) => {
                  const isPathao = delivery.courier === "PATHAO"
                  const phoneClean = delivery.shippingPhone ? delivery.shippingPhone.replace(/[^0-9]/g, "") : null

                  return (
                    <tr key={delivery.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/orders/${delivery.orderId}`}
                          target="_blank"
                          className="font-mono font-bold text-zinc-900 hover:text-amber-600 flex items-center gap-1"
                        >
                          #{delivery.orderNumber}
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900">{delivery.customerName}</div>
                        {delivery.shippingPhone && (
                          <div className="text-[11px] text-zinc-600 font-mono mt-0.5 flex items-center gap-1">
                            {delivery.shippingPhone}
                            {phoneClean && (
                              <a
                                href={`https://wa.me/${phoneClean}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 inline ml-0.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPathao
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-cyan-50 text-cyan-800 border-cyan-200"
                          }`}
                        >
                          {delivery.courier}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-zinc-800">
                        {delivery.consignmentId || "—"}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-zinc-800 font-semibold">
                        {delivery.trackingCode || "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                            getStatusBadge(delivery.status)
                          )}
                        >
                          {delivery.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                        {format(new Date(delivery.createdAt), "MMM d, yyyy")}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleRefreshStatus(delivery.orderId)}
                          disabled={refreshing === delivery.orderId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              refreshing === delivery.orderId ? "animate-spin text-zinc-900" : ""
                            }`}
                          />
                          {refreshing === delivery.orderId ? "Syncing…" : "Sync"}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> deliveries
          </span>
        </div>
      </div>
    </div>
  )
}
