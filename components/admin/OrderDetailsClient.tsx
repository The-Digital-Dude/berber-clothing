"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Printer,
  AlertTriangle,
  ShieldCheck,
  MessageCircle,
  Check,
  RefreshCw,
  Truck,
  Edit,
  Package,
  ArrowLeft,
  Phone,
  User,
  Clock,
  ExternalLink,
  Copy,
  CreditCard,
  Tag,
  FileText,
  Send,
  Sparkles,
  ChevronRight,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import type { CustomerRisk } from "@/lib/customerRisk"
import OrderItemsEditorModal from "@/components/admin/OrderItemsEditorModal"
import OrderMessages from "@/components/store/OrderMessages"
import { cn } from "@/lib/utils"
import { DIVISIONS, getDistricts, getAreaSuggestions } from "@/lib/bangladeshAddress"

const RISK_BADGE_CLASS: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200/80",
  HIGH: "bg-rose-50 text-rose-700 border-rose-200/80",
  NEW: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PACKED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  RETURNED: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  UNPAID: "bg-zinc-100 text-zinc-600 border-zinc-200",
  PENDING_VERIFICATION: "bg-sky-50 text-sky-700 border-sky-200",
  REFUNDED: "bg-rose-50 text-rose-700 border-rose-200",
}

const STEPPER_STAGES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const
const EXCEPTION_STATUSES = ["CANCELLED", "RETURNED"]

