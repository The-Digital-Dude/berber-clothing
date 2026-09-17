"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Pause, Play } from "lucide-react"
import { toast } from "sonner"

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-600",
}

export default function SubscriptionsClient({ data }: { data: any[] }) {
  const [subs, setSubs] = useState(data)
  const [filter, setFilter] = useState("ALL")

  const filtered = filter === "ALL" ? subs : subs.filter((s) => s.status === filter)

  const patch = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
      toast.success(`Subscription ${status.toLowerCase()}`)
    } else {
      toast.error("Failed to update")
    }
  }

  const counts = ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"].reduce<Record<string, number>>(
    (acc, s) => { acc[s] = subs.filter((sub) => sub.status === s).length; return acc },
    {}
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "ALL" : s)}
            className={`rounded-xl border p-4 text-left transition-all ${filter === s ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s}</p>
            <p className="text-2xl font-bold mt-1">{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan / Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Next Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No subscriptions found.</td></tr>
            )}
            {filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{sub.customerEmail || sub.userId || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{sub.plan?.name || "—"}</p>
                  {sub.plan?.product?.name && (
                    <p className="text-xs text-muted-foreground">{sub.plan.product.name}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[sub.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sub.nextOrderAt ? new Date(sub.nextOrderAt).toLocaleDateString("en-BD") : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sub.orderCount ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {sub.status === "ACTIVE" && (
                      <button onClick={() => patch(sub.id, "PAUSED")} title="Pause" className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-700 transition-colors">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {sub.status === "PAUSED" && (
                      <button onClick={() => patch(sub.id, "ACTIVE")} title="Resume" className="p-1.5 rounded-lg hover:bg-green-100 text-green-700 transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {["ACTIVE", "PAUSED"].includes(sub.status) && (
                      <button onClick={() => patch(sub.id, "CANCELLED")} title="Cancel" className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
