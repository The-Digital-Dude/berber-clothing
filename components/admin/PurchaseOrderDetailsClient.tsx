"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, X, Building, Calendar, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  PENDING: { badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending Delivery" },
  RECEIVED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold", label: "Stock Received" },
  CANCELLED: { badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" },
}

export default function PurchaseOrderDetailsClient({ initialPO }: { initialPO: any }) {
  const router = useRouter()
  const [po, setPo] = useState(initialPO)

  useEffect(() => {
    setPo(initialPO)
  }, [initialPO])
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: "RECEIVED" | "CANCELLED") {
    if (
      status === "RECEIVED" &&
      !confirm("Mark as received? This will automatically increment stock counts in live inventory.")
    )
      return
    if (status === "CANCELLED" && !confirm("Cancel this purchase order?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) {
        setPo({ ...po, status: data.purchaseOrder.status })
        toast.success(
          status === "RECEIVED"
            ? "Stock updated and PO marked as received!"
            : "Purchase order cancelled"
        )
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update PO status")
      }
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = STATUS_CONFIG[po.status] || { badge: "bg-zinc-100 text-zinc-600 border-zinc-200", label: po.status }
  const totalUnits = po.items.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/purchase-orders"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-zinc-200/70 shrink-0"
            title="Back to Purchase Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 font-mono">
                {po.poNumber}
              </h1>
              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", statusInfo.badge)}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Vendor: <strong className="text-zinc-800">{po.supplier.name}</strong> · Created {new Date(po.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons if Pending */}
        {po.status === "PENDING" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={loading}
              onClick={() => updateStatus("RECEIVED")}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Receive Inbound Stock</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => updateStatus("CANCELLED")}
              className="h-9 px-3 rounded-xl border-zinc-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Cancel PO</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content: Items Table + Supplier Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Items Breakdown */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Inbound Garment Items & Stock Units</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Line items, variant sizes and negotiated cost breakdown</p>
            </div>
            <span className="text-xs font-bold font-mono text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
              {totalUnits} units total
            </span>
          </div>

          <div className="divide-y divide-zinc-100 p-5 space-y-4">
            {po.items.map((item: any) => (
              <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{item.variant?.product?.name || "Product"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono font-bold text-[11px]">
                      {item.variant?.size || "Standard"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono font-medium text-[11px]">
                      {item.variant?.color || "Default"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-mono">
                    ৳{Number(item.costPrice).toLocaleString()} × {item.quantity} pcs
                  </p>
                  <p className="text-sm font-extrabold text-zinc-900 font-mono mt-0.5">
                    ৳{(Number(item.costPrice) * Number(item.quantity)).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-zinc-50/70 border-t border-zinc-200/80 flex items-center justify-between text-sm font-bold">
            <span className="text-zinc-600">Total Purchase Order Value:</span>
            <span className="font-mono text-base font-black text-zinc-900">
              ৳{Number(po.totalCost).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Supplier & Notes */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-zinc-600 text-xs">Vendor Details</h3>
            <div className="space-y-1 text-zinc-700">
              <p className="font-bold text-sm text-zinc-900">{po.supplier.name}</p>
              {po.supplier.phone && <p className="font-mono">{po.supplier.phone}</p>}
              {po.supplier.email && <p className="text-zinc-400 truncate">{po.supplier.email}</p>}
              {po.supplier.address && <p className="text-zinc-500 pt-1">{po.supplier.address}</p>}
            </div>
          </div>

          {po.note && (
            <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-zinc-600 text-xs">Purchase Order Notes</h3>
              <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                {po.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
