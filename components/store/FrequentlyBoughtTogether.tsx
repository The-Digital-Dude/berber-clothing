"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/useCartStore"
import { useCartUIStore } from "@/store/useCartUIStore"
import { ShoppingBag, Plus, Check, Sparkles, ChevronDown } from "lucide-react"
import { toast } from "sonner"

export interface FBTVariant {
  id: string
  size: string
  color: string
  stock: number
  price?: number | null
}

export interface FBTProduct {
  id: string
  name: string
  slug: string
  price: number
  images: { url: string; alt?: string }[]
  variants: FBTVariant[]
  discountPct?: number
}

interface Props {
  primary: FBTProduct
  suggestions: FBTProduct[]
}

export default function FrequentlyBoughtTogether({ primary, suggestions }: Props) {
  const { addItem } = useCartStore()
  const openCartDrawer = useCartUIStore((s) => s.open)
  const [loading, setLoading] = useState(false)

  const allProducts = useMemo(() => [primary, ...suggestions], [primary, suggestions])

  // Selected products state (by id) - default to all selected
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = { [primary.id]: true }
    suggestions.forEach((s) => {
      init[s.id] = true
    })
    return init
  })

  // Selected variant per product state (by productId -> variantId)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    allProducts.forEach((p) => {
      const inStock = p.variants.find((v) => v.stock > 0) || p.variants[0]
      if (inStock) init[p.id] = inStock.id
    })
    return init
  })

  if (suggestions.length === 0) return null

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Active selected products
  const activeSelected = allProducts.filter((p) => selectedIds[p.id])
  const selectedCount = activeSelected.length

  // Calculate bundle discount %
  const activeSuggestions = suggestions.filter((s) => selectedIds[s.id])
  const configuredDiscountPct =
    activeSuggestions.length > 0
      ? Math.max(...activeSuggestions.map((s) => Number(s.discountPct || 0)))
      : 0

  // Effective discount % (if configured, or bonus 5% for 2 items, 10% for 3+ items)
  const effectiveDiscountPct =
    configuredDiscountPct > 0
      ? configuredDiscountPct
      : selectedCount >= 3
      ? 10
      : selectedCount === 2
      ? 5
      : 0

  // Calculate pricing
  const originalTotalPrice = activeSelected.reduce((sum, p) => {
    const vId = selectedVariants[p.id]
    const variant = p.variants.find((v) => v.id === vId)
    const price = variant?.price ? Number(variant.price) : p.price
    return sum + price
  }, 0)

  const savingsAmount = Math.round((originalTotalPrice * effectiveDiscountPct) / 100)
  const finalTotalPrice = Math.max(0, originalTotalPrice - savingsAmount)

  // Add all selected to cart
  const handleAddBundle = () => {
    if (activeSelected.length === 0) {
      toast.error("Please select at least one item")
      return
    }

    setLoading(true)
    let addedCount = 0

    activeSelected.forEach((p) => {
      const vId = selectedVariants[p.id]
      const variant = p.variants.find((v) => v.id === vId) || p.variants.find((v) => v.stock > 0) || p.variants[0]
      
      if (variant) {
        const itemPrice = variant.price ? Number(variant.price) : p.price
        const discountedPrice = effectiveDiscountPct > 0 
          ? Math.round(itemPrice * (1 - effectiveDiscountPct / 100))
          : itemPrice

        addItem({
          id: variant.id,
          productId: p.id,
          productSlug: p.slug,
          variantId: variant.id,
          name: p.name,
          price: discountedPrice,
          size: variant.size || "Standard",
          color: variant.color || "Default",
          image: p.images[0]?.url ?? "",
          quantity: 1,
        })
        addedCount++
      }
    })

    setLoading(false)
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} ${addedCount === 1 ? 'item' : 'items'} to your bag!`)
      openCartDrawer()
    }
  }

  return (
    <div className="mt-16 bg-gradient-to-br from-berber-surface to-berber-muted/40 border border-berber-border/80 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
      {/* Subtle Berber Gold accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-berber-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-berber-gold/10 border border-berber-gold/30 flex items-center justify-center text-berber-gold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-heading font-bold text-berber-black tracking-tight">
              Frequently Bought Together
            </h2>
            <p className="text-xs text-berber-text-muted">
              Combine and style the perfect look with curated pairings
            </p>
          </div>
        </div>

        {effectiveDiscountPct > 0 && selectedCount >= 2 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-berber-gold text-berber-black text-xs font-bold shadow-sm uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Bundle & Save {effectiveDiscountPct}%
          </div>
        )}
      </div>

      {/* Visual Product Thumbnails Chain */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-8">
        {allProducts.map((p, i) => {
          const isSelected = !!selectedIds[p.id]
          const isPrimary = p.id === primary.id

          return (
            <div key={p.id} className="flex items-center gap-3 md:gap-4">
              {i > 0 && (
                <div className="w-7 h-7 rounded-full bg-berber-muted border border-berber-border flex items-center justify-center text-berber-text-muted shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                onClick={() => toggleSelect(p.id)}
                className={`relative group cursor-pointer transition-all duration-200 rounded-xl p-1.5 border ${
                  isSelected
                    ? "border-berber-gold/80 bg-berber-surface shadow-sm ring-2 ring-berber-gold/20"
                    : "border-berber-border bg-berber-muted/50 opacity-60 hover:opacity-90"
                }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-berber-gold text-berber-black shadow-sm"
                      : "bg-black/40 border border-white/60 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                {/* Thumbnail */}
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-berber-muted relative">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.name}
                      fill
                      sizes="112px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-berber-muted flex items-center justify-center text-xs text-berber-text-muted">
                      No image
                    </div>
                  )}
                  {isPrimary && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-[9px] font-bold text-white uppercase rounded tracking-wider">
                      This item
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Item List with Variant Pickers */}
      <div className="divide-y divide-berber-border/60 border-t border-b border-berber-border/60 py-2 mb-6">
        {allProducts.map((p) => {
          const isSelected = !!selectedIds[p.id]
          const isPrimary = p.id === primary.id
          const currentVariantId = selectedVariants[p.id]
          const currentVariant = p.variants.find((v) => v.id === currentVariantId) || p.variants[0]
          const hasMultipleVariants = p.variants.length > 1
          const uniqueSizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean)))
          const uniqueColors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean)))

          return (
            <div key={p.id} className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${isSelected ? "opacity-100" : "opacity-40"}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`fbt-check-${p.id}`}
                  checked={isSelected}
                  onChange={() => toggleSelect(p.id)}
                  className="mt-1 h-4 w-4 rounded border-berber-border text-berber-gold focus:ring-berber-gold cursor-pointer"
                />
                <div>
                  <label htmlFor={`fbt-check-${p.id}`} className="text-sm font-medium text-berber-black cursor-pointer hover:text-berber-gold transition-colors">
                    {p.name} {isPrimary && <span className="text-xs text-berber-text-muted font-normal">(Current Product)</span>}
                  </label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-berber-black">৳{p.price.toLocaleString()}</span>
                    {effectiveDiscountPct > 0 && isSelected && (
                      <span className="text-xs text-berber-gold font-medium">
                        (৳{Math.round(p.price * (1 - effectiveDiscountPct / 100)).toLocaleString()} with bundle)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant Selector */}
              {isSelected && hasMultipleVariants && (
                <div className="flex items-center gap-2 pl-7 sm:pl-0">
                  {uniqueSizes.length > 1 && (
                    <div className="relative">
                      <select
                        value={currentVariant?.size}
                        onChange={(e) => {
                          const matching = p.variants.find(
                            (v) => v.size === e.target.value && (v.color === currentVariant?.color || true)
                          )
                          if (matching) {
                            setSelectedVariants((prev) => ({ ...prev, [p.id]: matching.id }))
                          }
                        }}
                        className="text-xs font-medium bg-berber-surface border border-berber-border rounded-lg px-2.5 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-berber-gold appearance-none cursor-pointer"
                      >
                        {uniqueSizes.map((s) => (
                          <option key={s} value={s}>
                            Size: {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-berber-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {uniqueColors.length > 1 && (
                    <div className="relative">
                      <select
                        value={currentVariant?.color}
                        onChange={(e) => {
                          const matching = p.variants.find(
                            (v) => v.color === e.target.value && (v.size === currentVariant?.size || true)
                          )
                          if (matching) {
                            setSelectedVariants((prev) => ({ ...prev, [p.id]: matching.id }))
                          }
                        }}
                        className="text-xs font-medium bg-berber-surface border border-berber-border rounded-lg px-2.5 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-berber-gold appearance-none cursor-pointer"
                      >
                        {uniqueColors.map((c) => (
                          <option key={c} value={c}>
                            Color: {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-berber-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary and CTA Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-xs uppercase tracking-wider text-berber-text-muted font-bold">Bundle Price:</span>
            <span className="text-2xl font-bold font-heading text-berber-black">
              ৳{finalTotalPrice.toLocaleString()}
            </span>
            {savingsAmount > 0 && (
              <span className="text-sm text-berber-text-muted line-through">
                ৳{originalTotalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {savingsAmount > 0 && (
            <p className="text-xs font-medium text-emerald-600 mt-0.5">
              You save ৳{savingsAmount.toLocaleString()} ({effectiveDiscountPct}% OFF)
            </p>
          )}
        </div>

        <Button
          onClick={handleAddBundle}
          disabled={loading || selectedCount === 0}
          className="bg-berber-black hover:bg-berber-gold hover:text-berber-black text-white px-7 py-5 rounded-xl font-bold transition-all duration-300 gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4" />
          {selectedCount === allProducts.length
            ? `Add All ${selectedCount} to Bag`
            : `Add Selected (${selectedCount}) to Bag`}
        </Button>
      </div>
    </div>
  )
}
