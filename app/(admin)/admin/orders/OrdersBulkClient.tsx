"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Eye, Printer, AlertTriangle, ChevronRight, PanelRightOpen,
  MessageSquare, Edit, Truck, CheckCircle2, Copy, ShieldCheck, Zap
} from "lucide-react"
import Link from "next/link"
import OrderQuickDrawer from "@/components/admin/OrderQuickDrawer"
import OrderItemsEditorModal from "@/components/admin/OrderItemsEditorModal"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 border-amber-200/80" },
  CONFIRMED:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200/80" },
  PACKED:     { label: "Packed",     cls: "bg-purple-50 text-purple-700 border-purple-200/80" },
  SHIPPED:    { label: "Shipped",    cls: "bg-indigo-50 text-indigo-700 border-indigo-200/80" },
  DELIVERED:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-rose-50 text-rose-700 border-rose-200/80" },
  RETURNED:   { label: "Returned",   cls: "bg-orange-50 text-orange-700 border-orange-200/80" },
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
  shippingPhone?: string
  shippingAddress?: string
  shippingArea?: string
  shippingDistrict?: string
  createdAt: string
  total: number
  subtotal?: number
  shippingCharge?: number
  discount?: number
  paymentMethod: string
  paymentStatus: string
  status: string
  items?: any[]
  delivery?: { courier?: string; trackingCode?: string; consignmentId?: string; status?: string } | null
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

  useEffect(() => {
    setOrders(initialOrders)
    setSelected(new Set())
  }, [initialOrders])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [isBulkDispatching, setIsBulkDispatching] = useState(false)
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)

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

  async function handleBulkDispatchSteadfast() {
    if (selected.size === 0) return
    setIsBulkDispatching(true)
    try {
      const res = await fetch("/api/admin/orders/bulk-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`⚡ Successfully dispatched ${data.dispatched} orders to Steadfast!${data.failed > 0 ? ` (${data.failed} skipped/failed)` : ""}`)
        router.refresh()
        setSelected(new Set())
      } else {
        toast.error(data.error || "Failed to bulk dispatch to Steadfast")
      }
    } catch (err: any) {
      toast.error(err.message || "Error bulk dispatching to Steadfast")
    } finally {
      setIsBulkDispatching(false)
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

  const copyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(phone)
    toast.success(`Copied phone: ${phone}`)
  }

  return (
    <>
      {/* Sticky Batch Operations Action Bar */}
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center justify-between gap-3 transition-all duration-200 text-xs",
          someSelected
            ? "bg-amber-50/80 border-amber-200/90 shadow-2xs"
            : "bg-zinc-50/40 border-zinc-100"
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", someSelected ? "text-amber-900 font-bold" : "text-zinc-500")}>
            {someSelected ? `${selected.size} order${selected.size > 1 ? "s" : ""} selected` : `${orders.length} orders shown`}
          </span>
          {someSelected && (
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-8 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-900 font-semibold shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="h-8 text-xs bg-zinc-900 text-white hover:bg-zinc-800 font-semibold"
              >
                {loading ? "Updating…" : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {someSelected && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkDispatchSteadfast}
              disabled={isBulkDispatching || loading}
              className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-2xs"
            >
              <Zap className={cn("h-3.5 w-3.5 text-amber-300", isBulkDispatching && "animate-spin")} />
              <span>{isBulkDispatching ? "Dispatching to Steadfast…" : "⚡ Bulk Dispatch to Steadfast"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={printSelected}
              className="h-8 text-xs gap-1.5 bg-white border-zinc-300 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-zinc-500" />
              <span>Print Packing Slips</span>
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

      {/* Main Table Grid */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 hover:bg-zinc-50/60 border-zinc-200/80">
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Order & Date</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Customer</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Items Summary</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Total & Payment</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Fulfillment & Courier</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Fraud Risk</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-zinc-400 text-xs">
                  No orders match your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const phone = (order as any).shippingPhone || ""
                const risk = phone ? riskByPhone[phone] : null
                const isSelected = selected.has(order.id)
                const statusInfo = STATUS_COLORS[order.status] || { label: order.status, cls: "bg-zinc-100 text-zinc-700 border-zinc-200" }
                const customerName = order.user?.name || order.shippingName || "Guest Customer"
                const firstItem = order.items?.[0]?.productName || "Product item"
                const itemCount = order.items?.length || 1

                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "transition-colors text-xs cursor-pointer group hover:bg-zinc-50/90",
                      isSelected && "bg-amber-50/30"
                    )}
                    onClick={() => setDrawerOrderId(order.id)}
                  >
                    {/* Checkbox */}
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(order.id)}
                        className="rounded border-zinc-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                    </TableCell>

                    {/* Order # & Timestamp */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-0.5 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                          · {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{customerName}</p>
                          {phone && (
                            <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              <span className="font-mono text-[11px] text-zinc-500">{phone}</span>
                              <button
                                onClick={(e) => copyPhone(phone, e)}
                                title="Copy Phone Number"
                                className="text-zinc-400 hover:text-zinc-700 p-0.5"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                              <a
                                href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="WhatsApp Customer"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell>
                      <div className="min-w-0 max-w-[200px]">
                        <p className="font-medium text-zinc-800 truncate">{firstItem}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Total & Payment Method */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-zinc-900">
                          ৳{Number(order.total).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-zinc-600">{order.paymentMethod}</span>
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1 py-0.2 rounded font-semibold border",
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            )}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Fulfillment Status & Courier Badge */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            statusInfo.cls
                          )}
                        >
                          {statusInfo.label}
                        </span>
                        {order.delivery?.trackingCode ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 truncate max-w-[140px]">
                            <Truck className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{order.delivery.trackingCode}</span>
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Fraud Risk Indicator */}
                    <TableCell>
                      {risk && risk.riskLevel !== "NEW" ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            RISK_COLORS[risk.riskLevel]
                          )}
                        >
                          {risk.riskLevel === "HIGH" && <AlertTriangle className="h-3 w-3" />}
                          {risk.riskLevel} · {Math.round((risk.successRate ?? 0) * 100)}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">New Buyer</span>
                      )}
                    </TableCell>

                    {/* Action Triggers */}
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
                        {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingOrder(order)}
                            className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                            title="Edit Items / Swap Variants"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                            title="Full Details Page"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Slideover Quick Inspection Drawer */}
      <OrderQuickDrawer
        orderId={drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
        onStatusChange={handleStatusChangeFromDrawer}
      />

      {/* Direct Order Items Editor Modal */}
      {editingOrder && (
        <OrderItemsEditorModal
          order={editingOrder}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={(updatedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            )
            router.refresh()
          }}
        />
      )}
    </>
  )
}
