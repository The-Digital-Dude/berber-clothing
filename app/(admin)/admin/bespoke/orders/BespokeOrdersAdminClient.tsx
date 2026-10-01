"use client"

import { useState } from "react"
import {
  Scissors,
  Printer,
  MessageSquare,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  FileText,
  Building,
  RefreshCw,
  Eye,
  CreditCard,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const STAGES = [
  { id: "ALL", label: "All Commissions" },
  { id: "FABRIC_SOURCING", label: "Cloth Reserved" },
  { id: "PATTERN_CUTTING", label: "Pattern Cutting" },
  { id: "BASTE_FITTING_SCHEDULED", label: "Baste Trial Ready" },
  { id: "FINAL_TAILORING", label: "Handcrafting" },
  { id: "QUALITY_CONTROL", label: "QA Audit" },
  { id: "READY_FOR_PICKUP_OR_DELIVERY", label: "Ready for Pickup" },
  { id: "COMPLETED", label: "Completed" },
]

const STAGE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  FABRIC_SOURCING: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", label: "Cloth Reserved" },
  PATTERN_CUTTING: { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400", label: "Pattern Cutting" },
  BASTE_FITTING_SCHEDULED: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "Baste Trial Ready" },
  FINAL_TAILORING: { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400", label: "Handcrafting" },
  QUALITY_CONTROL: { bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400", label: "QA Audit" },
  READY_FOR_PICKUP_OR_DELIVERY: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Ready for Pickup" },
  COMPLETED: { bg: "bg-neutral-500/10 border-neutral-500/30", text: "text-neutral-400", label: "Completed" },
}

export default function BespokeOrdersAdminClient({ initialOrders = [] }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [selectedStage, setSelectedStage] = useState("ALL")
  const [search, setSearch] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [activeWaModal, setActiveWaModal] = useState<{ waLink: string; waMessage: string } | null>(null)

  const reloadData = async () => {
    try {
      const url = new URL("/api/admin/bespoke/orders", window.location.origin)
      if (selectedStage !== "ALL") url.searchParams.set("status", selectedStage)
      if (search) url.searchParams.set("search", search)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch {
      toast.error("Failed to refresh orders")
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(id)
    try {
      const res = await fetch("/api/admin/bespoke/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")

      toast.success("Production stage advanced")
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      )

      if (data.waLink && (newStatus === "BASTE_FITTING_SCHEDULED" || newStatus === "READY_FOR_PICKUP_OR_DELIVERY")) {
        setActiveWaModal({ waLink: data.waLink, waMessage: data.waMessage })
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleToggleDeposit = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/bespoke/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, depositPaid: !currentVal }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(!currentVal ? "Deposit marked as Paid" : "Deposit marked as Unpaid")
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, depositPaid: !currentVal } : o))
      )
    } catch {
      toast.error("Failed to toggle deposit")
    }
  }

  const filtered = orders.filter((o) => {
    const matchStage = selectedStage === "ALL" || o.status === selectedStage
    const matchSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.phone?.includes(search)
    return matchStage && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-500" />
            Master Tailor Workshop Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track pattern cutting, baste muslin trials, and print master cutting blueprints.
          </p>
        </div>

        <button
          onClick={reloadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stage Pills Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStage(st.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              selectedStage === st.id
                ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-800 hover:border-gray-300"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, client name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-gray-500">Showing {filtered.length} bespoke commissions</span>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No bespoke commissions found in this stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Commission #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Garment & Cloth</th>
                  <th className="py-3.5 px-4">Deposit Status</th>
                  <th className="py-3.5 px-4">Workshop Stage</th>
                  <th className="py-3.5 px-4 text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filtered.map((item) => {
                  const specs =
                    typeof item.designSpecs === "string"
                      ? JSON.parse(item.designSpecs)
                      : item.designSpecs || {}
                  const statusMeta = STAGE_BADGES[item.status] || STAGE_BADGES.FABRIC_SOURCING

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-950/50 transition">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                          {item.orderNumber}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.user?.name || "Client"}</div>
                        <div className="text-xs text-gray-500">{item.user?.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-neutral-200">
                          {item.garmentType.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 truncate max-w-xs">
                          {specs.fabric?.name || "Wool"} ({specs.silhouette || "Slim"})
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleDeposit(item.id, item.depositPaid)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                            item.depositPaid
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          {item.depositPaid ? "Deposit Paid (৳" + Number(item.depositAmount || 0).toLocaleString() + ")" : "Mark Deposit Paid"}
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          disabled={isUpdating === item.id}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <option value="FABRIC_SOURCING">1. Cloth Reserved</option>
                          <option value="PATTERN_CUTTING">2. Pattern Cutting</option>
                          <option value="BASTE_FITTING_SCHEDULED">3. Baste Trial Ready</option>
                          <option value="FINAL_TAILORING">4. Handcrafting</option>
                          <option value="QUALITY_CONTROL">5. QA Audit</option>
                          <option value="READY_FOR_PICKUP_OR_DELIVERY">6. Ready for Pickup</option>
                          <option value="COMPLETED">7. Completed</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/bespoke/orders/${item.id}/cut-sheet`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold transition shadow-sm border border-neutral-700"
                            title="Print Master Cut Blueprint"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cut Sheet</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WhatsApp Notification Modal */}
      {activeWaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-base">Stage Advanced — Notify Customer</h3>
            </div>
            <p className="text-xs text-neutral-300">
              A pre-formatted WhatsApp message has been prepared for the client.
            </p>
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 text-xs font-mono text-neutral-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {activeWaModal.waMessage}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveWaModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Dismiss
              </button>
              <a
                href={activeWaModal.waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveWaModal(null)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
              >
                <MessageSquare className="w-4 h-4" />
                Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
