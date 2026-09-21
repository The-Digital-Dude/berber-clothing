"use client"
import Link from "next/link"
import { Heart, ShoppingBag, Columns2 } from "lucide-react"
import { useWishlistStore } from "@/store/useWishlistStore"
import { useCompareStore } from "@/store/useCompareStore"
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
  const wishlisted = isWishlisted(product.id)
  const comparing = inCompare(product.id)

  const images = product.images || []
  const thumbnail = images[0]?.url || "/placeholder.jpg"
  const hoverImage = images[1]?.url || null

  const isNew = (Date.now() - new Date(product.createdAt).getTime()) < 1000 * 60 * 60 * 24 * 7
  const hasSale = !!product.comparePrice || !!flashSalePrice
  const hasFlashSale = !!flashSalePrice
  const displayPrice = flashSalePrice ?? Number(product.price)
  const isLowStock = product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) < 5
  const hasSet = !!product.bundleId
  const discountPercent = product.comparePrice
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : flashSalePrice
    ? Math.round(((Number(product.price) - flashSalePrice) / Number(product.price)) * 100)
    : 0
  const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size) || ["S", "M", "L"]))

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

  return (
    <FadeIn className="group relative flex flex-col gap-3">
      {/* Image Box */}
      <div className="relative aspect-[3/4] bg-berber-muted rounded-xl overflow-hidden cursor-pointer">
        <Link href={`/shop/${product.slug}`} className="absolute inset-0">
          <img
            src={thumbnail}
            alt={product.name}
            className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-500 ${hoverImage ? "group-hover:opacity-0" : ""}`}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              className="absolute inset-0 object-cover w-full h-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
          <Link href={`/shop/${product.slug}`}>
            <button className="w-full bg-white/90 backdrop-blur-sm text-berber-black font-medium py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-berber-gold hover:text-white transition-colors text-sm shadow-sm">
              <ShoppingBag className="w-4 h-4" /> Quick Add
            </button>
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-widest text-berber-text-muted">{product.category?.name}</p>
        <Link href={`/shop/${product.slug}`} className="font-medium text-sm line-clamp-1 group-hover:text-berber-gold transition-colors">
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
          {(sizes as string[]).map((size, i) => (
            <span key={i} className="text-[10px] border border-berber-border text-berber-text-muted px-1.5 py-0.5 rounded-full">
              {size}
            </span>
          ))}
        </div>
      </div>
    </FadeIn>
  )
}
