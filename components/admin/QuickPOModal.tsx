"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Package, ShoppingCart, Check, Plus, Trash2, Building } from "lucide-react"
import { toast } from "sonner"

interface POItem {
  variantId: string
  label: string
  currentStock: number
  quantity: number
  costPrice: number
}

interface QuickPOModalProps {
  product: any
  initialVariantId?: string
  isOpen: boolean
  onClose: () => void
}

export default function QuickPOModal({
  product,
  initialVariantId,
  isOpen,
  onClose,
}: QuickPOModalProps) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [items, setItems] = useState<POItem[]>([])
  const [note, setNote] = useState<string>("")
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch suppliers on modal open
  useEffect(() => {
    if (!isOpen) return
    setLoadingSuppliers(true)
    fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((data) => {
        const list = data.suppliers || data || []
        setSuppliers(list)
        if (list.length > 0) setSelectedSupplierId(list[0].id)
      })
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false))
  }, [isOpen])

  // Initialize line items
  useEffect(() => {
    if (!product || !isOpen) return

    const variants = product.variants || []
    const targetVariants = initialVariantId
      ? variants.filter((v: any) => v.id === initialVariantId)
      : variants

    const initialItems: POItem[] = (targetVariants.length > 0 ? targetVariants : variants).map((v: any) => {
      const isLow = (v.stock ?? 0) <= 5
      const suggestedQty = isLow ? Math.max(10, 20 - (v.stock ?? 0)) : 10
      return {
        variantId: v.id,
        label: `${v.size || "Standard"} / ${v.color || "Default"}`,
        currentStock: v.stock ?? 0,
        quantity: suggestedQty,
        costPrice: Number(v.costPrice || product.price * 0.5 || 500),
      }
    })

    setItems(initialItems)
    setNote(`Restock order for ${product.name}`)
  }, [product, initialVariantId, isOpen])

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleQtyChange = (index: number, newQty: number) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], quantity: Math.max(1, newQty) }
      return copy
    })
  }

  const handleCostChange = (index: number, newCost: number) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], costPrice: Math.max(0, newCost) }
      return copy
    })
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("PO must contain at least one item.")
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier.")
      return
    }
    if (items.length === 0) {
      toast.error("Please add at least one item.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          note: note.trim() || undefined,
          items: items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
            costPrice: it.costPrice,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create PO")

      toast.success(`Purchase Order ${data.purchaseOrder?.poNumber || ""} created successfully!`, {
        action: {
          label: "View POs",
          onClick: () => router.push("/admin/purchase-orders"),
        },
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-[94vw] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <span>Create Restock Purchase Order</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Product: <strong className="text-zinc-800">{product?.name}</strong>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Supplier Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-zinc-400" />
              <span>Select Supplier / Manufacturer</span>
            </label>
            {loadingSuppliers ? (
              <div className="h-9 flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading registered suppliers…</span>
              </div>
            ) : suppliers.length > 0 ? (
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactPerson ? `(${s.contactPerson})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No suppliers configured yet.{" "}
                <a href="/admin/suppliers" className="font-bold underline">
                  Add a supplier first
                </a>
                .
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Restock Variants & Quantity ({items.length})
              </label>
              <span className="text-[11px] text-zinc-400">Total Units: {totalUnits} pcs</span>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 pl-3.5 pr-2">Variant</th>
                    <th className="py-2.5 px-2">Current</th>
                    <th className="py-2.5 px-2">Unit Cost (৳)</th>
                    <th className="py-2.5 px-2">Order Qty</th>
                    <th className="py-2.5 px-2 text-right">Subtotal</th>
                    <th className="py-2.5 pr-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => (
                    <tr key={item.variantId} className="hover:bg-zinc-50/50">
                      <td className="py-2 pl-3.5 pr-2 font-mono font-bold text-zinc-900">
                        {item.label}
                      </td>
                      <td className="py-2 px-2 text-zinc-500 font-mono">
                        <span className={item.currentStock <= 5 ? "text-amber-600 font-bold" : ""}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-zinc-400 font-mono">৳</span>
                          <input
                            type="number"
                            min={0}
                            value={item.costPrice}
                            onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                            className="w-full h-7 px-1.5 font-mono text-xs font-bold rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-16 h-7 px-2 text-center font-mono font-black text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-zinc-900">
                        ৳{(item.quantity * item.costPrice).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internal PO Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              PO Note / Instruction
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Urgent fabric restock, requested delivery within 5 business days…"
              rows={2}
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-zinc-500">Estimated PO Cost:</p>
            <p className="text-base font-black text-zinc-900 font-mono">
              ৳{totalCost.toLocaleString()}{" "}
              <span className="text-xs font-normal text-zinc-400">({totalUnits} units)</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-zinc-700 bg-white border-zinc-200 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !selectedSupplierId || items.length === 0}
              className="h-9 px-5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  <span>Generate Purchase Order</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
