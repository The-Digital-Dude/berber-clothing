"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function DynamicProductHeader({
  initialPrice,
  initialComparePrice,
  productName,
  brand,
  reviewRating,
  reviewCount,
  flashSale,
}: {
  initialPrice: number
  initialComparePrice?: number | null
  productName: string
  brand?: { name: string; slug: string } | null
  reviewRating?: number
  reviewCount?: number
  flashSale?: any
}) {
  const [currentPrice, setCurrentPrice] = useState(initialPrice)
  const [packageLabel, setPackageLabel] = useState<string>("Complete Suit")

  useEffect(() => {
    const handlePackageChange = (e: any) => {
      if (e.detail?.price) setCurrentPrice(e.detail.price)
      if (e.detail?.package) {
        if (e.detail.package === "3-piece") setPackageLabel("3-Piece Complete Suit")
        else if (e.detail.package === "2-piece") setPackageLabel("2-Piece Set")
        else setPackageLabel("1-Piece Blazer")
      }
    }
    window.addEventListener("berber_package_change", handlePackageChange)
    return () => window.removeEventListener("berber_package_change", handlePackageChange)
  }, [])

  const hasCompareDiscount = initialComparePrice && initialComparePrice > currentPrice

  return (
    <div className="mb-6">
      {brand && (
        <Link
          href={`/brands/${brand.slug}`}
          className="inline-block mb-3 text-xs font-bold uppercase tracking-widest text-berber-text-muted hover:text-berber-gold transition-colors border border-berber-border rounded-full px-3 py-1"
        >
          {brand.name}
        </Link>
      )}
      <h1 className="text-3xl lg:text-4xl font-heading font-bold text-berber-black mb-2 leading-tight">
        {productName}
      </h1>

      {reviewCount && reviewCount > 0 ? (
        <div className="flex items-center gap-2 mb-4 text-sm text-berber-text-muted">
          <span className="text-berber-gold font-bold">★ {reviewRating?.toFixed(1)}</span>
          <span>
            ({reviewCount} review{reviewCount === 1 ? "" : "s"})
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap pt-1">
        <span className="font-mono text-3xl font-bold text-berber-black transition-all duration-200">
          ৳{currentPrice.toLocaleString()}
        </span>
        {hasCompareDiscount && (
          <span className="font-mono text-lg text-berber-text-muted line-through">
            ৳{initialComparePrice.toLocaleString()}
          </span>
        )}
        <span className="bg-berber-gold/15 border border-berber-gold/30 text-berber-gold px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
          {packageLabel}
        </span>
      </div>
    </div>
  )
}
