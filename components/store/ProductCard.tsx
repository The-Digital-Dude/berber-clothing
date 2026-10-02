"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Columns2 } from "lucide-react"
import { useWishlistStore } from "@/store/useWishlistStore"
import { useCompareStore } from "@/store/useCompareStore"
import { useCartStore } from "@/store/useCartStore"
import { useCartUIStore } from "@/store/useCartUIStore"
import { toast } from "sonner"
import FadeIn from "@/components/ui/FadeIn"

export default function ProductCard({
  product,
  flashSalePrice,
  flashSaleLabel,
}: {
  product: any
  flashSalePrice?: number
  flashSaleLabel?: string
}) {
  const { toggleItem, isWishlisted } = useWishlistStore()
  const { toggleItem: toggleCompare, hasItem: inCompare } = useCompareStore()
  const addItem = useCartStore((s) => s.addItem)
  const openCartDrawer = useCartUIStore((s) => s.open)
  const wishlisted = isWishlisted(product.id)
  const comparing = inCompare(product.id)

  const images = product.images || []
  // thumbnailUrl is a smaller (~720px) variant generated specifically for
  // grid cards -- falls back to the full-size url for images uploaded before
  // this existed.
  const thumbnail = images[0]?.thumbnailUrl || images[0]?.url || "/placeholder.jpg"
  const hoverImage = images[1]?.thumbnailUrl || images[1]?.url || null

  const isNew = (Date.now() - new Date(product.createdAt).getTime()) < 1000 * 60 * 60 * 24 * 7
  const comparePriceNum = Number(product.comparePrice) || 0
  const priceNum = Number(product.price) || 0
  const hasCompareDiscount = comparePriceNum > priceNum
  const hasSale = hasCompareDiscount || !!flashSalePrice
  const hasFlashSale = !!flashSalePrice
  const displayPrice = flashSalePrice ?? priceNum
  const isLowStock = product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) < 5
  const hasSet = !!product.bundleId
  const discountPercent = hasCompareDiscount
    ? Math.round(((comparePriceNum - priceNum) / comparePriceNum) * 100)
    : (flashSalePrice && priceNum > 0)
    ? Math.round(((priceNum - flashSalePrice) / priceNum) * 100)
    : 0
  const sizes = Array.from(new Set((product.variants || []).map((v: any) => v.size))) as string[]
  const sizeInStock = (size: string) => (product.variants || []).some((v: any) => v.size === size && v.stock > 0)

  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  // Prefer a variant matching the size the shopper picked; otherwise fall
  // back to any in-stock variant so Quick Add still works without a choice.
  const quickAddVariant = selectedSize
    ? (product.variants || []).find((v: any) => v.size === selectedSize && v.stock > 0) || null
    : product.variants?.find((v: any) => v.stock > 0) || null

  const handleSelectSize = (e: React.MouseEvent, size: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!sizeInStock(size)) return
    setSelectedSize((prev) => (prev === size ? null : size))
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!quickAddVariant) return
    addItem({
      id: quickAddVariant.id,
      variantId: quickAddVariant.id,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: Number(quickAddVariant.price ?? product.price),
      size: quickAddVariant.size,
      color: quickAddVariant.color,
      image: thumbnail,
      quantity: 1,
    })
    toast.success("Added to bag!", {
      description: `${product.name} — ${quickAddVariant.size} / ${quickAddVariant.color}`,
    })
    openCartDrawer()
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      image: thumbnail,
      category: product.category?.name,
    })
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist")
  }

  const isTrouserSlug = product.slug?.includes("trouser") || product.slug?.includes("trousers")
  const isWaistcoatSlug = product.slug?.includes("waistcoat") || product.slug?.includes("waistcoats")
  const productHref = isTrouserSlug
    ? `/shop/${product.slug.replace("trousers", "blazer").replace("trouser", "blazer")}?package=3-piece`
    : isWaistcoatSlug
    ? `/shop/${product.slug.replace("waistcoats", "blazer").replace("waistcoat", "blazer")}?package=2-piece`
    : `/shop/${product.slug}`

  return (
    <FadeIn className="group relative flex flex-col gap-3">
      {/* Image Box */}
      <div className="relative aspect-[3/4] bg-berber-muted rounded-xl overflow-hidden cursor-pointer">
        <Link href={productHref} className="absolute inset-0">
          <Image
            src={thumbnail}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition-opacity duration-500 ${hoverImage ? "group-hover:opacity-0" : ""}`}
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {isNew && <span className="bg-berber-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">New</span>}
          {hasFlashSale && <span className="bg-berber-error text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">⚡ {flashSaleLabel}</span>}
          {!hasFlashSale && hasSale && <span className="bg-berber-gold text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Sale</span>}
          {isLowStock && <span className="bg-berber-error text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Low Stock</span>}
          {hasSet && <span className="bg-berber-gold/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Set</span>}
        </div>

        {/* Wishlist & Compare */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ${
              wishlisted
                ? "bg-berber-error text-white opacity-100 translate-y-0"
                : "bg-white/50 text-berber-text-muted hover:bg-berber-error hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleCompare({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, image: thumbnail, category: product.category?.name, brand: product.brand?.name })
              toast.success(comparing ? "Removed from compare" : "Added to compare", { action: { label: "View", onClick: () => window.location.href = "/compare" } })
            }}
            aria-label={comparing ? "Remove from compare" : "Add to compare"}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 delay-75 ${
              comparing
                ? "bg-berber-gold text-white opacity-100 translate-y-0"
                : "bg-white/50 text-berber-text-muted hover:bg-berber-gold hover:text-white"
            }`}
            title="Compare"
          >
            <Columns2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add (Desktop) */}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          {quickAddVariant ? (
            <button
              onClick={handleQuickAdd}
              className="w-full bg-white/90 backdrop-blur-sm text-berber-black font-medium py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-berber-gold hover:text-white transition-colors text-sm shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" /> {selectedSize ? `Add Size ${selectedSize}` : "Quick Add"}
            </button>
          ) : selectedSize ? (
            <button
              disabled
              className="w-full bg-white/60 backdrop-blur-sm text-berber-text-muted font-medium py-2.5 rounded-full flex items-center justify-center gap-2 text-sm shadow-sm cursor-not-allowed"
            >
              Size {selectedSize} out of stock
            </button>
          ) : (
            <Link href={productHref}>
              <button className="w-full bg-white/90 backdrop-blur-sm text-berber-black font-medium py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-berber-gold hover:text-white transition-colors text-sm shadow-sm">
                <ShoppingBag className="w-4 h-4" /> Notify Me
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-widest text-berber-text-muted">{product.category?.name}</p>
        <Link href={productHref} className="font-medium text-sm line-clamp-1 group-hover:text-berber-gold transition-colors">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`font-mono font-medium text-sm ${hasFlashSale ? "text-berber-error" : ""}`}>
            ৳{displayPrice.toLocaleString()}
          </span>
          {(hasSale || hasFlashSale) && (
            <>
              <span className="font-mono text-xs text-berber-text-muted line-through">
                ৳{Number(product.comparePrice || product.price).toLocaleString()}
              </span>
              <span className="text-[10px] text-berber-success font-bold bg-berber-success/10 px-1.5 py-0.5 rounded">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {sizes.map((size, i) => {
            const inStock = sizeInStock(size)
            const active = selectedSize === size
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => handleSelectSize(e, size)}
                disabled={!inStock}
                title={inStock ? `Select size ${size}` : `${size} — out of stock`}
                className={`text-[10px] border px-1.5 py-0.5 rounded-full transition-colors ${
                  active
                    ? "bg-berber-black text-white border-berber-black"
                    : inStock
                    ? "border-berber-border text-berber-text-muted hover:border-berber-black hover:text-berber-black"
                    : "border-berber-border/50 text-berber-text-muted/40 line-through cursor-not-allowed"
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>
    </FadeIn>
  )
}
