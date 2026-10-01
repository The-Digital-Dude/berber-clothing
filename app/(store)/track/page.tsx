"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Search, ShoppingBag, Check, Package, Truck, Home, Ban,
  Zap, Clock, ShieldCheck, ExternalLink, RefreshCw, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: ShoppingBag },
  { key: "CONFIRMED", label: "Confirmed", icon: Check },
  { key: "PACKED", label: "Packed & Ready", icon: Package },
  { key: "SHIPPED", label: "With Steadfast", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
]

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrderNumber = searchParams.get("order") || searchParams.get("orderNumber") || ""

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  const fetchTracking = async (num: string) => {
    if (!num.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/store/track-order?orderNumber=${encodeURIComponent(num.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setOrder(null)
        toast.error(data.error || "Order not found")
      } else {
        setOrder(data)
      }
    } catch {
      toast.error("Failed to connect to tracking server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber)
      fetchTracking(initialOrderNumber)
      return
    }
    // Fallback for links shaped like /track#ORD-2026-0015 instead of
    // /track?order=ORD-2026-0015 -- a # fragment is never sent to the server
    // and useSearchParams() can't see it at all, so it has to be read
    // directly off window.location on the client.
    if (typeof window !== "undefined" && window.location.hash) {
      const hashOrder = decodeURIComponent(window.location.hash.slice(1))
      if (hashOrder) {
        setOrderNumber(hashOrder)
        fetchTracking(hashOrder)
      }
    }
  }, [initialOrderNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTracking(orderNumber)
  }

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0
      case "CONFIRMED":
        return 1
      case "PACKED":
        return 2
      case "SHIPPED":
        return 3
      case "DELIVERED":
        return 4
      default:
        return -1
    }
  }

  const currentIdx = order ? getStepIndex(order.status) : -1

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-berber-gold/10 mb-4 shadow-sm">
          <Truck className="w-8 h-8 text-berber-gold" />
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-berber-black mb-3">
          Live Order Tracking
        </h1>
        <p className="text-berber-text-muted text-sm md:text-base max-w-md mx-auto">
          Enter your order number or use the link from your confirmation SMS to track real-time delivery status.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-berber-border rounded-2xl p-4 md:p-6 mb-8 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. ORD-2026-0001"
              className="w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all font-mono uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber.trim()}
            className="py-3.5 px-8 bg-berber-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-berber-gold transition-colors rounded-xl text-xs disabled:opacity-50 shadow-sm shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? "Tracking…" : "Track Order"}</span>
          </button>
        </div>
      </form>

      {/* Empty State */}
      {searched && !loading && !order && (
        <div className="text-center py-12 border border-berber-border rounded-2xl bg-white p-8">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-bold text-berber-black">No order found</p>
          <p className="text-xs text-berber-text-muted mt-1">
            We couldn't find an order matching <span className="font-mono font-bold text-berber-black">{orderNumber}</span>. Please check your order invoice or confirmation SMS.
          </p>
        </div>
      )}

      {/* Live Order Results */}
      {order && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status & Courier Banner */}
          <div className="bg-white border border-berber-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-berber-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-berber-text-muted font-bold">
                    Order Number
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-berber-muted text-berber-black">
                    {order.paymentMethod}
                  </span>
                </div>
                <p className="font-mono font-bold text-2xl text-berber-black mt-0.5">
                  #{order.orderNumber}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-berber-text-muted block">Placed on</span>
                <span className="text-xs font-semibold text-berber-black">
                  {new Date(order.createdAt).toLocaleDateString("en-BD", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Cancelled or Returned Alert */}
            {order.status === "CANCELLED" || order.status === "RETURNED" ? (
              <div className="flex items-center gap-3 text-red-700 p-4 bg-red-50 rounded-xl border border-red-200">
                <Ban className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">
                    Order {order.status === "CANCELLED" ? "Cancelled" : "Returned"}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Please contact our customer care team if you have any questions.
                  </p>
                </div>
              </div>
            ) : (
              /* Visual Journey Step Progress */
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-2 relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = currentIdx >= idx
                    const isCurrent = currentIdx === idx
                    const Icon = step.icon

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center gap-2">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                            isCurrent
                              ? "bg-berber-black border-berber-black text-white scale-110 shadow-md shadow-berber-gold/20"
                              : isDone
                              ? "bg-berber-gold border-berber-gold text-white"
                              : "bg-white border-berber-border text-berber-text-muted"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <p
                          className={cn(
                            "text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                            isCurrent ? "text-berber-black font-extrabold" : isDone ? "text-berber-black" : "text-berber-text-muted"
                          )}
                        >
                          {step.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Steadfast Live Courier Details */}
            {order.delivery && (
              <div className="mt-6 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">Steadfast Courier</span>
                      {order.delivery.consignmentId && (
                        <span className="text-[10.5px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800">
                          CID: {order.delivery.consignmentId}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-600 mt-0.5">
                      {order.delivery.liveCourierMessage || "Parcel dispatched with courier rider."}
                    </p>
                  </div>
                </div>

                {order.delivery.trackingCode && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tracking Code</span>
                    <span className="font-mono font-bold text-zinc-900">{order.delivery.trackingCode}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delivery & Address Summary */}
          <div className="bg-white border border-berber-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-base text-berber-black">
              Delivery Address & Payment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-700">
              <div className="space-y-1">
                <span className="text-berber-text-muted font-bold uppercase tracking-wider block">Recipient</span>
                <p className="font-semibold text-berber-black">{order.shippingName}</p>
                {order.shippingPhone && <p className="font-mono text-zinc-500">{order.shippingPhone}</p>}
                <p className="text-zinc-600 mt-1">{order.shippingAddress}</p>
                {[order.shippingArea, order.shippingDistrict].filter(Boolean).length > 0 && (
                  <p className="text-zinc-500 font-medium">
                    {[order.shippingArea, order.shippingDistrict].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-berber-border sm:pl-4 pt-3 sm:pt-0">
                <span className="text-berber-text-muted font-bold uppercase tracking-wider block">Payment Details</span>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Method:</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className="font-semibold">{order.paymentStatus}</span>
                </div>
                {order.paymentMethod === "COD" && (
                  <div className="flex justify-between pt-1 border-t border-zinc-100 font-bold text-amber-700">
                    <span>Payable on Delivery:</span>
                    <span className="font-mono text-sm">৳{order.netCodDue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-white border border-berber-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-heading font-bold text-lg mb-4 text-berber-black">
              Items in this Shipment ({order.items.length})
            </h2>
            <div className="space-y-3 mb-6 divide-y divide-zinc-100">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 pt-3 first:pt-0">
                  <div className="relative h-14 w-12 bg-berber-muted shrink-0 rounded-lg overflow-hidden border border-berber-border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">
                        Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-semibold text-berber-black truncate">{item.productName}</p>
                    <p className="text-berber-text-muted text-[11px] mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(" / ") || "Standard"} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-berber-black shrink-0">
                    ৳{(Number(item.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-berber-border flex justify-between font-bold text-sm text-berber-black">
              <span>Grand Total</span>
              <span className="font-mono text-base">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <p className="text-center text-xs text-berber-text-muted pb-8">
            Need assistance with your delivery? Contact our concierge at{" "}
            <a href="mailto:support@berber.clothing" className="underline hover:text-berber-gold font-semibold">
              support@berber.clothing
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center text-xs text-berber-text-muted animate-pulse">
          Loading live tracking...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  )
}
