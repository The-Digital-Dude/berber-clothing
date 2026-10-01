"use client"

import Link from "next/link"
import { Search, Heart, User, Menu, X, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { useCartStore } from "@/store/useCartStore"
import { useWishlistStore } from "@/store/useWishlistStore"
import CartDrawer from "@/components/store/CartDrawer"
import SearchModal from "@/components/store/SearchModal"
import { cn } from "@/lib/utils"

type NavCategory = {
  id: string
  name: string
  slug: string
  image?: string | null
  description?: string | null
  children?: {
    id: string
    name: string
    slug: string
    image?: string | null
    description?: string | null
  }[]
}
type NavFlashSale = { name: string; discountType: string; discountValue: number; endsAt: string }

function useCountdown(endsAt: string) {
  const [label, setLabel] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setLabel(""); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      const pad = (n: number) => String(n).padStart(2, "0")
      setLabel(`${d > 0 ? `${d}d ` : ""}${pad(h)}:${pad(m)}:${pad(s)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return label
}

export default function Navbar({
  freeShippingThreshold = null,
  storeName = "Berber",
  storeTagline = "Wear Your Story",
  categories = [],
  activeFlashSale = null,
}: {
  freeShippingThreshold?: number | null
  storeName?: string
  storeTagline?: string
  categories?: NavCategory[]
  activeFlashSale?: NavFlashSale | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeHoverCategory, setActiveHoverCategory] = useState<string | null>(null)
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const navCategories = categories.slice(0, 5)
  const flashCountdown = useCountdown(activeFlashSale?.endsAt || "")
  const flashLabel = activeFlashSale
    ? activeFlashSale.discountType === "PERCENTAGE"
      ? `${activeFlashSale.discountValue}% off`
      : `৳${activeFlashSale.discountValue} off`
    : ""

  return (
    <>
      {/* Announcement Bar */}
      <div
        className={cn(
          "text-white text-center py-2 px-4 text-xs font-medium tracking-wide overflow-hidden transition-all relative z-50",
          activeFlashSale && flashCountdown
            ? "bg-gradient-to-r from-rose-900 via-rose-700 to-amber-800 shadow-xs"
            : "bg-zinc-950"
        )}
      >
        {activeFlashSale && flashCountdown ? (
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2.5 flex-wrap hover:opacity-95 transition-opacity"
          >
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
              <Zap className="w-3 h-3 fill-amber-300 text-amber-300 animate-pulse" />
              Flash Sale
            </span>
            <span className="font-bold">
              {activeFlashSale.name} — <span className="text-amber-200 font-extrabold">{flashLabel}</span>
            </span>
            <span className="font-mono font-extrabold bg-black/30 px-2.5 py-0.5 rounded-md text-[11px] border border-white/10">
              ⏳ {flashCountdown}
            </span>
            <span className="text-[11px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100">
              Shop Now →
            </span>
          </Link>
        ) : freeShippingThreshold ? (
          <p className="flex items-center justify-center gap-2">
            <span>Free delivery on all orders above <strong>৳{freeShippingThreshold}</strong></span>
            <span>🚚</span>
          </p>
        ) : (
          <p>Free returns within 7 days · Cash on Delivery nationwide · Made in Bangladesh</p>
        )}
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-berber-border bg-berber-surface/90 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 min-h-[5.5rem] flex items-center justify-between py-3">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 md:w-1/4">
            <button
              className="md:hidden p-2.5 -ml-2.5 text-berber-text hover:text-berber-gold transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.webp" alt={storeName} className="h-12 w-12 md:h-14 md:w-14 object-contain" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center justify-center gap-7 lg:gap-8 flex-1">
            <Link href="/" className="text-sm font-semibold text-berber-text/80 hover:text-berber-gold transition-colors">
              Home
            </Link>
            <Link href="/shop" className="text-sm font-semibold text-berber-text/80 hover:text-berber-gold transition-colors">
              Shop All
            </Link>

            {navCategories.map((cat) => {
              const hasSubs = cat.children && cat.children.length > 0
              return (
                <div
                  key={cat.id}
                  className="relative group py-4"
                  onMouseEnter={() => setActiveHoverCategory(cat.id)}
                  onMouseLeave={() => setActiveHoverCategory(null)}
                >
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className="text-sm font-semibold text-berber-text/80 hover:text-berber-gold transition-colors flex items-center gap-1"
                  >
                    <span>{cat.name}</span>
                    {hasSubs && (
                      <span className="text-[9px] transition-transform duration-200 group-hover:rotate-180 opacity-60">
                        ▼
                      </span>
                    )}
                  </Link>

                  {/* Luxury Megamenu Dropdown */}
                  {hasSubs && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="bg-white/95 backdrop-blur-md text-zinc-900 border border-zinc-200 shadow-2xl rounded-2xl p-5 min-w-[340px] max-w-[420px] flex gap-5">
                        {/* Subcategory Links */}
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2 px-3">
                            {cat.name} Catalog
                          </p>
                          <Link
                            href={`/shop?category=${cat.slug}`}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-900 hover:bg-zinc-100 hover:text-amber-700 transition-colors"
                          >
                            <span>All {cat.name}</span>
                            <span className="text-zinc-400 font-mono text-[11px]">→</span>
                          </Link>
                          {cat.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/shop?category=${sub.slug}`}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-amber-50/80 hover:text-amber-900 transition-colors"
                            >
                              <span>{sub.name}</span>
                              <span className="text-zinc-300 group-hover:text-amber-600 text-[10px]">↳</span>
                            </Link>
                          ))}
                        </div>

                        {/* Thumbnail Featured Card */}
                        {cat.image && (
                          <div className="w-28 shrink-0 rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-50 flex flex-col justify-end p-2 relative group/card">
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="relative z-10 text-white text-center">
                              <p className="text-[10px] font-bold line-clamp-1">{cat.name}</p>
                              <Link
                                href={`/shop?category=${cat.slug}`}
                                className="text-[9px] text-amber-200 underline font-semibold hover:text-white"
                              >
                                View all
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <Link href="/shop?sort=newest" className="text-sm font-semibold text-berber-text/80 hover:text-berber-gold transition-colors">
              New Arrivals
            </Link>
            <Link href="/shop?sale=true" className="text-sm font-bold text-berber-error hover:text-berber-error/80 transition-colors">
              Sale
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center justify-end gap-3 md:gap-5 md:w-1/4">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-berber-text hover:text-berber-gold transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5 md:w-5 md:h-5" />
            </button>

            <Link href="/wishlist" className="p-2 hidden md:block relative text-berber-text hover:text-berber-gold transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5 md:w-5 md:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-berber-error text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/account" className="p-2 hidden md:block text-berber-text hover:text-berber-gold transition-colors" aria-label="Account">
              <User className="w-5 h-5 md:w-5 md:h-5" />
            </Link>

            <CartDrawer itemCount={itemCount} freeShippingThreshold={freeShippingThreshold} />
          </div>

        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white text-zinc-900 p-6 flex flex-col gap-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <img src="/logo-icon.webp" alt={storeName} className="h-10 w-10 object-contain" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-5 text-sm font-semibold">
              <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors py-1">
                Home
              </Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors py-1">
                Shop All
              </Link>

              {navCategories.map((cat) => (
                <div key={cat.id} className="flex flex-col">
                  {cat.children && cat.children.length > 0 ? (
                    <details className="group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between cursor-pointer hover:text-berber-gold transition-colors list-none py-1">
                        <span>{cat.name}</span>
                        <span className="transition duration-200 group-open:rotate-180 text-xs text-zinc-400">▼</span>
                      </summary>
                      <div className="flex flex-col gap-2.5 mt-2 pl-3 border-l-2 border-amber-200">
                        <Link
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="text-xs font-bold text-zinc-900 hover:text-amber-700 transition-colors"
                        >
                          All {cat.name}
                        </Link>
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop?category=${sub.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="text-xs font-medium text-zinc-600 hover:text-amber-700 transition-colors"
                          >
                            ↳ {sub.name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-berber-gold transition-colors py-1"
                    >
                      {cat.name}
                    </Link>
                  )}
                </div>
              ))}

              <Link href="/shop?sort=newest" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors py-1">
                New Arrivals
              </Link>
              <Link href="/shop?sale=true" onClick={() => setMobileOpen(false)} className="text-rose-600 font-bold py-1">
                Sale 🔥
              </Link>
              
              <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3 text-xs">
                <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors flex items-center justify-between py-1 text-zinc-700">
                  <span>Wishlist</span>
                  {wishlistCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>}
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors py-1 text-zinc-700">
                  My Account
                </Link>
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors py-1 text-zinc-700">
                  Shopping Bag ({itemCount})
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
