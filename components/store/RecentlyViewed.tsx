"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface ViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  image?: string
}

const STORAGE_KEY = "berber_recently_viewed"
const MAX_ITEMS = 8

export function recordView(product: ViewedProduct) {
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: ViewedProduct[] = raw ? JSON.parse(raw) : []
      setItems(all.filter((p) => p.id !== currentProductId).slice(0, 4))
    } catch {}
  }, [currentProductId])

  if (items.length === 0) return null

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-berber-black mb-10 text-center">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {items.map((p) => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3 relative">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-berber-muted" />
              )}
            </div>
            <p className="font-medium text-sm line-clamp-1 group-hover:text-berber-gold transition-colors">{p.name}</p>
            <p className="text-sm text-muted-foreground">৳{p.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
