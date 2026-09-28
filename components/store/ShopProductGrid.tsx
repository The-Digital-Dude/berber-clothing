"use client"

import { useEffect, useState, useCallback, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import ProductCard from "./ProductCard"

type Product = {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  images: { url: string }[]
  category: { name: string } | null
  description: string | null
  flashSalePrice: number | null
  flashSaleLabel: string | null
}

export default function ShopProductGrid() {
  const router = useRouter()
  const sp = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const view = sp.get("view") || "grid"
  const take = parseInt(sp.get("take") || "12", 10)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/store/products?${sp.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setTotal(data.total)
        setHasMore(data.hasMore)
      }
    } finally {
      setLoading(false)
    }
  }, [sp.toString()]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleLoadMore = () => {
    const p = new URLSearchParams(sp.toString())
    p.set("take", String(take + 12))
    startTransition(() => {
      router.push(`/shop?${p.toString()}`, { scroll: false })
    })
  }

  const isLoadingActive = loading || isPending

  if (isLoadingActive && products.length === 0) {
    return (
      <div className="flex-1">
        <div className={view === "list" ? "flex flex-col gap-4" : "grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12"}>
          {Array.from({ length: take }).map((_, i) => (
            <div key={i} className={`bg-berber-muted rounded-2xl animate-pulse ${view === "list" ? "h-32" : "aspect-[3/4]"}`} />
          ))}
        </div>
      </div>
    )
  }

  if (!isLoadingActive && products.length === 0) {
    return (
      <div className="flex-1">
        <div className="py-20 text-center space-y-4 bg-berber-muted rounded-2xl border border-berber-border">
          <p className="text-berber-text-muted">No products found matching your criteria.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2 bg-white border border-berber-border rounded-full hover:border-berber-gold text-sm font-medium transition-colors"
          >
            Clear Filters
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      {/* Subtle loading shimmer overlay if re-fetching existing list */}
      {isLoadingActive && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center p-2 bg-white/70 backdrop-blur-[1px] rounded-xl shadow-xs border border-berber-border/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-berber-gold">
            <Loader2 className="w-4 h-4 animate-spin text-berber-gold" />
            <span>Loading products…</span>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className={`flex flex-col gap-4 transition-opacity ${isLoadingActive ? "opacity-60" : "opacity-100"}`}>
          {products.map((product) => {
            const displayPrice = product.flashSalePrice ?? Number(product.price)
            const img = product.images?.[0]?.url || "/placeholder.jpg"
            return (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="flex gap-5 border border-berber-border rounded-2xl p-4 hover:border-berber-gold transition-colors group bg-white"
              >
                <div className="relative w-28 h-36 shrink-0 rounded-xl overflow-hidden bg-berber-muted">
                  <Image src={img} alt={product.name} fill sizes="112px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col justify-between py-1 flex-1">
                  <div>
                    <p className="text-xs text-berber-text-muted uppercase tracking-widest mb-1">{product.category?.name}</p>
                    <h3 className="font-heading font-bold text-berber-black text-lg leading-tight line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-berber-text-muted mt-2 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="font-mono font-bold text-lg text-berber-gold">৳{displayPrice.toLocaleString()}</span>
                    {product.comparePrice && product.comparePrice > displayPrice && (
                      <span className="font-mono text-sm text-berber-text-muted line-through">
                        ৳{Number(product.comparePrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className={`grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12 transition-opacity ${isLoadingActive ? "opacity-60" : "opacity-100"}`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product as any}
              flashSalePrice={product.flashSalePrice ?? undefined}
              flashSaleLabel={product.flashSaleLabel ?? undefined}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-16 text-center border-t border-berber-border pt-8">
          <p className="text-xs text-berber-text-muted mb-4">
            Showing {products.length} of {total}
          </p>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingActive}
            className="inline-flex items-center gap-2 px-12 py-3 bg-berber-surface border border-berber-border text-berber-black font-medium hover:border-berber-black rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoadingActive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-berber-gold" />
                <span>Loading more…</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
