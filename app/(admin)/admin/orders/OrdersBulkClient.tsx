"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Printer, AlertTriangle, ChevronRight, PanelRightOpen, ShieldCheck, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import OrderQuickDrawer from "@/components/admin/OrderQuickDrawer"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200/80",
  PACKED: "bg-purple-50 text-purple-700 border-purple-200/80",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/80",
  RETURNED: "bg-orange-50 text-orange-700 border-orange-200/80",
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-rose-50 text-rose-700 border-rose-200",
}

type Order = {
  id: string
  orderNumber: string
  shippingName: string
  createdAt: string
  total: number
  paymentMethod: string
  paymentStatus: string
  status: string
  shippingPhone?: string
  user?: { name: string; email?: string } | null
}

type RiskInfo = { riskLevel: string; successRate: number }

export default function OrdersBulkClient({
  orders: initialOrders,
  riskByPhone,
}: {
  orders: Order[]
  riskByPhone: Record<string, RiskInfo>
}) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null)

  const allSelected = orders.length > 0 && selected.size === orders.length
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(orders.map((o) => o.id)))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function applyBulk() {
    if (!bulkStatus || selected.size === 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action: "UPDATE_STATUS", status: bulkStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.updated} order${data.updated !== 1 ? "s" : ""} updated to ${bulkStatus}`)
      
      // Optimistic update local state
      setOrders((prev) =>
        prev.map((o) => (selected.has(o.id) ? { ...o, status: bulkStatus } : o))
      )
      setSelected(new Set())
      setBulkStatus("")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to update orders")
    } finally {
      setLoading(false)
    }
  }

  function printSelected() {
    const ids = Array.from(selected).join(",")
    window.open(`/print/orders/bulk-packing-slip?ids=${encodeURIComponent(ids)}`, "_blank")
  }

  const handleStatusChangeFromDrawer = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    router.refresh()
  }

  return (
    <>
      {/* Sticky Bulk action bar */}
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center justify-between gap-3 transition-all duration-200 text-xs",
          someSelected
            ? "bg-amber-50/70 border-amber-200/80 sticky top-14 z-10 shadow-xs"
            : "bg-zinc-50/40 border-zinc-100"
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", someSelected ? "text-amber-900 font-semibold" : "text-zinc-500")}>
            {someSelected ? `${selected.size} order${selected.size > 1 ? "s" : ""} selected` : `${orders.length} total orders`}
          </span>
          {someSelected && (
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-8 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-900 font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Set bulk status…</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button
                size="sm"
                onClick={applyBulk}
                disabled={!bulkStatus || loading}
                className="h-8 text-xs bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {loading ? "Updating…" : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {someSelected && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={printSelected}
              className="h-8 text-xs gap-1.5 bg-white border-zinc-300 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-zinc-500" />
              <span>Print Slips</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              className="h-8 text-xs text-zinc-500 hover:text-zinc-900"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Order</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Customer</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Date</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Amount</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Payment</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Status</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Fraud Risk</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-4">Quick Inspect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-zinc-400 text-xs">
                  No orders match your filter criteria.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => {
              const risk = (order as any).shippingPhone ? riskByPhone[(order as any).shippingPhone] : null
              const isSelected = selected.has(order.id)
              const statusCls = STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-700 border-zinc-200"

              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    "transition-colors text-xs cursor-pointer group hover:bg-zinc-50/90",
                    isSelected && "bg-amber-50/30"
                  )}
                  onClick={() => setDrawerOrderId(order.id)}
                >
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(order.id)}
                      className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-mono font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-800">{order.user?.name || order.shippingName}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{(order as any).shippingPhone || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-500 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-zinc-900">
                    ৳{Number(order.total).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-700">{order.paymentMethod}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", statusCls)}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {risk && risk.riskLevel !== "NEW" ? (
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", RISK_COLORS[risk.riskLevel])}>
                        {risk.riskLevel === "HIGH" && <AlertTriangle className="h-3 w-3" />}
                        {risk.riskLevel} · {Math.round((risk.successRate ?? 0) * 100)}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">New Buyer</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerOrderId(order.id)}
                        className="h-7 px-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg gap-1"
                      >
                        <PanelRightOpen className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Inspect</span>
                      </Button>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          title="Full page"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Slideover Quick Inspection Drawer */}
      <OrderQuickDrawer
        orderId={drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
        onStatusChange={handleStatusChangeFromDrawer}
      />
    </>
  )
}
