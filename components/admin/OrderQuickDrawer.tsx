"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  X, ExternalLink, Phone, MessageSquare, Check, Loader2,
  Package, Truck, CreditCard, User, AlertTriangle, ShieldCheck,
  Clock, CheckCircle2, ChevronRight, Copy, Edit, Zap, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import OrderItemsEditorModal from "@/components/admin/OrderItemsEditorModal"
import type { CustomerRisk } from "@/lib/customerRisk"

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "CONFIRMED", label: "Confirmed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "PACKED", label: "Packed", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "SHIPPED", label: "Shipped", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "DELIVERED", label: "Delivered", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "CANCELLED", label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "RETURNED", label: "Returned", cls: "bg-orange-50 text-orange-700 border-orange-200" },
]

export default function OrderQuickDrawer({
  orderId,
  onClose,
  onStatusChange,
}: {
  orderId: string | null
  onClose: () => void
  onStatusChange?: (orderId: string, newStatus: string) => void
}) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [risk, setRisk] = useState<CustomerRisk | null>(null)
  const [checkingRisk, setCheckingRisk] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      setRisk(null)
      return
    }

    let active = true
    setLoading(true)
    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        // No auto-fetch here -- a real Steadfast network check costs an API
        // call, so it only ever runs when the admin clicks "Fraud Check" /
        // "Re-check" below, never automatically on open.
        if (active) setOrder(data)
      })
      .catch(() => {
        if (active) toast.error("Failed to load order preview")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [orderId])

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && orderId) onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [orderId, onClose])

  if (!orderId) return null

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order || updating || order.status === newStatus) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Status update failed")
      setOrder((prev: any) => ({ ...prev, status: newStatus }))
      toast.success(`Order marked as ${newStatus}`)
      if (onStatusChange) onStatusChange(order.id, newStatus)
    } catch (e: any) {
      toast.error(e.message || "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  const handleDispatchSteadfast = async () => {
    if (!order || dispatching) return
    setDispatching(true)
    try {
      const res = await fetch("/api/courier/steadfast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (res.ok && data.consignment) {
        toast.success(`⚡ Dispatched to Steadfast! CID: ${data.consignment.consignment_id}`)
        setOrder((prev: any) => ({
          ...prev,
          status: "SHIPPED",
          delivery: {
            courier: "STEADFAST",
            consignmentId: String(data.consignment.consignment_id),
            trackingCode: data.consignment.tracking_code,
            status: data.consignment.status,
          },
        }))
        if (onStatusChange) onStatusChange(order.id, "SHIPPED")
      } else {
        toast.error(data.error || "Failed to dispatch to Steadfast")
      }
    } catch (e: any) {
      toast.error(e.message || "Error dispatching to Steadfast")
    } finally {
      setDispatching(false)
    }
  }

  const handleRecheckFraud = async () => {
    if (!order?.shippingPhone) return
    setCheckingRisk(true)
    try {
      const res = await fetch("/api/admin/courier/steadfast/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: order.shippingPhone }),
      })
      const data = await res.json()
      if (res.ok && data.risk) {
        setRisk(data.risk)
        toast.success("Steadfast fraud score refreshed")
      } else {
        toast.error(data.error || "Failed to refresh risk score")
      }
    } catch (e: any) {
      toast.error("Failed to check fraud score")
    } finally {
      setCheckingRisk(false)
    }
  }

  const copyPhone = () => {
    if (order?.shippingPhone) {
      navigator.clipboard.writeText(order.shippingPhone)
      toast.success("Phone number copied")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-zinc-900 font-mono">
                {order ? order.orderNumber : "Loading order…"}
              </h2>
              {order && (
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    STATUS_OPTIONS.find((s) => s.value === order.status)?.cls || "bg-zinc-100 text-zinc-700"
                  )}
                >
                  {order.status}
                </span>
              )}
            </div>
            {order && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {order && (
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-zinc-50 transition-all"
              >
                <span>Full Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-xs">Loading order details…</p>
          </div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
            Order not found
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1-Click Steadfast Dispatch or Live Tracking Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Steadfast Fulfillment</h4>
                    <p className="text-[11px] text-zinc-500">Official Courier Logistics</p>
                  </div>
                </div>

                {order.delivery?.consignmentId && (
                  <span className="text-[10.5px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-800">
                    CID: {order.delivery.consignmentId}
                  </span>
                )}
              </div>

              {!order.delivery?.consignmentId ? (
                <button
                  onClick={handleDispatchSteadfast}
                  disabled={dispatching || ["CANCELLED", "DELIVERED"].includes(order.status)}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{dispatching ? "Booking parcel on Steadfast…" : "⚡ 1-Click Dispatch to Steadfast"}</span>
                </button>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-700 font-mono">
                    <span>Tracking:</span>
                    <strong className="text-zinc-900">{order.delivery.trackingCode || "N/A"}</strong>
                  </div>
                  {order.delivery.trackingCode && (
                    <a
                      href={
                        order.delivery.trackingCode.startsWith("http")
                          ? order.delivery.trackingCode
                          : `https://steadfast.com.bd/t/${order.delivery.trackingCode}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <span>Live Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Status Control */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick Update Status</span>
                {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st.value}
                    disabled={updating || order.status === st.value}
                    onClick={() => handleStatusUpdate(st.value)}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-lg border transition-all",
                      order.status === st.value
                        ? "bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/80"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Steadfast Fraud & Customer Risk Intelligence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Steadfast Fraud Intelligence
                </h3>
                <button
                  type="button"
                  onClick={handleRecheckFraud}
                  disabled={checkingRisk}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3 h-3", checkingRisk && "animate-spin")} />
                  <span>{risk ? "Re-check" : "Fraud Check"}</span>
                </button>
              </div>

              {risk ? (
                <div
                  className={cn(
                    "rounded-xl border p-3.5 text-xs space-y-2",
                    risk.riskLevel === "HIGH"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : risk.riskLevel === "MEDIUM"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  )}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {risk.riskLevel === "HIGH" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {risk.riskLevel} Risk Customer
                    </span>
                    {risk.steadfast && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                        Steadfast Network
                      </span>
                    )}
                  </div>

                  {risk.fraudWarning && (
                    <p className="font-semibold text-rose-700 bg-white/80 p-2 rounded-lg border border-rose-200/60 text-[11px]">
                      ⚠️ {risk.fraudWarning}
                    </p>
                  )}

                  {risk.steadfast && (
                    <div className="bg-white/80 p-2 rounded-lg border border-zinc-200/60 text-[11px] space-y-0.5 text-zinc-700">
                      <div className="flex justify-between font-semibold">
                        <span>Courier Success Rate:</span>
                        <span>
                          {risk.steadfast.deliveryRatio !== null
                            ? `${risk.steadfast.deliveryRatio}%`
                            : risk.steadfast.scoringDisabled ? "Not enough history" : "No history"}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-500">
                        {risk.steadfast.deliveryRatio ?? 0}% delivered / {risk.steadfast.cancellationRatio ?? 0}% cancelled / {risk.steadfast.returnRatio ?? 0}% returned
                      </div>
                      {risk.steadfast.totalReports > 0 && (
                        <div className="text-[10.5px] text-rose-700 font-semibold">
                          {risk.steadfast.totalReports} fraud report(s) across the network
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-xl border border-zinc-200/70 p-3 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>{checkingRisk ? "Checking customer delivery record…" : "Not checked yet"}</span>
                  {checkingRisk && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
                </div>
              )}
            </div>

            {/* Customer & Shipping Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer & Delivery
              </h3>
              <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Name:</span>
                  <span className="font-semibold text-zinc-900">{order.shippingName || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-zinc-900">{order.shippingPhone}</span>
                    <button
                      onClick={copyPhone}
                      title="Copy Phone"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={`https://wa.me/${order.shippingPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="WhatsApp Customer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 pt-1 border-t border-zinc-100">
                  <span className="text-zinc-500 shrink-0">Address:</span>
                  <span className="text-right text-zinc-800">
                    {order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Order Items ({order.items?.length || 0})
                </h3>
                {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && (
                  <button
                    onClick={() => setIsEditingItems(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit / Swap Items</span>
                  </button>
                )}
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
                {order.items?.map((item: any) => {
                  const img = item.product?.images?.[0]?.url || "/placeholder.png"
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 text-xs">
                      <img
                        src={img}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">{item.productName}</p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Size: <span className="text-zinc-600 font-medium">{item.size || "Standard"}</span> · Color: <span className="text-zinc-600 font-medium">{item.color || "Default"}</span>
                        </p>
                        <p className="text-zinc-500 font-mono mt-0.5">Qty: {item.quantity} × ৳{Number(item.price).toLocaleString()}</p>
                      </div>
                      <div className="text-right font-bold text-zinc-900 font-mono shrink-0">
                        ৳{(Number(item.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Financial Summary
              </h3>
              <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Subtotal:</span>
                  <span className="font-mono text-zinc-800">৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-৳{Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Shipping Charge:</span>
                  <span className="font-mono text-zinc-800">৳{Number(order.shippingCharge).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 font-bold text-sm">
                  <span className="text-zinc-900">Total:</span>
                  <span className="text-zinc-900 font-mono text-base">৳{Number(order.total).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-500 text-[11px]">Payment:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-700">{order.paymentMethod}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {order && (
          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
            <Link
              href={`/print/orders/${order.id}/packing-slip`}
              target="_blank"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Print Packing Slip
            </Link>
            <Link
              href={`/admin/orders/${order.id}`}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <span>Manage Order</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Order Items & Variant Modification Modal */}
        <OrderItemsEditorModal
          order={order}
          isOpen={isEditingItems}
          onClose={() => setIsEditingItems(false)}
          onSaved={(updatedOrder) => {
            setOrder(updatedOrder)
            if (onStatusChange) onStatusChange(updatedOrder.id, updatedOrder.status)
          }}
        />
      </div>
    </div>
  )
}