function ModernOrderStepper({
  status,
  loading,
  onAdvance,
  onSetException,
}: {
  status: string
  loading: boolean
  onAdvance: (status: string, statusNote?: string) => void
  onSetException: (status: string) => void
}) {
  const isException = EXCEPTION_STATUSES.includes(status)
  const currentIndex = STEPPER_STAGES.indexOf(status as any)

  return (
    <div className="space-y-4">
      {/* Progress Track */}
      <div className="relative flex items-center justify-between">
        {STEPPER_STAGES.map((stage, i) => {
          const isDone = !isException && i < currentIndex
          const isActive = !isException && i === currentIndex
          const isNext = !isException && !loading && i === currentIndex + 1

          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!isNext}
                onClick={() => isNext && onAdvance(stage)}
                title={isNext ? `Advance to ${stage}` : stage}
                className={cn(
                  "relative z-10 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all",
                  isDone && "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700",
                  isActive && "bg-zinc-950 text-white ring-4 ring-zinc-100 shadow-xs",
                  isNext && "border-2 border-dashed border-zinc-400 text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100 cursor-pointer animate-pulse",
                  !isDone && !isActive && !isNext && "border border-zinc-200 bg-zinc-50 text-zinc-400 cursor-default"
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
              </button>
              {i < STEPPER_STAGES.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 transition-all mx-1.5 rounded-full",
                    isDone ? "bg-emerald-600" : "bg-zinc-100"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-0.5">
        {STEPPER_STAGES.map((stage) => (
          <span
            key={stage}
            className={cn(
              stage === status ? "text-zinc-950 font-extrabold" : "text-zinc-400"
            )}
          >
            {stage}
          </span>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
        {isException ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Status: {status}
            </span>
            {status === "CANCELLED" && (
              <button
                type="button"
                onClick={() => onAdvance("CONFIRMED", "Reactivated — customer confirmed they want to proceed after all")}
                disabled={loading}
                title="Customer asked us to proceed after all — move this order back into the normal fulfillment flow"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Reactivate → Confirmed
              </button>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500">
            {currentIndex < STEPPER_STAGES.length - 1 ? (
              <>Click <strong className="text-zinc-800">{STEPPER_STAGES[currentIndex + 1]}</strong> to advance.</>
            ) : (
              <span className="text-emerald-700 font-semibold">Order fulfillment completed</span>
            )}
          </span>
        )}

        <select
          value={isException ? status : ""}
          onChange={(e) => e.target.value && onSetException(e.target.value)}
          disabled={loading}
          className="h-7 text-xs rounded-lg border border-zinc-200 bg-zinc-50/60 px-2 font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="">Exception / Return…</option>
          <option value="CANCELLED">Mark Cancelled</option>
          <option value="RETURNED">Mark Returned</option>
        </select>
      </div>
    </div>
  )
}

export default function OrderDetailsClient({
  initialOrder,
  customerRisk,
}: {
  initialOrder: any
  customerRisk?: CustomerRisk | null
}) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)

  useEffect(() => {
    setOrder(initialOrder)
    setCodNote(initialOrder.codCallNote ?? "")
    setTagsInput((initialOrder.tags ?? "").split(",").filter(Boolean).join(", "))
    setDeliveryData({
      courier: initialOrder.delivery?.courier || "STEADFAST",
      consignmentId: initialOrder.delivery?.consignmentId || "",
      trackingCode: initialOrder.delivery?.trackingCode || "",
    })
  }, [initialOrder])
  const [loading, setLoading] = useState(false)
  const [pendingWaLink, setPendingWaLink] = useState<string | null>(null)
  const [codNote, setCodNote] = useState(order.codCallNote ?? "")
  const [tagsInput, setTagsInput] = useState((order.tags ?? "").split(",").filter(Boolean).join(", "))
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"items" | "fulfillment" | "messages">("items")
  const [deliveryData, setDeliveryData] = useState({
    courier: order.delivery?.courier || "STEADFAST",
    consignmentId: order.delivery?.consignmentId || "",
    trackingCode: order.delivery?.trackingCode || "",
  })
  const [isEditingShipping, setIsEditingShipping] = useState(false)
  const [shippingForm, setShippingForm] = useState({
    name: order.shippingName, phone: order.shippingPhone, address: order.shippingAddress,
    division: order.shippingDivision, district: order.shippingDistrict, area: order.shippingArea,
  })
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({})
  const [shippingSaving, setShippingSaving] = useState(false)
  const canEditShipping = !["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)

  const startEditingShipping = () => {
    setShippingForm({
      name: order.shippingName, phone: order.shippingPhone, address: order.shippingAddress,
      division: order.shippingDivision, district: order.shippingDistrict, area: order.shippingArea,
    })
    setShippingErrors({})
    setIsEditingShipping(true)
  }

  const saveShipping = async () => {
    const errors: Record<string, string> = {}
    if (!shippingForm.name.trim()) errors.name = "Required"
    if (!shippingForm.phone.trim()) errors.phone = "Required"
    if (!shippingForm.division) errors.division = "Required"
    if (!shippingForm.district) errors.district = "Required"
    if (!shippingForm.area.trim()) errors.area = "Required"
    if (!shippingForm.address.trim()) errors.address = "Required"
    setShippingErrors(errors)
    if (Object.keys(errors).length > 0) return

    setShippingSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingName: shippingForm.name,
          shippingPhone: shippingForm.phone,
          shippingAddress: shippingForm.address,
          shippingDivision: shippingForm.division,
          shippingDistrict: shippingForm.district,
          shippingArea: shippingForm.area,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrder({ ...order, ...data.order })
        toast.success("Delivery details updated")
        setIsEditingShipping(false)
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update delivery details")
      }
    } finally {
      setShippingSaving(false)
    }
  }

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard!`)
  }

  // Status update
  const updateStatus = async (status: string, statusNote?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, statusNote }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, status: updated.status })
        if (updated.waLink) setPendingWaLink(updated.waLink)
        toast.success(`Order status updated to ${status}`)
        router.refresh()
      } else {
        toast.error("Failed to update order status")
      }
    } finally {
      setLoading(false)
    }
  }

  // Payment status update
  const updatePaymentStatus = async (paymentStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, paymentStatus: updated.paymentStatus })
        toast.success(`Payment status set to ${paymentStatus}`)
        router.refresh()
      } else {
        toast.error("Failed to update payment status")
      }
    } finally {
      setLoading(false)
    }
  }

  // Delivery update
  const saveDelivery = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryData),
      })
      if (res.ok) {
        toast.success("Delivery information saved successfully")
        router.refresh()
      } else {
        toast.error("Failed to save delivery info")
      }
    } finally {
      setLoading(false)
    }
  }

  // Dispatch courier
  const dispatchToCourier = async () => {
    setLoading(true)
    try {
      const isSteadfast = deliveryData.courier === "STEADFAST"
      const res = await fetch(isSteadfast ? "/api/courier/steadfast" : "/api/delivery/pathao/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (res.ok) {
        const consignment = isSteadfast ? data.consignment : data
        setDeliveryData({
          courier: deliveryData.courier,
          consignmentId: String(consignment.consignmentId ?? consignment.consignment_id ?? ""),
          trackingCode: consignment.trackingCode ?? consignment.tracking_code ?? "",
        })
        toast.success(`Parcel created successfully with ${isSteadfast ? "Steadfast" : "Pathao"}`)
        router.refresh()
      } else {
        toast.error(data.error || "Failed to create parcel")
      }
    } finally {
      setLoading(false)
    }
  }

  // Refresh tracking
  const refreshCourierTracking = async () => {
    setLoading(true)
    try {
      const isSteadfast = deliveryData.courier === "STEADFAST"
      const url = isSteadfast
        ? `/api/courier/steadfast?consignmentId=${encodeURIComponent(deliveryData.consignmentId)}`
        : `/api/delivery/pathao/track?orderId=${order.id}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        toast.success(`Courier status: ${data.internalStatus ?? data.status}`)
        router.refresh()
      } else {
        toast.error(data.error || "Failed to refresh tracking")
      }
    } finally {
      setLoading(false)
    }
  }

  // WhatsApp verification message generator
  const verifyCodViaWhatsApp = () => {
    const itemSummary = order.items
      .map((item: any) => `• ${item.productName} (${item.size}/${item.color}) x${item.quantity}`)
      .join("\n")
    const address = `${order.shippingAddress}, ${order.shippingArea}, ${order.shippingDistrict}, ${order.shippingDivision}`
    const message =
      `Hi ${order.shippingName}, this is Berber Clothing calling to confirm your Cash on Delivery order *#${order.orderNumber}*:\n\n` +
      `${itemSummary}\n\n` +
      `💵 Total due on delivery: ৳${order.total.toLocaleString()}\n` +
      `📍 Delivery address: ${address}\n\n` +
      `Can you please reply to confirm this order so our team can pack and dispatch your parcel today? Thank you!`
    const phone = order.shippingPhone.replace(/\D/g, "").replace(/^0/, "880")
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-zinc-200/70 shrink-0"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 font-mono">
                {order.orderNumber}
              </h1>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  STATUS_BADGE_CLASS[order.status] || "bg-zinc-100 text-zinc-700 border-zinc-200"
                )}
              >
                {order.status}
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  PAYMENT_STATUS_BADGE[order.paymentStatus] || "bg-zinc-100 text-zinc-700 border-zinc-200"
                )}
              >
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Placed {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/order/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Invoice</span>
          </a>
          <a
            href={`/print/orders/${order.id}/packing-slip`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Packing Slip</span>
          </a>
          {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && (
            <button
              onClick={() => setIsEditingItems(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/90 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit Items & Variants</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual WhatsApp Notification Banner if triggered */}
      {pendingWaLink && (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-900 shadow-2xs animate-in fade-in slide-in-from-top-2">
          <span className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            Customer notification link generated — click to send on WhatsApp:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pendingWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Open WhatsApp
            </a>
            <button
              onClick={() => setPendingWaLink(null)}
              className="px-2 py-1 text-emerald-700 text-xs hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: 8 cols Workspace + 4 cols Sticky Intelligence Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8-col Operations Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Workspace Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-1">
            <button
              onClick={() => setActiveWorkspaceTab("items")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                activeWorkspaceTab === "items"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Ordered Items ({order.items?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab("fulfillment")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                activeWorkspaceTab === "fulfillment"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Logistics & Courier ({deliveryData.courier})</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab("messages")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                activeWorkspaceTab === "messages"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Customer Thread</span>
            </button>
          </div>

          {/* TAB 1: ORDERED ITEMS & FINANCIAL SUMMARY */}
          {activeWorkspaceTab === "items" && (
            <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Line Items & Cart Breakdown</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Ordered products, size/color variants and price ledger</p>
                </div>
                {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && (
                  <button
                    onClick={() => setIsEditingItems(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-600" />
                    <span>Swap / Modify Items</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 p-5 space-y-4">
                {order.items?.map((item: any) => {
                  const img = item.product?.images?.[0]?.url || item.image
                  return (
                    <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {img ? (
                          <img
                            src={img}
                            alt={item.productName}
                            className="w-13 h-13 rounded-xl object-cover bg-zinc-50 border border-zinc-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-900 text-sm truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-semibold font-mono">
                              Size: {item.size || "Standard"}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-semibold font-mono">
                              Color: {item.color || "Default"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500 font-mono">
                          ৳{Number(item.price).toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-sm font-extrabold text-zinc-900 font-mono mt-0.5">
                          ৳{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Financials Ledger */}
              <div className="bg-zinc-50/70 border-t border-zinc-200/80 p-5 space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-zinc-800">৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>Delivery Charge:</span>
                  <span className="font-mono font-bold text-zinc-800">+৳{Number(order.shippingCharge).toLocaleString()}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount / Promo:</span>
                    <span className="font-mono font-bold">-৳{Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base">৳{Number(order.total).toLocaleString()}</span>
                </div>

                {Number(order.depositAmount) > 0 && (
                  <div
                    className={cn(
                      "flex justify-between items-center p-2.5 rounded-xl border font-semibold text-xs mt-2",
                      order.depositPaid
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    )}
                  >
                    <span>{order.depositPaid ? "Advance Paid (bKash)" : "Advance Pending"}:</span>
                    <span className="font-mono">৳{Number(order.depositAmount).toLocaleString()}</span>
                  </div>
                )}

                {order.depositPaid && (
                  <div className="flex justify-between text-zinc-500 font-medium pt-1">
                    <span>Cash Due upon Delivery:</span>
                    <span className="font-mono font-bold text-zinc-900">
                      ৳{Math.max(0, Number(order.total) - Number(order.depositAmount)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LOGISTICS & COURIER DISPATCH */}
          {activeWorkspaceTab === "fulfillment" && (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Courier & Parcel Fulfillment Center</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Automated Steadfast / Pathao parcel dispatch & tracking</p>
                </div>
                {order.delivery?.status && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live: {order.delivery.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Selected Courier</label>
                  <select
                    value={deliveryData.courier}
                    onChange={(e) => setDeliveryData({ ...deliveryData, courier: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                  >
                    <option value="STEADFAST">Steadfast Courier</option>
                    <option value="PATHAO">Pathao Courier</option>
                    <option value="REDX">RedX Delivery</option>
                    <option value="PAPERFLY">Paperfly</option>
                    <option value="SELF">Self Delivery</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Consignment ID</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={deliveryData.consignmentId}
                      onChange={(e) => setDeliveryData({ ...deliveryData, consignmentId: e.target.value })}
                      placeholder="e.g. 192837482"
                      className="w-full h-10 rounded-xl border border-zinc-300 bg-white px-3 pr-9 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                    />
                    {deliveryData.consignmentId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(deliveryData.consignmentId, "Consignment ID")}
                        className="absolute right-2.5 text-zinc-400 hover:text-zinc-900"
                        title="Copy Consignment ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Tracking Code / Link</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={deliveryData.trackingCode}
                      onChange={(e) => setDeliveryData({ ...deliveryData, trackingCode: e.target.value })}
                      placeholder="e.g. STF-8492048 or URL"
                      className="w-full h-10 rounded-xl border border-zinc-300 bg-white px-3 pr-9 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                    />
                    {deliveryData.trackingCode && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(deliveryData.trackingCode, "Tracking Code")}
                        className="absolute right-2.5 text-zinc-400 hover:text-zinc-900"
                        title="Copy Tracking Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Automated Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {(deliveryData.courier === "PATHAO" || deliveryData.courier === "STEADFAST") && (
                  <>
                    {!deliveryData.consignmentId ? (
                      <button
                        type="button"
                        onClick={dispatchToCourier}
                        disabled={loading}
                        className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" />
                        <span>{loading ? "Creating parcel…" : `Dispatch to ${deliveryData.courier === "PATHAO" ? "Pathao" : "Steadfast"}`}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={refreshCourierTracking}
                        disabled={loading}
                        className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        <span>Refresh Live Tracking</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={saveDelivery}
                  disabled={loading}
                  className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save Delivery Info"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER COMMUNICATION THREAD */}
          {activeWorkspaceTab === "messages" && (
            <div className="space-y-4">
              <OrderMessages orderId={order.id} isAdmin />
            </div>
          )}
        </div>

        {/* Right 4-col Sticky Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Order Lifecycle Stepper */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Fulfillment Progression
            </h2>
            <ModernOrderStepper
              status={order.status}
              loading={loading}
              onAdvance={updateStatus}
              onSetException={updateStatus}
            />
          </div>

          {/* Card 2: Customer Profile & Risk Intelligence */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Customer & Shipping
              </h2>
              <div className="flex items-center gap-2">
                {customerRisk && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider",
                      RISK_BADGE_CLASS[customerRisk.riskLevel] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                    )}
                  >
                    {customerRisk.riskLevel} Risk
                  </span>
                )}
                {canEditShipping && !isEditingShipping && (
                  <button
                    onClick={startEditingShipping}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                    title="Edit delivery details for this order"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isEditingShipping ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <input
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                    placeholder="Full name"
                    className={cn("w-full h-9 rounded-lg border px-3 font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900", shippingErrors.name ? "border-rose-400" : "border-zinc-300")}
                  />
                  {shippingErrors.name && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.name}</p>}
                </div>
                <div>
                  <input
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    placeholder="Phone"
                    className={cn("w-full h-9 rounded-lg border px-3 font-mono font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900", shippingErrors.phone ? "border-rose-400" : "border-zinc-300")}
                  />
                  {shippingErrors.phone && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.phone}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={shippingForm.division}
                      onChange={(e) => setShippingForm({ ...shippingForm, division: e.target.value, district: "", area: "" })}
                      className={cn("w-full h-9 rounded-lg border px-2 font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900", shippingErrors.division ? "border-rose-400" : "border-zinc-300")}
                    >
                      <option value="">Division</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {shippingErrors.division && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.division}</p>}
                  </div>
                  <div>
                    <select
                      value={shippingForm.district}
                      onChange={(e) => setShippingForm({ ...shippingForm, district: e.target.value, area: "" })}
                      disabled={!shippingForm.division}
                      className={cn("w-full h-9 rounded-lg border px-2 font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50", shippingErrors.district ? "border-rose-400" : "border-zinc-300")}
                    >
                      <option value="">District</option>
                      {getDistricts(shippingForm.division).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {shippingErrors.district && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.district}</p>}
                  </div>
                </div>
                <div>
                  <input
                    list="admin-shipping-area-suggestions"
                    value={shippingForm.area}
                    onChange={(e) => setShippingForm({ ...shippingForm, area: e.target.value })}
                    disabled={!shippingForm.district}
                    placeholder="Area / Thana"
                    className={cn("w-full h-9 rounded-lg border px-3 font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50", shippingErrors.area ? "border-rose-400" : "border-zinc-300")}
                  />
                  <datalist id="admin-shipping-area-suggestions">
                    {getAreaSuggestions(shippingForm.district).map((a) => <option key={a} value={a} />)}
                  </datalist>
                  {shippingErrors.area && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.area}</p>}
                </div>
                <div>
                  <textarea
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                    className={cn("w-full rounded-lg border px-3 py-2 font-medium text-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900", shippingErrors.address ? "border-rose-400" : "border-zinc-300")}
                  />
                  {shippingErrors.address && <p className="text-[11px] text-rose-600 mt-0.5">{shippingErrors.address}</p>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={saveShipping}
                    disabled={shippingSaving}
                    className="flex-1 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs disabled:opacity-50 transition-colors"
                  >
                    {shippingSaving ? "Saving…" : "Save Delivery Details"}
                  </button>
                  <button
                    onClick={() => setIsEditingShipping(false)}
                    disabled={shippingSaving}
                    className="h-9 px-3 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-zinc-900">{order.shippingName}</p>
                  <p className="text-zinc-500 font-mono mt-0.5">{order.shippingPhone}</p>
                  {order.user?.email && (
                    <p className="text-zinc-400 text-[11px] truncate mt-0.5">{order.user.email}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address Box */}
              <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-200/70 space-y-1 text-zinc-700">
                <p className="font-semibold text-zinc-900">{order.shippingAddress}</p>
                <p className="text-[11px] text-zinc-500">
                  {[order.shippingArea, order.shippingDistrict, order.shippingDivision].filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/${order.shippingPhone.replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(`Hi ${order.shippingName}, this is Berber regarding your order #${order.orderNumber}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${order.shippingPhone}`}
                  className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-bold text-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Call Direct</span>
                </a>
              </div>

              {/* COD WhatsApp Verification Trigger */}
              {order.paymentMethod === "COD" && (
                <button
                  type="button"
                  onClick={verifyCodViaWhatsApp}
                  className="w-full h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Verify COD Bill on WhatsApp</span>
                </button>
              )}

              {/* Customer Risk Details */}
              {customerRisk && customerRisk.riskLevel !== "NEW" && (
                <div className={cn("p-3 rounded-xl border text-[11px] space-y-1.5", RISK_BADGE_CLASS[customerRisk.riskLevel])}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {customerRisk.riskLevel === "HIGH" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>{customerRisk.riskLevel} Return Risk Warning</span>
                  </div>
                  <p>
                    <strong>{customerRisk.delivered}</strong> delivered vs <strong>{customerRisk.returnedOrCancelled}</strong> cancelled/returned ({Math.round((customerRisk.successRate ?? 0) * 100)}% delivery success).
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Card 3: Payment Management & Notes */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Payment & Operations
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  disabled={loading}
                  className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-2.5 font-bold text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="PARTIAL">Partial (Deposit paid)</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              {/* Payment Proof Preview if present */}
              {order.payment && (order.payment.transactionId || order.payment.screenshotUrl) && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Transaction Evidence</p>
                  {order.payment.transactionId && (
                    <p className="font-mono text-xs font-bold text-zinc-900 break-all">
                      Trx ID: {order.payment.transactionId}
                    </p>
                  )}
                  {order.payment.screenshotUrl && (
                    <a href={order.payment.screenshotUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={order.payment.screenshotUrl}
                        alt="Payment Proof"
                        className="rounded-lg border border-zinc-200 max-h-36 w-full object-cover cursor-zoom-in"
                      />
                    </a>
                  )}
                </div>
              )}

              {/* COD Call Notes */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Internal COD Call Note</label>
                <textarea
                  value={codNote}
                  onChange={(e) => setCodNote(e.target.value)}
                  placeholder="e.g. Customer confirmed delivery on 2nd attempt, deliver after 4 PM…"
                  rows={2}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/admin/orders/${order.id}/note`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ codCallNote: codNote }),
                    })
                    toast.success("COD call note saved")
                  }}
                  className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[11px] transition-colors"
                >
                  Save Note
                </button>
              </div>

              {/* Order Tags */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Order Tags</label>
                <div className="flex gap-2">
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="vip, fragile, urgent"
                    className="flex-1 h-8 rounded-lg border border-zinc-300 px-2.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const tags = tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean)
                      await fetch(`/api/admin/orders/${order.id}/tags`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tags }),
                      })
                      toast.success("Tags updated")
                    }}
                    className="px-3 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Activity & Status Log Timeline */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Audit & Activity Log
            </h2>
            <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {order.statusLogs?.map((log: any) => (
                <div key={log.id} className="relative pl-7 text-xs">
                  <div className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 ring-4 ring-white" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900">{log.status}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {log.note && <p className="text-zinc-500 text-[11px] mt-0.5 leading-relaxed">{log.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Line Item & Variant Modifier Modal */}
      <OrderItemsEditorModal
        order={order}
        isOpen={isEditingItems}
        onClose={() => setIsEditingItems(false)}
        onSaved={(updatedOrder) => {
          setOrder(updatedOrder)
          router.refresh()
        }}
      />
    </div>
  )
}
