"use client"

import { useEffect, useRef, useState } from "react"
import { ShoppingBag } from "lucide-react"

export default function StickyAddToCart({
  productName,
  price,
  image,
}: {
  productName: string
  price: number
  image?: string
}) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const target = document.getElementById("add-to-bag-btn")
    if (!target) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observerRef.current.observe(target)

    return () => observerRef.current?.disconnect()
  }, [])

  const handleClick = () => {
    const btn = document.getElementById("add-to-bag-btn") as HTMLButtonElement | null
    if (btn && !btn.disabled) {
      btn.click()
    } else {
      // Scroll to the selector so user can pick a variant
      document.getElementById("variant-selector")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-berber-border shadow-xl px-4 py-3 flex items-center gap-3">
        {image && (
          <img src={image} alt={productName} className="w-12 h-14 object-cover rounded shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-berber-black truncate">{productName}</p>
          <p className="text-sm font-mono font-bold text-berber-gold">৳{price.toLocaleString()}</p>
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-5 py-3 bg-berber-black text-white text-xs font-bold uppercase tracking-widest shrink-0 hover:bg-berber-gold transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Bag
        </button>
      </div>
    </div>
  )
}
