"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useCartStore } from "@/store/useCartStore"
import NotifyMeForm from "@/components/store/NotifyMeForm"
import SizeGuideModal from "@/components/store/SizeGuideModal"

export default function VariantSelector({
  product,
  flashSale,
  attr1Label = "Size",
  attr2Label = "Color",
  categoryId,
}: {
  product: any
  flashSale?: any
  attr1Label?: string
  attr2Label?: string
  categoryId?: string
}) {
  const variants = product.variants || []
  const addItem = useCartStore((s) => s.addItem)

  const sizes = Array.from(new Set(variants.map((v: any) => v.size))) as string[]
  const colors = Array.from(new Set(variants.map((v: any) => v.color))) as string[]

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] || null)

  const activeVariant = useMemo(() => {
    return variants.find((v: any) => v.size === selectedSize && v.color === selectedColor)
  }, [selectedSize, selectedColor, variants])

  const stock = activeVariant?.stock || 0
  const isOutOfStock = stock === 0

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
    <div className="space-y-8">
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
            {categoryId && <SizeGuideModal categoryId={categoryId} />}
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
      <div className="pt-4 space-y-4">
        {!isOutOfStock ? (
          <button
            onClick={addToCart}
            disabled={!activeVariant}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-berber-black text-white hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20"
          >
            Add to Bag
          </button>
        ) : (
          <NotifyMeForm variantId={activeVariant?.id || ""} />
        )}

        {stock > 0 && stock <= 5 && (
          <p className="text-xs font-medium text-berber-error flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-berber-error block" />
            Only {stock} left in stock — order soon!
          </p>
        )}
      </div>
    </div>
  )
}
