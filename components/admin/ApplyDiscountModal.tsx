"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tag, Sparkles, AlertCircle, Percent, DollarSign, Check, X, Trash2, Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ApplyDiscountModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onDiscountApplied: (updatedOrder: any) => void
}

export default function ApplyDiscountModal({
  isOpen,
  onClose,
  order,
  onDiscountApplied,
}: ApplyDiscountModalProps) {
  const [tab, setTab] = useState<"COUPON" | "MANUAL">("COUPON")
  const [couponCode, setCouponCode] = useState("")
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [previewData, setPreviewData] = useState<any | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)

  // Manual discount state
  const [manualType, setManualType] = useState<"FLAT" | "PERCENTAGE">("FLAT")
  const [manualValue, setManualValue] = useState<string>("")
  const [manualReason, setManualReason] = useState("")

  const [sendEmail, setSendEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const customerEmail = order?.user?.email || order?.guestEmail

  useEffect(() => {
    if (isOpen) {
      setPreviewData(null)
      setPreviewError(null)
      setCouponCode("")
      setManualValue("")
      setManualReason("")
      setSendEmail(!!customerEmail)

      // Fetch active coupons for quick select
      setLoadingCoupons(true)
      fetch("/api/admin/coupons")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.coupons)) {
            setAvailableCoupons(data.coupons.filter((c: any) => c.isActive))
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCoupons(false))
    }
  }, [isOpen, order, customerEmail])

  // Validate coupon live preview
  const handlePreviewCoupon = async (codeToTest?: string) => {
    const code = (codeToTest || couponCode).trim()
    if (!code) {
      setPreviewData(null)
      setPreviewError(null)
      return
    }

    setPreviewing(true)
    setPreviewError(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PREVIEW",
          couponCode: code,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPreviewError(data.error || "Invalid coupon")
        setPreviewData(null)
      } else {
        setPreviewData(data)
        setPreviewError(null)
      }
    } catch {
      setPreviewError("Failed to validate coupon")
      setPreviewData(null)
    } finally {
      setPreviewing(false)
    }
  }

  // Calculate live preview for manual discount
  const subtotal = Number(order?.subtotal || 0)
  const shipping = Number(order?.shippingCharge || 0)
  const giftWrap = Number(order?.giftWrapCharge || 0)

  let calculatedManualDiscount = 0
  const parsedVal = Number(manualValue)
  if (!isNaN(parsedVal) && parsedVal > 0) {
    if (manualType === "PERCENTAGE") {
      calculatedManualDiscount = Math.round((subtotal * Math.min(100, parsedVal)) / 100)
    } else {
      calculatedManualDiscount = Math.min(subtotal, parsedVal)
    }
  }
  const manualNewTotal = Math.max(0, subtotal + shipping + giftWrap - calculatedManualDiscount)

  // Submit discount
  const handleApply = async () => {
    setSubmitting(true)
    try {
      let body: any = { sendConfirmationEmail: sendEmail }

      if (tab === "COUPON") {
        if (!couponCode.trim()) {
          toast.error("Please enter or select a coupon code")
          setSubmitting(false)
          return
        }
        body.action = "APPLY_COUPON"
        body.couponCode = couponCode.trim()
      } else {
        if (!parsedVal || parsedVal <= 0) {
          toast.error("Please enter a valid discount amount")
          setSubmitting(false)
          return
        }
        body.action = "APPLY_MANUAL"
        body.discountType = manualType
        body.discountValue = parsedVal
        body.reason = manualReason.trim()
      }

      const res = await fetch(`/api/admin/orders/${order.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to apply discount")
        return
      }

      toast.success(data.message || "Discount applied successfully")
      onDiscountApplied(data.order)
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Failed to update order discount")
    } finally {
      setSubmitting(false)
    }
  }

  // Remove existing discount
  const handleRemoveDiscount = async () => {
    if (!confirm("Are you sure you want to remove the discount from this order?")) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REMOVE_DISCOUNT" }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to remove discount")
        return
      }

      toast.success("Discount removed from order")
      onDiscountApplied(data.order)
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Failed to remove discount")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg w-[95vw] p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Apply Coupon or Discount</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Order <span className="font-mono font-bold text-zinc-900">{order?.orderNumber}</span> · Current Discount:{" "}
                <span className="font-bold text-emerald-700 font-mono">৳{Number(order?.discount || 0).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 text-xs">
          {/* Tab Selector */}
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab("COUPON")}
              className={cn(
                "flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                tab === "COUPON"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Official Coupon Code</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("MANUAL")}
              className={cn(
                "flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                tab === "MANUAL"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Percent className="w-3.5 h-3.5 text-blue-500" />
              <span>Custom Manual Discount</span>
            </button>
          </div>

          {/* TAB 1: COUPON CODE */}
          {tab === "COUPON" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setPreviewData(null)
                      setPreviewError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handlePreviewCoupon()
                      }
                    }}
                    placeholder="e.g. SUMMER10, WELCOME2026"
                    className="flex-1 h-9 rounded-lg border border-zinc-300 px-3 font-mono font-bold text-zinc-900 uppercase focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handlePreviewCoupon()}
                    disabled={previewing || !couponCode.trim()}
                    className="px-3.5 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold disabled:opacity-40 transition-colors shrink-0"
                  >
                    {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                  </button>
                </div>
              </div>

              {/* Quick Select from Active Store Coupons */}
              {availableCoupons.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400 font-medium">Or select an active promotion:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCouponCode(c.code)
                          handlePreviewCoupon(c.code)
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition-all flex items-center gap-1",
                          couponCode === c.code
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                        )}
                      >
                        <span>{c.code}</span>
                        <span className="text-[10px] font-normal opacity-70">
                          ({c.type === "PERCENTAGE" ? `${c.value}%` : `৳${c.value}`})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon Verification Message */}
              {previewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              {previewData && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Coupon Valid: {previewData.couponCode}</span>
                    </span>
                    <span className="font-mono">-৳{previewData.discount.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex justify-between pt-1 border-t border-emerald-200/60 font-medium">
                    <span>New Order Total:</span>
                    <span className="font-bold font-mono text-zinc-900 text-xs">
                      ৳{previewData.newTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM MANUAL DISCOUNT */}
          {tab === "MANUAL" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setManualType("FLAT")}
                      className={cn(
                        "py-1.5 font-bold rounded-md text-xs transition-all",
                        manualType === "FLAT" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500"
                      )}
                    >
                      Flat (৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualType("PERCENTAGE")}
                      className={cn(
                        "py-1.5 font-bold rounded-md text-xs transition-all",
                        manualType === "PERCENTAGE" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500"
                      )}
                    >
                      Percent (%)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                    {manualType === "FLAT" ? "Amount (৳)" : "Percentage (%)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={manualType === "PERCENTAGE" ? 100 : subtotal}
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder={manualType === "FLAT" ? "e.g. 150" : "e.g. 15"}
                    className="w-full h-9 rounded-lg border border-zinc-300 px-3 font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                  Reason / Internal Note (Optional)
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Customer forgot coupon code during phone call"
                  className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {calculatedManualDiscount > 0 && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Discount to Apply:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      -৳{calculatedManualDiscount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-900 font-bold pt-1 border-t border-zinc-200">
                    <span>Revised Grand Total:</span>
                    <span className="font-mono text-sm">৳{manualNewTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Notification Option */}
          {customerEmail && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <label htmlFor="send-discount-email" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="send-discount-email"
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Send updated confirmation email to {customerEmail}</span>
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 gap-3">
            {Number(order?.discount || 0) > 0 ? (
              <button
                type="button"
                onClick={handleRemoveDiscount}
                disabled={submitting}
                className="px-3.5 h-9 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Discount</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 h-9 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={
                  submitting ||
                  (tab === "COUPON" && !couponCode.trim()) ||
                  (tab === "MANUAL" && (!parsedVal || parsedVal <= 0))
                }
                className="px-5 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Apply Discount</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
