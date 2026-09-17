"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, ShoppingBag, Check, Package, Truck, Home, Ban } from "lucide-react"
import { toast } from "sonner"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const

const STATUS_META: Record<string, { label: string; icon: any; color: string }> = {
  PENDING:   { label: "Order Placed", icon: ShoppingBag, color: "text-gray-500" },
  CONFIRMED: { label: "Confirmed",    icon: Check,       color: "text-blue-500" },
  PACKED:    { label: "Packed",       icon: Package,     color: "text-purple-500" },
  SHIPPED:   { label: "Shipped",      icon: Truck,       color: "text-amber-500" },
  DELIVERED: { label: "Delivered",    icon: Home,        color: "text-green-500" },
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim()) return
    setLoading(true)
    setSearched(true)
    setOrder(null)
    try {
      const res = await fetch("/api/store/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Order not found")
      } else {
        setOrder(data)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const currentIdx = order ? STATUS_STEPS.indexOf(order.status) : -1

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-berber-gold/10 mb-6">
          <Truck className="w-8 h-8 text-berber-gold" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-berber-black mb-4">Track Your Order</h1>
        <p className="text-berber-text-muted">Enter your order number to check your delivery status.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-berber-border rounded-2xl p-6 md:p-8 mb-10">
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Order Number</label>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-2026-0001"
            className="w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-berber-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-berber-gold transition-colors rounded-full text-xs disabled:opacity-50"
        >
          <Search className="w-4 h-4" /> {loading ? "Searching…" : "Track Order"}
        </button>
      </form>

      {searched && !loading && !order && (
        <div className="text-center py-12 border border-berber-border rounded-2xl bg-white">
          <p className="text-berber-text-muted">No order found for <span className="font-mono font-medium">{orderNumber}</span>.</p>
          <p className="text-xs text-berber-text-muted mt-2">Double-check your order number and try again.</p>
        </div>
      )}

      {order && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status card */}
          <div className="bg-white border border-berber-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-berber-text-muted font-bold">Order</p>
                <p className="font-mono font-bold text-xl">{order.orderNumber}</p>
              </div>
              <p className="text-sm text-berber-text-muted">{new Date(order.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            {(order.status === "CANCELLED" || order.status === "RETURNED") ? (
              <div className="flex items-center gap-3 text-berber-error p-4 bg-red-50 rounded-xl">
                <Ban className="w-5 h-5 shrink-0" />
                <span className="font-bold">Order {order.status === "CANCELLED" ? "Cancelled" : "Returned"}</span>
              </div>
            ) : (
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-berber-border" />
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentIdx >= idx
                  const isCurrent = currentIdx === idx
                  const Icon = STATUS_META[step].icon
                  const log = order.statusLogs?.find((l: any) => l.status === step)
                  return (
                    <div key={step} className="relative flex flex-col items-center gap-2 flex-1 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent ? "bg-berber-gold border-berber-gold text-white scale-110 shadow-lg shadow-berber-gold/30"
                        : isDone ? "bg-berber-gold border-berber-gold text-white"
                        : "bg-white border-berber-border text-berber-text-muted"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDone ? "text-berber-black" : "text-berber-text-muted"}`}>
                        {STATUS_META[step].label}
                      </p>
                      {log && (
                        <p className="text-[9px] text-berber-text-muted text-center">
                          {new Date(log.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {order.delivery?.trackingCode && (
              <div className="mt-6 pt-6 border-t border-berber-border flex items-center gap-3 text-sm">
                <Truck className="w-4 h-4 text-berber-gold shrink-0" />
                <span className="text-berber-text-muted">{order.delivery.courier}</span>
                <span className="text-berber-text-muted">·</span>
                <span className="font-mono font-medium">{order.delivery.trackingCode}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-berber-border rounded-2xl p-6 md:p-8">
            <h2 className="font-heading font-bold text-lg mb-5">Items Ordered</h2>
            <div className="space-y-4 mb-6">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="relative h-16 w-12 bg-berber-muted shrink-0 rounded-lg overflow-hidden">
                    {item.image && <Image src={item.image} alt={item.productName} fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-berber-text-muted text-xs mt-0.5">{[item.size, item.color].filter(Boolean).join(" / ")} · Qty {item.quantity}</p>
                  </div>
                  <span className="font-mono text-sm font-medium">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-berber-border flex justify-between font-bold">
              <span>Total</span>
              <span className="font-mono">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <p className="text-center text-xs text-berber-text-muted pb-8">
            Questions? Contact us at <a href="mailto:support@berber.clothing" className="underline hover:text-berber-gold">support@berber.clothing</a>
          </p>
        </div>
      )}
    </div>
  )
}
