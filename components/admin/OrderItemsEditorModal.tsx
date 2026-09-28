"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Plus, Trash2, Search, Loader2, Package, Check, X
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type LineItem = {
  id?: string
  productId: string
  variantId: string
  productName: string
  size: string
  color: string
  price: number
  quantity: number
  image?: string
}

export default function OrderItemsEditorModal({
  order,
  isOpen,
  onClose,
  onSaved,
}: {
  order: any
  isOpen: boolean
  onClose: () => void
  onSaved: (updatedOrder: any) => void
}) {
  const [items, setItems] = useState<LineItem[]>([])
  const [shippingCharge, setShippingCharge] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)
  const [note, setNote] = useState<string>("")
  const [saving, setSaving] = useState(false)

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [addQty, setAddQty] = useState(1)

  // Cache for product variants
  const [productVariantsMap, setProductVariantsMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (order && isOpen) {
      setShippingCharge(Number(order.shippingCharge || 0))
      setDiscount(Number(order.discount || 0))
      setNote("")
      setSearchQuery("")
      setSelectedProduct(null)

      // Initialize line items
      const initialItems: LineItem[] = (order.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        variantId: it.variantId,
        productName: it.productName,
        size: it.size || "Standard",
        color: it.color || "Default",
        price: Number(it.price),
        quantity: Number(it.quantity),
        image: it.product?.images?.[0]?.url || "",
      }))
      setItems(initialItems)

      // Fetch full variants for each product in the order
      const uniqueProductIds = Array.from(new Set(initialItems.map((i) => i.productId)))
      uniqueProductIds.forEach((pId) => {
        fetch(`/api/admin/products/${pId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.variants) {
              setProductVariantsMap((prev) => ({ ...prev, [pId]: data.variants }))
            }
          })
          .catch(() => {})
      })
    }
  }, [order, isOpen])

  // Catalog search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data || [])
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Subtotal and Total computation
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const grandTotal = Math.max(0, subtotal + Number(shippingCharge) - Number(discount))

  // Update item variant (e.g. Size / Color change)
  const handleVariantChange = (itemIndex: number, newVariantId: string) => {
    const item = items[itemIndex]
    const variants = productVariantsMap[item.productId] || []
    const newVariant = variants.find((v) => v.id === newVariantId)

    if (newVariant) {
      const updated = [...items]
      updated[itemIndex] = {
        ...item,
        variantId: newVariant.id,
        size: newVariant.size || "Standard",
        color: newVariant.color || "Default",
        price: Number(newVariant.price) || item.price,
      }
      setItems(updated)
      toast.success(`Selected variant: ${newVariant.size || "Standard"} / ${newVariant.color || "Default"}`)
    }
  }

  // Update item price manually
  const handlePriceChange = (itemIndex: number, newPrice: number) => {
    const updated = [...items]
    updated[itemIndex] = { ...updated[itemIndex], price: Math.max(0, newPrice) }
    setItems(updated)
  }

  // Update item quantity
  const handleQtyChange = (itemIndex: number, newQty: number) => {
    if (newQty < 1) return
    const updated = [...items]
    updated[itemIndex] = { ...updated[itemIndex], quantity: newQty }
    setItems(updated)
  }

  // Remove an item
  const handleRemoveItem = (itemIndex: number) => {
    if (items.length <= 1) {
      toast.error("Order must contain at least 1 item.")
      return
    }
    setItems(items.filter((_, idx) => idx !== itemIndex))
  }

  // Add selected new product from catalog search
  const handleAddProduct = () => {
    if (!selectedProduct || !selectedVariantId) {
      toast.error("Please select a variant (size/color).")
      return
    }
    const variant = (selectedProduct.variants || []).find((v: any) => v.id === selectedVariantId)
    if (!variant) return

    const newItem: LineItem = {
      productId: selectedProduct.id,
      variantId: variant.id,
      productName: selectedProduct.name,
      size: variant.size || "Standard",
      color: variant.color || "Default",
      price: Number(variant.price) || Number(selectedProduct.price),
      quantity: addQty,
      image: selectedProduct.images?.[0]?.url || "",
    }

    setItems([...items, newItem])
    // Cache variants for this product
    setProductVariantsMap((prev) => ({
      ...prev,
      [selectedProduct.id]: selectedProduct.variants,
    }))

    setSelectedProduct(null)
    setSelectedVariantId("")
    setSearchQuery("")
    setAddQty(1)
    toast.success(`Added "${selectedProduct.name}" to order`)
  }

  // Save all modifications
  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Order cannot be empty.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingCharge,
          discount,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update order items")

      toast.success("Order items and totals successfully updated!")
      onSaved(data)
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Failed to save item modifications")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl w-[94vw] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>Modify Order Items & Variants</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Order <span className="font-mono font-bold text-zinc-900">{order?.orderNumber}</span> · Stock balances adjust automatically
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Current Order Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Ordered Items ({items.length})
              </h3>
              <span className="text-[11px] text-zinc-400">Change size, color, price or qty below</span>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const variants = productVariantsMap[item.productId] || []
                return (
                  <div
                    key={`${item.variantId}-${idx}`}
                    className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/90 hover:border-zinc-300 transition-all space-y-3"
                  >
                    {/* Top Row: Thumbnail + Product Name + Remove Button */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-11 h-11 rounded-xl object-cover bg-white border border-zinc-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-900 text-xs truncate">{item.productName}</p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            Current: <span className="text-zinc-600 font-semibold">{item.size}</span> / <span className="text-zinc-600 font-semibold">{item.color}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2.5 border-t border-zinc-200/60 items-end text-xs">
                      {/* Variant Selector: 6 cols */}
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                          Size & Color Variant
                        </label>
                        {variants.length > 0 ? (
                          <select
                            value={item.variantId}
                            onChange={(e) => handleVariantChange(idx, e.target.value)}
                            className="w-full h-8 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
                          >
                            {variants.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {v.size || "Standard"} / {v.color || "Default"} (Stock: {v.stock})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="h-8 px-2.5 flex items-center rounded-lg border border-zinc-200 bg-zinc-100/60 text-[11px] text-zinc-600 font-medium">
                            Size: {item.size} · Color: {item.color}
                          </div>
                        )}
                      </div>

                      {/* Unit Price: 3 cols */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                          Unit Price (৳)
                        </label>
                        <div className="flex items-center gap-1 bg-white border border-zinc-300 rounded-lg px-2 h-8 shadow-2xs">
                          <span className="text-zinc-400 text-xs font-mono font-bold">৳</span>
                          <input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold text-zinc-900 focus:outline-none bg-transparent"
                            title="Edit unit price"
                          />
                        </div>
                      </div>

                      {/* Quantity & Total: 3 cols */}
                      <div className="sm:col-span-3 flex items-center justify-between gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                            Qty
                          </label>
                          <div className="flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden h-8 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity - 1)}
                              className="px-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-zinc-900 text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity + 1)}
                              className="px-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right flex-1 pl-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                            Total
                          </label>
                          <p className="font-mono font-bold text-zinc-950 text-xs h-8 flex items-center justify-end">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Add / Swap with Product from Catalog */}
          <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add / Swap with Product from Catalog
            </h3>

            {/* Product search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog products by title or SKU…"
                className="w-full h-8.5 pl-8.5 pr-3 rounded-xl bg-white border border-zinc-300 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-zinc-400" />
              )}
            </div>

            {/* Search results dropdown list */}
            {searchResults.length > 0 && !selectedProduct && (
              <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 bg-white border border-zinc-200 rounded-xl shadow-md">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p)
                      setSelectedVariantId(p.variants?.[0]?.id || "")
                      setSearchResults([])
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-zinc-50 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.images?.[0]?.url || "/placeholder.png"}
                        alt={p.name}
                        className="w-8 h-8 rounded-md object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {p.category?.name || "Uncategorized"} · {p.variants?.length || 0} variants
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 shrink-0">
                      ৳{Number(p.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Product Variant Picker */}
            {selectedProduct && (
              <div className="bg-white rounded-xl p-3 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{selectedProduct.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {(selectedProduct.variants || []).map((v: any) => (
                          <option key={v.id} value={v.id}>
                            Size: {v.size || "OS"} · Color: {v.color || "Def"} (Stock: {v.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-zinc-400">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 h-7 text-xs font-mono font-bold text-center border border-zinc-300 rounded-md"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddProduct}
                    className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                  >
                    Add to Order
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProduct(null)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Totals & Modification Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200/80 text-xs">
            {/* Left: Reason Note */}
            <div>
              <label className="font-bold uppercase text-[10px] tracking-wider text-zinc-500 block mb-1">
                Reason / Note for Customer Request
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Customer called to change Black M to Navy L and added an extra item…"
                rows={3}
                className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-zinc-400 shadow-2xs"
              />
            </div>

            {/* Right: Financial Breakdown */}
            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Items Subtotal:</span>
                <span className="font-mono font-bold text-zinc-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Shipping Charge:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-zinc-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                    className="w-20 h-6.5 text-right font-mono font-bold text-xs border border-zinc-300 rounded-md px-1.5 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Discount / Coupon:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold">-৳</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-20 h-6.5 text-right font-mono font-bold text-xs border border-zinc-300 rounded-md px-1.5 bg-white text-emerald-700"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 font-bold text-sm">
                <span className="text-zinc-900">New Grand Total:</span>
                <span className="font-mono text-base text-zinc-950">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-1.5 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Changes…</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Item Modifications</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
