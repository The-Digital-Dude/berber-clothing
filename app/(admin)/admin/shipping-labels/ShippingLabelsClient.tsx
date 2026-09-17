"use client"
import { useState } from "react"
import { Package, Plus, ExternalLink, Truck } from "lucide-react"
import { toast } from "sonner"

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  PICKED_UP: "bg-purple-100 text-purple-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
}

export default function ShippingLabelsClient({ labels: initialLabels, pendingOrders }: { labels: any[]; pendingOrders: any[] }) {
  const [labels, setLabels] = useState(initialLabels)
  const [creating, setCreating] = useState<string | null>(null)
  const [courier, setCourier] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<"labels" | "create">("labels")

  const createLabel = async (orderId: string) => {
    const c = courier[orderId] || "STEADFAST"
    setCreating(orderId)
    try {
      const res = await fetch("/api/admin/shipping-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, courier: c }),
      })
      if (res.ok) {
        const label = await res.json()
        toast.success(`Label created${label.consignmentId ? ` — consignment ${label.consignmentId}` : " (pending submission)"}`)
        setLabels((prev) => [{ ...label, order: pendingOrders.find((o) => o.id === orderId) }, ...prev])
        setTab("labels")
      } else {
        toast.error("Failed to create label")
      }
    } finally {
      setCreating(null)
    }
  }

  const updateTracking = async (id: string, trackingCode: string) => {
    const res = await fetch(`/api/admin/shipping-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCode, status: "IN_TRANSIT" }),
    })
    if (res.ok) {
      setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, trackingCode, status: "IN_TRANSIT" } : l)))
      toast.success("Tracking updated")
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b pb-3">
        <button onClick={() => setTab("labels")} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === "labels" ? "bg-white border border-b-white -mb-px text-amber-600" : "text-muted-foreground hover:text-foreground"}`}>
          All Labels <span className="ml-1 text-xs text-muted-foreground">({labels.length})</span>
        </button>
        <button onClick={() => setTab("create")} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === "create" ? "bg-white border border-b-white -mb-px text-amber-600" : "text-muted-foreground hover:text-foreground"}`}>
          <Plus className="w-3.5 h-3.5" /> Create Label <span className="ml-1 text-xs">({pendingOrders.length} orders)</span>
        </button>
      </div>

      {tab === "create" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {pendingOrders.length === 0 ? (
            <p className="px-6 py-12 text-center text-muted-foreground">No confirmed orders awaiting labels.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">COD</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Courier</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium">#{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.shippingName}</p>
                      <p className="text-xs text-muted-foreground">{o.shippingPhone} · {o.shippingDistrict}</p>
                    </td>
                    <td className="px-4 py-3">
                      {o.paymentMethod === "COD" ? (
                        <span className="text-sm font-medium">৳{Number(o.total).toLocaleString()}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Paid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={courier[o.id] || "STEADFAST"}
                        onChange={(e) => setCourier((c) => ({ ...c, [o.id]: e.target.value }))}
                        className="text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="STEADFAST">Steadfast</option>
                        <option value="PATHAO">Pathao</option>
                        <option value="REDX">RedX</option>
                        <option value="SUNDARBAN">Sundarban</option>
                        <option value="SA_PARIBAHAN">SA Paribahan</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => createLabel(o.id)}
                        disabled={creating === o.id}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                      >
                        {creating === o.id ? "Creating…" : "Create"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "labels" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {labels.length === 0 ? (
            <p className="px-6 py-12 text-center text-muted-foreground">No labels created yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Courier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Consignment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {labels.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium">#{l.order?.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{l.order?.shippingName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        {l.courier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.consignmentId || "—"}</td>
                    <td className="px-4 py-3">
                      {l.trackingCode ? (
                        <span className="font-mono text-xs">{l.trackingCode}</span>
                      ) : (
                        <input
                          placeholder="Enter tracking…"
                          className="text-xs border rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          onBlur={(e) => { if (e.target.value) updateTracking(l.id, e.target.value) }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleDateString("en-BD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
