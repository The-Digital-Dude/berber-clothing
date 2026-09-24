"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useCartStore } from "@/store/useCartStore"
import { useCompareStore } from "@/store/useCompareStore"
import NotifyMeForm from "@/components/store/NotifyMeForm"
import SizeGuideModal from "@/components/store/SizeGuideModal"
import { Columns2, Truck, Clock } from "lucide-react"
import Link from "next/link"

export default function VariantSelector({
  product,
  flashSale,
  attr1Label = "Size",
  attr2Label = "Color",
  categoryId,
  sizeChartImage,
}: {
  product: any
  flashSale?: any
  attr1Label?: string
  attr2Label?: string
  categoryId?: string
  sizeChartImage?: string | null
}) {
  const variants = product.variants || []
  const addItem = useCartStore((s) => s.addItem)
  const { toggleItem: toggleCompare, hasItem: inCompare } = useCompareStore()
  const comparing = inCompare(product.id)

  const sizes = Array.from(new Set(variants.map((v: any) => v.size))) as string[]
  const colors = Array.from(new Set(variants.map((v: any) => v.color))) as string[]

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] || null)

  const activeVariant = useMemo(() => {
    return variants.find((v: any) => v.size === selectedSize && v.color === selectedColor)
  }, [selectedSize, selectedColor, variants])

  const stock = activeVariant?.stock || 0
  const isOutOfStock = stock === 0
  const isLowStock = stock > 0 && stock <= 5
  const variantEffectivePrice = Number(activeVariant?.price ?? product.price) || 0
  const variantComparePriceRaw = activeVariant?.comparePrice ? Number(activeVariant.comparePrice) : null
  const variantComparePrice = variantComparePriceRaw && variantComparePriceRaw > variantEffectivePrice ? variantComparePriceRaw : null

  // Delivery estimate: order before 3pm → ships today, else tomorrow
  const now = new Date()
  const cutoffHour = 15
  const shipsToday = now.getHours() < cutoffHour
  const dispatchDay = shipsToday ? "today" : "tomorrow"
  const arrivalDays = "3–5 business days"

  const addToCart = () => {
    if (!activeVariant) return toast.error("Please select a size and color.")
    if (isOutOfStock) return toast.error("This item is currently out of stock.")

    const basePrice = activeVariant.price ?? product.price
    const finalPrice = flashSale ? (
      flashSale.discountType === "PERCENTAGE" 
        ? Math.max(0, basePrice - Math.round((basePrice * flashSale.discountValue) / 100))
        : Math.max(0, basePrice - flashSale.discountValue)
    ) : basePrice;

    const image = product.images?.[0]?.url || ""

    addItem({
      id: activeVariant.id,
      variantId: activeVariant.id,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: Number(finalPrice),
      size: selectedSize!,
      color: selectedColor!,
      image,
      quantity: 1,
    })

    toast.success(`Added to bag!`, {
      description: `${product.name} — ${selectedSize} / ${selectedColor}`,
    })
  }

  return (
    <div id="variant-selector" className="space-y-8">
      {/* Colors / Attribute 2 */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black">{attr2Label}</h3>
            <span className="text-xs text-berber-text-muted">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {colors.map(color => {
              const hasStock = variants.some((v: any) => v.color === color && v.stock > 0)
              const variant = variants.find((v: any) => v.color === color)
              const isActive = selectedColor === color

              const hexMap: Record<string, string> = {
                'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#1e3a8a', 'Olive': '#4d7c0f', 'Beige': '#f5f5dc'
              }
              const colorHex = variant?.colorHex || hexMap[color] || '#cccccc'

              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  disabled={!hasStock}
                  title={color}
                  className={`relative w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center
                    ${isActive ? 'scale-110 shadow-sm' : 'border-transparent hover:scale-110 hover:shadow-sm'}
                    ${!hasStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: colorHex, border: isActive ? '2px solid #C9A84C' : colorHex === '#FFFFFF' ? '1px solid #E8E8E4' : 'none' }}
                >
                  {!hasStock && (
                    <div className="absolute inset-0 w-full h-full border-t border-berber-error transform rotate-45 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sizes / Attribute 1 */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black">{attr1Label}</h3>
            {categoryId && <SizeGuideModal categoryId={categoryId} sizeChartImage={sizeChartImage} />}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {sizes.map(size => {
              const specificVariant = variants.find((v: any) => v.size === size && v.color === selectedColor)
              const hasStock = specificVariant && specificVariant.stock > 0
              const isActive = selectedSize === size

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={!hasStock}
                  className={`relative flex flex-col items-center justify-center border transition-all duration-300 h-14
                    ${isActive ? 'border-berber-black bg-berber-black text-white' : 'border-berber-border bg-white text-berber-black hover:border-berber-black'}
                    ${!hasStock ? 'opacity-40 cursor-not-allowed bg-berber-muted' : ''}`}
                >
                  <span className="text-xs font-medium">{size}</span>
                  {hasStock && specificVariant.stock <= 5 && (
                    <span className={`text-[10px] mt-0.5 ${isActive ? 'text-berber-muted' : 'text-berber-error'}`}>
                      {specificVariant.stock} left
                    </span>
                  )}
                  {hasStock && specificVariant.stock > 5 && isActive && (
                    <span className="text-[10px] mt-0.5 text-berber-muted">
                      In stock
                    </span>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 w-full h-full border-t border-berber-border transform rotate-12 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action */}
      {variantComparePrice && activeVariant && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground line-through">৳{variantComparePrice.toLocaleString()}</span>
          <span className="text-xs bg-berber-gold/10 text-berber-gold font-bold px-2 py-0.5 rounded">
            {Math.round((1 - Number(activeVariant.price ?? product.price) / variantComparePrice) * 100)}% OFF
          </span>
        </div>
      )}

      <div className="pt-4 space-y-3">
        {/* Low stock warning */}
        {isLowStock && (
          <div className="flex items-center gap-2 px-3 py-2 bg-berber-error/5 border border-berber-error/20 rounded">
            <span className="w-2 h-2 rounded-full bg-berber-error shrink-0 animate-pulse" />
            <p className="text-xs font-medium text-berber-error">
              Only {stock} left in stock — order soon!
            </p>
          </div>
        )}

        {/* Add to bag */}
        {!isOutOfStock ? (
          <button
            id="add-to-bag-btn"
            onClick={addToCart}
            disabled={!activeVariant}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-berber-black text-white hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!activeVariant ? "Select a size" : "Add to Bag"}
          </button>
        ) : (
          <NotifyMeForm variantId={activeVariant?.id || ""} />
        )}

        {/* Delivery estimate */}
        {!isOutOfStock && (
          <div className="flex items-center gap-4 pt-1 pb-1">
            <div className="flex items-center gap-2 text-xs text-berber-text-muted">
              <Truck className="w-3.5 h-3.5 text-berber-gold shrink-0" />
              <span>
                Order {shipsToday ? (
                  <span className="font-medium text-berber-text">now</span>
                ) : (
                  <span>by <span className="font-medium text-berber-text">3 PM</span> tomorrow</span>
                )} — ships {dispatchDay}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-berber-text-muted">
              <Clock className="w-3.5 h-3.5 text-berber-gold shrink-0" />
              <span>Arrives in <span className="font-medium text-berber-text">{arrivalDays}</span></span>
            </div>
          </div>
        )}

        {/* Compare */}
        <button
          onClick={() => {
            toggleCompare({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), image: product.images?.[0]?.url })
            toast.success(comparing ? "Removed from compare" : "Added to compare", { action: { label: "View compare", onClick: () => window.location.href = "/compare" } })
          }}
          className={`w-full py-3 text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 ${
            comparing
              ? "border-berber-gold text-berber-gold bg-berber-gold/5"
              : "border-berber-border text-berber-text-muted hover:border-berber-black hover:text-berber-black"
          }`}
        >
          <Columns2 className="w-4 h-4" />
          {comparing ? "In Comparison" : "Compare"}
        </button>
      </div>
    </div>
  )
}
