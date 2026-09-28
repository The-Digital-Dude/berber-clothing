"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Undo2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Package, 
  DollarSign, 
  MessageSquare, 
  ExternalLink,
  Search,
  Filter,
  Save,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

type ReturnReq = {
  id: string
  orderId: string
  reason: string
  status: string
  note: string | null
  adminNote: string | null
  refundAmount: number | null
  createdAt: string
  order: { orderNumber: string; shippingName: string; shippingPhone: string }
  items: { id: string; quantity: number; orderItem: { productName: string; size: string; color: string } }[]
}

export default function ReturnsClient({ data }: { data: ReturnReq[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<ReturnReq | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = data.length
    const pending = data.filter((r) => r.status === "PENDING").length
    const approved = data.filter((r) => r.status === "APPROVED" || r.status === "RECEIVED").length
    const refundedTotal = data
      .filter((r) => r.status === "REFUNDED")
      .reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0)
    return { total, pending, approved, refundedTotal }
  }, [data])

  function openDetail(r: ReturnReq) {
    setSelected(r)
    setNewStatus(r.status)
    setAdminNote(r.adminNote || "")
    setRefundAmount(r.refundAmount?.toString() || "")
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/returns/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote,
          refundAmount: refundAmount ? Number(refundAmount) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Return RMA updated successfully")
      setSelected(null)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to update return")
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchOrder = r.order.orderNumber.toLowerCase().includes(q)
        const matchName = r.order.shippingName.toLowerCase().includes(q)
        const matchPhone = r.order.shippingPhone.toLowerCase().includes(q)
        const matchReason = r.reason.toLowerCase().includes(q)
        if (!matchOrder && !matchName && !matchPhone && !matchReason) return false
      }
      return true
    })
  }, [data, filter, search])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200/60"
      case "APPROVED":
        return "bg-blue-50 text-blue-700 border-blue-200/60"
      case "RECEIVED":
        return "bg-purple-50 text-purple-700 border-purple-200/60"
      case "REFUNDED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200/60"
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total RMA Requests</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Recorded return tickets</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Undo2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Triage</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats.pending}</h3>
            <span className="text-xs text-amber-700/80 font-medium mt-1 block">Requires staff approval</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In-Progress RMA</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.approved}</h3>
            <span className="text-xs text-blue-700/80 font-medium mt-1 block">Approved / Inbound parcel</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Refunded</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">৳{stats.refundedTotal.toLocaleString()}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Disbursed to shoppers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search order #, customer, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                filter === s
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {s} {s === "ALL" ? `(${data.length})` : `(${data.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Return Reason</th>
                <th className="px-4 py-3.5">Returned Items</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Requested At</th>
                <th className="px-4 py-3.5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Undo2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No return requests found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try selecting another filter or clearing your search.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${r.orderId}`}
                        target="_blank"
                        className="font-mono font-bold text-zinc-900 hover:text-amber-600 flex items-center gap-1"
                      >
                        #{r.order.orderNumber}
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900">{r.order.shippingName}</div>
                      <div className="text-[11px] text-zinc-600 font-mono mt-0.5">{r.order.shippingPhone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-zinc-900 capitalize">
                        {r.reason.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900">
                        {r.items.length} item{r.items.length !== 1 ? "s" : ""}
                      </div>
                      {r.items[0]?.orderItem && (
                        <div className="text-[11px] text-zinc-600 truncate max-w-[160px] mt-0.5">
                          {r.items[0].orderItem.productName} ({r.items[0].orderItem.size})
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          getStatusBadge(r.status)
                        )}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openDetail(r)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{data.length}</strong> RMA requests
          </span>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Undo2 className="w-4 h-4 text-zinc-900" />
              <span>Review Return #{selected?.order.orderNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Customer:</span>
                  <span className="font-bold text-zinc-900">{selected.order.shippingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Phone:</span>
                  <span className="font-mono text-zinc-800 font-semibold">{selected.order.shippingPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Reason:</span>
                  <span className="font-bold text-zinc-900 capitalize">{selected.reason.replace(/_/g, " ").toLowerCase()}</span>
                </div>
                {selected.note && (
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="text-zinc-600 font-medium block mb-0.5">Customer Comment:</span>
                    <p className="text-zinc-800 italic bg-white p-2 rounded-lg border border-zinc-200">
                      &ldquo;{selected.note}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">Returned SKUs:</span>
                <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden bg-white">
                  {selected.items.map((i) => (
                    <div key={i.id} className="px-3 py-2 flex items-center justify-between">
                      <span className="font-medium text-zinc-900">
                        {i.orderItem.productName} ({i.orderItem.size} / {i.orderItem.color})
                      </span>
                      <span className="font-bold text-zinc-600">×{i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Update RMA Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                  >
                    {["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Approved Refund Amount (৳)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Internal Admin Note</label>
                  <input
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Received intact at warehouse, approved full refund via bKash"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving Changes…" : "Save RMA Status & Notes"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
