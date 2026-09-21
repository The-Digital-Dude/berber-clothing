"use client"

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCartStore } from "@/store/useCartStore"
import { Home, ShoppingBag, Search, ShoppingCart, User } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false })

export default function BottomNav() {
  const pathname = usePathname()
  const items = useCartStore((s) => s.items)
  const cartCount = items.reduce((n, i) => n + i.quantity, 0)
  const [searchOpen, setSearchOpen] = useState(false)

  const tabs = [
    { href: "/",        icon: Home,         label: "Home",   exact: true },
    { href: "/shop",    icon: ShoppingBag,  label: "Shop"                },
    { href: "/cart",    icon: ShoppingCart, label: "Cart"                },
    { href: "/account", icon: User,         label: "Account"             },
  ]

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-berber-surface border-t border-berber-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16">
          {/* Search — opens modal, not a link */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] font-medium tracking-wide transition-colors text-gray-400 hover:text-berber-gold"
            aria-label="Search"
          >
            <Search className="w-5 h-5" strokeWidth={1.75} />
            <span>Search</span>
          </button>

          {tabs.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            const isCart = href === "/cart"
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] font-medium tracking-wide transition-colors ${
                  isActive ? "text-berber-gold" : "text-gray-400"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-berber-gold text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}
