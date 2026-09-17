"use client"
import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/context/CartContext"
import { toast } from "sonner"
import { ShoppingBag, Plus } from "lucide-react"
import Link from "next/link"

interface Variant { id: string; size: string | null; color: string | null; stock: number; price: number }
interface Product { id: string; name: string; slug: string; price: number; images: { url: string }[]; variants: Variant[] }
interface BundleItem { id: string; quantity: number; product: Product }
interface Bundle {
  id: string; name: string; slug: string; description: string | null
  price: number; comparePrice: number | null; image: string | null
  type: string; minItems: number | null; maxItems: number | null
  discountPct: number | null; items: BundleItem[]
}

export default function BundleDetail({ bundle }: { bundle: Bundle }) {
  const { addItem } = useCart()
  // For PICK_N: track which items are selected
  const isPickN = bundle.type === "PICK_N"
  const [selected, setSelected] = useState<Set<string>>(
    isPickN ? new Set() : new Set(bundle.items.map((i) => i.id))
  )
  // Per-item variant selection
  const [variantMap, setVariantMap] = useState<Record<string, string>>({})

  const savings = bundle.comparePrice ? Number(bundle.comparePrice) - Number(bundle.price) : null
  const minPick = bundle.minItems ?? bundle.items.length
  const maxPick = bundle.maxItems ?? bundle.items.length
  const canAdd = isPickN
    ? selected.size >= minPick && selected.size <= maxPick
    : true

  const toggleItem = (id: string) => {
    if (!isPickN) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < maxPick) next.add(id)
      return next
    })
  }

  const handleAddAll = () => {
    const itemsToAdd = bundle.items.filter((i) => selected.has(i.id))
    let allOk = true
    for (const item of itemsToAdd) {
      const variantId = variantMap[item.id]
      const variant = variantId
        ? item.product.variants.find((v) => v.id === variantId)
        : item.product.variants.find((v) => v.stock > 0)
      if (!variant) { allOk = false; continue }
      addItem({
        productId: item.product.id,
        variantId: variant.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images[0]?.url ?? "",
        quantity: item.quantity,
        size: variant.size ?? "",
        color: variant.color ?? "",
      })
    }
    if (allOk) toast.success(`${itemsToAdd.length} items added to bag!`)
    else toast.error("Some items are out of stock")
  }

  const firstImage = bundle.image ?? bundle.items[0]?.product.images[0]?.url

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-4">
        <Link href="/bundles" className="text-sm text-gray-400 hover:text-black">&larr; All Bundles</Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
          {firstImage ? (
            <Image src={firstImage} alt={bundle.name} fill className="object-cover" />
          ) : (
            <div className="grid grid-cols-2 h-full gap-1 p-1">
              {bundle.items.slice(0, 4).map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-xl bg-gray-100">
                  {item.product.images[0] && <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{bundle.name}</h1>
            {bundle.description && <p className="text-gray-500 mt-2">{bundle.description}</p>}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">৳{Number(bundle.price).toLocaleString()}</span>
            {bundle.comparePrice && (
              <span className="text-xl text-gray-400 line-through">৳{Number(bundle.comparePrice).toLocaleString()}</span>
            )}
            {savings && savings > 0 && (
              <span className="text-sm bg-[#c9a84c]/10 text-[#c9a84c] font-bold px-2 py-0.5 rounded-full">
                Save ৳{savings.toLocaleString()}
              </span>
            )}
          </div>

          {isPickN && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Choose {minPick === maxPick ? minPick : `${minPick}–${maxPick}`} items · {selected.size} selected
            </p>
          )}

          {/* Items list */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Included Items</p>
            {bundle.items.map((item) => {
              const isSelected = selected.has(item.id)
              const inStockVariants = item.product.variants.filter((v) => v.stock > 0)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center gap-4 border rounded-xl p-3 transition-all ${
                    isPickN ? "cursor-pointer" : ""
                  } ${isSelected ? "border-black bg-gray-50" : "border-gray-200 opacity-60"}`}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product.images[0] && <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  {/* Variant picker */}
                  {isSelected && inStockVariants.length > 1 && (
                    <select
                      value={variantMap[item.id] ?? ""}
                      onChange={(e) => { e.stopPropagation(); setVariantMap((p) => ({ ...p, [item.id]: e.target.value })) }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="">Auto</option>
                      {inStockVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {[v.size, v.color].filter(Boolean).join(" / ")}
                        </option>
                      ))}
                    </select>
                  )}
                  {inStockVariants.length === 0 && (
                    <span className="text-xs text-red-500 shrink-0">Out of stock</span>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={handleAddAll}
            disabled={!canAdd}
            className="w-full py-4 bg-black text-white rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[#c9a84c] transition-colors disabled:opacity-40"
          >
            <ShoppingBag className="w-4 h-4" />
            {isPickN ? `Add Selected (${selected.size}) to Bag` : "Add Bundle to Bag"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Items are added separately to your bag — you can adjust quantities at checkout.
          </p>
        </div>
      </div>
    </div>
  )
}
