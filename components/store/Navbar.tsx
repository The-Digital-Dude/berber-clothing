"use client"

import Link from "next/link"
import { Search, Heart, User, Menu, X, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { useCartStore } from "@/store/useCartStore"
import { useWishlistStore } from "@/store/useWishlistStore"
import CartDrawer from "@/components/store/CartDrawer"
import SearchModal from "@/components/store/SearchModal"

type NavCategory = { id: string; name: string; slug: string; children?: { id: string; name: string; slug: string }[] }
type NavFlashSale = { name: string; discountType: string; discountValue: number; endsAt: string }

function useCountdown(endsAt: string) {
  const [label, setLabel] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setLabel(""); return }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
      const pad = (n: number) => String(n).padStart(2, "0")
      setLabel(`${pad(h)}:${pad(m)}:${pad(s)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return label
}

export default function Navbar({
  freeShippingThreshold = 5000,
  storeName = "Berber",
  storeTagline = "Wear Your Story",
  categories = [],
  activeFlashSale = null,
}: {
  freeShippingThreshold?: number
  storeName?: string
  storeTagline?: string
  categories?: NavCategory[]
  activeFlashSale?: NavFlashSale | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const navCategories = categories.slice(0, 4)
  const flashCountdown = useCountdown(activeFlashSale?.endsAt || "")
  const flashLabel = activeFlashSale
    ? activeFlashSale.discountType === "PERCENTAGE"
      ? `${activeFlashSale.discountValue}% off`
      : `৳${activeFlashSale.discountValue} off`
    : ""

  return (
    <>
      {/* Announcement Bar */}
      <div className={`text-berber-surface text-center py-2 text-xs md:text-sm font-medium tracking-wide overflow-hidden transition-colors ${activeFlashSale && flashCountdown ? "bg-berber-error" : "bg-berber-black"}`}>
        {activeFlashSale && flashCountdown ? (
          <p className="whitespace-nowrap flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 inline" />
            <span>{activeFlashSale.name} — {flashLabel} sitewide!</span>
            <span className="font-mono">Ends in {flashCountdown}</span>
            <Zap className="w-3 h-3 inline" />
          </p>
        ) : (
          <p className="whitespace-nowrap">Free delivery on orders above ৳{freeShippingThreshold} 🚚</p>
        )}
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-berber-border bg-berber-surface/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 min-h-[6rem] flex items-center justify-between py-4">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 md:w-1/3">
            <button
              className="md:hidden p-2 -ml-2 text-berber-text"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex flex-col">
              <img src="/logo.png" alt={storeName} className="h-16 md:h-20 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center justify-center gap-8 w-1/3">
            <Link href="/" className="text-sm font-medium hover:text-berber-gold transition-colors">Home</Link>
            <Link href="/shop" className="text-sm font-medium hover:text-berber-gold transition-colors">Shop</Link>
            {navCategories.map((cat) => (
              <div key={cat.id} className="relative group">
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="text-sm font-medium hover:text-berber-gold transition-colors flex items-center gap-1"
                >
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <span className="text-[10px] transition-transform group-hover:rotate-180">▼</span>
                  )}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <div className="absolute left-0 top-full pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                    <div className="bg-berber-surface text-berber-text border border-berber-border shadow-lg rounded-xl py-2 min-w-[160px] flex flex-col">
                      {cat.children.map((sub) => (
                        <Link key={sub.id} href={`/shop?category=${sub.slug}`} className="px-4 py-2 text-sm hover:bg-berber-muted hover:text-berber-gold transition-colors">
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link href="/shop?sort=newest" className="text-sm font-medium hover:text-berber-gold transition-colors">New Arrivals</Link>
            <Link href="/shop?sale=true" className="text-sm font-medium text-berber-error hover:text-berber-error/80 transition-colors">Sale</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-berber-text hover:text-berber-gold transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <Link href="/wishlist" className="p-2 hidden md:block relative text-berber-text hover:text-berber-gold transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5 md:w-6 md:h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-berber-error text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/login" className="p-2 hidden md:block text-berber-text hover:text-berber-gold transition-colors" aria-label="Account">
              <User className="w-5 h-5 md:w-6 md:h-6" />
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
            className="absolute left-0 top-0 bottom-0 w-72 bg-berber-surface p-8 flex flex-col gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <img src="/logo.png" alt={storeName} className="h-14 w-auto object-contain" />
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-lg font-medium">
              <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors">Home</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors">Shop</Link>
              {navCategories.map((cat) => (
                <div key={cat.id} className="flex flex-col">
                  {cat.children && cat.children.length > 0 ? (
                    <details className="group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between cursor-pointer hover:text-berber-gold transition-colors list-none text-lg font-medium">
                        {cat.name}
                        <span className="transition group-open:rotate-180 text-sm">▼</span>
                      </summary>
                      <div className="flex flex-col gap-4 mt-4 pl-4 border-l border-berber-border">
                        <Link href={`/shop?category=${cat.slug}`} onClick={() => setMobileOpen(false)} className="text-base hover:text-berber-gold transition-colors">All {cat.name}</Link>
                        {cat.children.map((sub) => (
                          <Link key={sub.id} href={`/shop?category=${sub.slug}`} onClick={() => setMobileOpen(false)} className="text-base hover:text-berber-gold transition-colors">
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-berber-gold transition-colors text-lg font-medium"
                    >
                      {cat.name}
                    </Link>
                  )}
                </div>
              ))}
              <Link href="/shop?sort=newest" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors">New Arrivals</Link>
              <Link href="/shop?sale=true" onClick={() => setMobileOpen(false)} className="text-berber-error">Sale</Link>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors flex items-center gap-2">
                Wishlist {wishlistCount > 0 && <span className="bg-berber-error text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{wishlistCount}</span>}
              </Link>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors">My Account</Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="hover:text-berber-gold transition-colors">Cart ({itemCount})</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
