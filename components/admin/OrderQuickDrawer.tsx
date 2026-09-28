"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  X, ExternalLink, Phone, MessageSquare, Check, Loader2,
  Package, Truck, CreditCard, User, AlertTriangle, ShieldCheck,
  Clock, CheckCircle2, ChevronRight, Copy
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    let active = true
    setLoading(true)
    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Order Items ({order.items?.length || 0})
              </h3>
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
              href={`/print/orders/packing-slip?id=${order.id}`}
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
      </div>
    </div>
  )
}
