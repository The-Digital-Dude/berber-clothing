"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
  const sp = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const view = sp.get("view") || "grid"

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

  const take = parseInt(sp.get("take") || "12")

  function loadMoreUrl() {
    const p = new URLSearchParams(sp.toString())
    p.set("take", String(take + 12))
    return `/shop?${p.toString()}`
  }

  if (loading) {
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

  if (products.length === 0) {
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
    <div className="flex-1">
      {view === "list" ? (
        <div className="flex flex-col gap-4">
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
                    <span className="font-bold text-berber-black">৳{displayPrice.toLocaleString()}</span>
                    {product.comparePrice && Number(product.comparePrice) > displayPrice && (
                      <span className="text-sm text-berber-text-muted line-through">৳{Number(product.comparePrice).toLocaleString()}</span>
                    )}
                    {product.flashSaleLabel && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                        {product.flashSaleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
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
          <Link
            href={loadMoreUrl()}
            scroll={false}
            className="inline-block px-12 py-3 bg-berber-surface border border-berber-border text-berber-black font-medium hover:border-berber-black rounded-full transition-colors"
          >
            Load More
          </Link>
        </div>
      )}
    </div>
  )
}
