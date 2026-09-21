"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"
import { toast } from "sonner"

type Variant = { id: string; size: string; color: string; colorHex?: string | null; stock: number; price?: number | null }
type CompanionProduct = {
  id: string
  name: string
  slug: string
  price: number
  images: { url: string }[]
  variants: Variant[]
}
type BundleItem = { id: string; product: CompanionProduct }
type Bundle = { id: string; discountPct?: number | null; items: BundleItem[] }

export default function CompleteTheSet({
  bundle,
  primaryName,
  primaryPrice,
  primaryColors = [],
}: {
  bundle: Bundle
  primaryName: string
  primaryPrice: number
  primaryColors?: string[]
}) {
  const addItem = useCartStore((s) => s.addItem)

  // Per-companion state: selected? + chosen variant
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [chosenVariant, setChosenVariant] = useState<Record<string, string>>({})

  const companions = bundle.items.map((bi) => bi.product)

  const toggle = (productId: string) => {
    setSelected((prev) => {
      const next = { ...prev, [productId]: !prev[productId] }
      // Auto-select first in-stock variant when toggling on
      if (next[productId] && !chosenVariant[productId]) {
        const product = companions.find((p) => p.id === productId)
        const first = product?.variants.find((v) => v.stock > 0)
        if (first) setChosenVariant((pv) => ({ ...pv, [productId]: first.id }))
      }
      return next
    })
  }

  const selectVariant = (productId: string, variantId: string) =>
    setChosenVariant((prev) => ({ ...prev, [productId]: variantId }))

  const selectedCompanions = companions.filter((p) => selected[p.id])

  // Pricing
  const companionTotal = selectedCompanions.reduce((sum, p) => {
    const v = p.variants.find((v) => v.id === chosenVariant[p.id])
    return sum + (v?.price != null ? Number(v.price) : p.price)
  }, 0)
  const subtotal = primaryPrice + companionTotal
  const discountPct = bundle.discountPct ? Number(bundle.discountPct) : 0
  const discount = discountPct > 0 ? Math.round(subtotal * discountPct / 100) : 0
  const total = subtotal - discount

  const addAllToCart = () => {
    if (selectedCompanions.length === 0) {
      toast.error("Select at least one companion piece to add.")
      return
    }
    // Validate all have a chosen in-stock variant
    for (const p of selectedCompanions) {
      const v = p.variants.find((v) => v.id === chosenVariant[p.id])
      if (!v || v.stock === 0) {
        toast.error(`Please pick an in-stock size/color for ${p.name}.`)
        return
      }
    }

    const setGroupId = crypto.randomUUID()

    for (const p of selectedCompanions) {
      const v = p.variants.find((vv) => vv.id === chosenVariant[p.id])!
      addItem({
        id: v.id,
        variantId: v.id,
        productId: p.id,
        productSlug: p.slug,
        name: p.name,
        price: v.price != null ? Number(v.price) : p.price,
        size: v.size,
        color: v.color,
        image: p.images[0]?.url || "",
        quantity: 1,
        setGroupId,
      })
    }

    toast.success(`${selectedCompanions.length} piece${selectedCompanions.length > 1 ? "s" : ""} added to your bag!`, {
      description: selectedCompanions.map((p) => p.name).join(" · "),
    })
  }

  if (companions.length === 0) return null

  return (
    <div className="mt-8 border border-berber-border rounded-xl overflow-hidden">
      <div className="bg-berber-muted/40 px-4 py-3 border-b border-berber-border">
        <p className="text-xs font-bold uppercase tracking-widest text-berber-black">Complete the Set</p>
        <p className="text-xs text-berber-text-muted mt-0.5">Add matching pieces — each piece has its own size and ships together.</p>
      </div>

      <div className="divide-y divide-berber-border">
        {companions.map((product) => {
          const isOn = !!selected[product.id]
          const inStockVariants = product.variants.filter((v) => v.stock > 0)
          const outOfStock = inStockVariants.length === 0
          const companionColors = Array.from(new Set(inStockVariants.map((v) => v.color)))
          const matchingColors = primaryColors.filter((c) => companionColors.includes(c))
          const currentVariant = product.variants.find((v) => v.id === chosenVariant[product.id])

          // Build unique sizes + colors for selects
          const sizes = Array.from(new Set(inStockVariants.map((v) => v.size)))
          const selectedSize = currentVariant?.size || sizes[0]
          const colorsForSize = inStockVariants.filter((v) => v.size === selectedSize).map((v) => v.color)
          const uniqueColors = Array.from(new Set(colorsForSize))

          const handleSizeChange = (size: string) => {
            const v = inStockVariants.find((vv) => vv.size === size)
            if (v) selectVariant(product.id, v.id)
          }
          const handleColorChange = (color: string) => {
            const v = inStockVariants.find((vv) => vv.size === selectedSize && vv.color === color)
            if (v) selectVariant(product.id, v.id)
          }

          return (
            <div key={product.id} className={`px-4 py-4 transition-colors ${isOn ? "bg-berber-gold/5" : "bg-white"}`}>
              <div className="flex items-center gap-3">
                {/* Toggle checkbox */}
                <button
                  onClick={() => !outOfStock && toggle(product.id)}
                  disabled={outOfStock}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    outOfStock
                      ? "border-berber-border opacity-40 cursor-not-allowed"
                      : isOn
                      ? "bg-berber-gold border-berber-gold"
                      : "border-berber-border hover:border-berber-gold"
                  }`}
                >
                  {isOn && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>

                {/* Image */}
                {product.images[0] && (
                  <div className="relative w-12 h-14 rounded overflow-hidden shrink-0">
                    <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${product.slug}`} className="text-sm font-medium hover:text-berber-gold transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  {outOfStock ? (
                    <p className="text-xs text-berber-error mt-0.5">Out of stock</p>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-berber-text-muted">
                        +৳{(currentVariant?.price != null ? Number(currentVariant.price) : product.price).toLocaleString()}
                      </p>
                      {matchingColors.length > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-berber-gold bg-berber-gold/10 px-1.5 py-0.5 rounded">
                          Matches · {matchingColors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Variant pickers — only when toggled on */}
              {isOn && !outOfStock && (
                <div className="mt-3 ml-8 flex flex-wrap gap-2">
                  {sizes.length > 1 && (
                    <div className="relative">
                      <select
                        value={selectedSize}
                        onChange={(e) => handleSizeChange(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-berber-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-berber-gold cursor-pointer"
                      >
                        {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-berber-text-muted" />
                    </div>
                  )}
                  {sizes.length === 1 && (
                    <span className="px-3 py-1.5 text-xs border border-berber-border rounded bg-white">{sizes[0]}</span>
                  )}

                  {uniqueColors.length > 1 && (
                    <div className="relative">
                      <select
                        value={currentVariant?.color || uniqueColors[0]}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-berber-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-berber-gold cursor-pointer"
                      >
                        {uniqueColors.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-berber-text-muted" />
                    </div>
                  )}
                  {uniqueColors.length === 1 && (
                    <span className="px-3 py-1.5 text-xs border border-berber-border rounded bg-white">{uniqueColors[0]}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer: total + add button */}
      <div className="px-4 py-4 bg-berber-muted/40 border-t border-berber-border space-y-3">
        {/* Price breakdown */}
        <div className="text-xs text-berber-text-muted space-y-1">
          <div className="flex justify-between">
            <span>{primaryName}</span>
            <span className="font-mono">৳{primaryPrice.toLocaleString()}</span>
          </div>
          {selectedCompanions.map((p) => {
            const v = p.variants.find((vv) => vv.id === chosenVariant[p.id])
            const price = v?.price != null ? Number(v.price) : p.price
            return (
              <div key={p.id} className="flex justify-between">
                <span>+ {p.name} ({v?.size})</span>
                <span className="font-mono">৳{price.toLocaleString()}</span>
              </div>
            )
          })}
          {discount > 0 && (
            <div className="flex justify-between text-berber-success font-medium">
              <span>{discountPct}% bundle discount</span>
              <span className="font-mono">−৳{discount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-berber-border">
          <div>
            <p className="text-xs text-berber-text-muted">{selectedCompanions.length + 1}-piece set total</p>
            <p className="text-lg font-mono font-bold text-berber-black">৳{total.toLocaleString()}</p>
          </div>
          <button
            onClick={addAllToCart}
            disabled={selectedCompanions.length === 0}
            className="px-5 py-2.5 bg-berber-black text-white text-xs font-bold uppercase tracking-widest hover:bg-berber-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-full"
          >
            Add pieces to bag
          </button>
        </div>
      </div>
    </div>
  )
}
