"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, ArrowUpRight } from "lucide-react"

export interface ViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  image?: string
}

const STORAGE_KEY = "berber_recently_viewed"
const MAX_ITEMS = 12

export function recordView(product: ViewedProduct) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const items: ViewedProduct[] = raw ? JSON.parse(raw) : []
    const filtered = items.filter((p) => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [items, setItems] = useState<ViewedProduct[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: ViewedProduct[] = raw ? JSON.parse(raw) : []
      setItems(all.filter((p) => p.id !== currentProductId).slice(0, 4))
    } catch {}
  }, [currentProductId])

  if (!mounted || items.length === 0) return null

  return (
    <section className="pt-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-berber-gold text-xs font-bold uppercase tracking-widest mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Browsing History</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-berber-black tracking-tight">
            Recently Viewed
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold uppercase tracking-wider text-berber-text-muted hover:text-berber-gold flex items-center gap-1 transition-colors"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((p) => {
          const hasDiscount = p.comparePrice && p.comparePrice > p.price
          const discountPercent = hasDiscount && p.comparePrice
            ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
            : 0

          return (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group flex flex-col bg-berber-surface border border-berber-border/80 rounded-2xl overflow-hidden hover:border-berber-gold/60 transition-all duration-300 hover:shadow-md"
            >
              {/* Image Container */}
              <div className="aspect-[3/4] relative bg-berber-muted overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-berber-muted flex items-center justify-center text-xs text-berber-text-muted">
                    No image
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-2.5 left-2.5 bg-berber-gold text-berber-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <p className="font-medium text-xs sm:text-sm text-berber-black line-clamp-1 group-hover:text-berber-gold transition-colors">
                  {p.name}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-xs sm:text-sm text-berber-black">
                    ৳{p.price.toLocaleString()}
                  </span>
                  {hasDiscount && p.comparePrice && (
                    <span className="text-[11px] sm:text-xs text-berber-text-muted line-through">
                      ৳{p.comparePrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
