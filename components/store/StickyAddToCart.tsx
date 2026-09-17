"use client"

import { useEffect, useRef, useState } from "react"
import { ShoppingBag } from "lucide-react"
import Image from "next/image"

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
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [btnLabel, setBtnLabel] = useState("Add to Bag")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const mutationRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    const target = document.getElementById("add-to-bag-btn")
    if (!target) return

    // Watch visibility of the real add-to-bag button
    observerRef.current = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observerRef.current.observe(target)

    // Mirror the button's disabled state and label into the sticky bar
    const sync = () => {
      const btn = document.getElementById("add-to-bag-btn") as HTMLButtonElement | null
      if (!btn) return
      setBtnDisabled(btn.disabled)
      setBtnLabel(btn.textContent?.trim() || "Add to Bag")
    }
    sync()

    mutationRef.current = new MutationObserver(sync)
    mutationRef.current.observe(target, { attributes: true, childList: true, subtree: true, characterData: true })

    return () => {
      observerRef.current?.disconnect()
      mutationRef.current?.disconnect()
    }
  }, [])

  const handleClick = () => {
    const btn = document.getElementById("add-to-bag-btn") as HTMLButtonElement | null
    if (btn && !btn.disabled) {
      btn.click()
    } else {
      document.getElementById("variant-selector")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-berber-border shadow-2xl px-4 py-3 flex items-center gap-3 max-w-screen-xl mx-auto">
        {image && (
          <div className="relative w-11 h-13 shrink-0 overflow-hidden rounded">
            <Image src={image} alt={productName} fill className="object-cover" sizes="44px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-berber-black truncate">{productName}</p>
          <p className="text-sm font-mono font-bold text-berber-gold">৳{price.toLocaleString()}</p>
        </div>
        <button
          onClick={handleClick}
          disabled={btnDisabled}
          className="flex items-center gap-2 px-5 py-3 bg-berber-black text-white text-xs font-bold uppercase tracking-widest shrink-0 hover:bg-berber-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">{btnLabel}</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </div>
  )
}
