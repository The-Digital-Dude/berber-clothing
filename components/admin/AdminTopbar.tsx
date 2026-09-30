"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search, ShoppingCart, Bell, Menu, ChevronDown, LogOut, Settings,
  ExternalLink, Loader2, Sparkles, PlusCircle, Package, Users,
  Layers, ArrowRight, CornerDownLeft, Clock, History, X,
  ShieldCheck, HelpCircle, Mail, Tag, Zap, CreditCard, RotateCcw
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar, primaryItems, groups } from "@/components/admin/Sidebar"
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs"
import AdminNotificationBell from "@/components/admin/AdminNotificationBell"
import { cn } from "@/lib/utils"

type SearchResult = {
  type: "order" | "product" | "customer" | "page" | "action"
  id: string
  label: string
  sub: string
  href: string
  icon?: any
}

const quickActions = [
  { id: "act-new-order", label: "Create Manual Order", sub: "Start a new customer draft/order", href: "/admin/orders/new", icon: ShoppingCart, type: "action" as const },
  { id: "act-new-product", label: "Add New Product", sub: "Upload images, variants & pricing", href: "/admin/products/new", icon: PlusCircle, type: "action" as const },
  { id: "act-new-coupon", label: "Create Coupon Code", sub: "Set discounts & minimum thresholds", href: "/admin/coupons", icon: Tag, type: "action" as const },
  { id: "act-stock-alerts", label: "Check Stock Alerts", sub: "Review low stock & replenishment needs", href: "/admin/stock-alerts", icon: Bell, type: "action" as const },
  { id: "act-campaigns", label: "Draft Email Campaign", sub: "Engage newsletter subscribers", href: "/admin/campaigns", icon: Mail, type: "action" as const },
  { id: "act-view-store", label: "Open Live Storefront", sub: "Visit customer view in new tab", href: "/", icon: ExternalLink, type: "action" as const },
]

const allNavigationItems = [
  ...primaryItems.map((i) => ({ id: `nav-${i.href}`, label: i.label, sub: `Go to ${i.label}`, href: i.href, icon: i.icon, type: "page" as const })),
  ...groups.flatMap((g) =>
    g.items.map((i) => ({
      id: `nav-${i.href}`,
      label: `${i.label} (${g.label})`,
      sub: `${g.label} module`,
      href: i.href,
      icon: i.icon,
      type: "page" as const,
    }))
  ),
]

const RECENT_COMMANDS_KEY = "admin_recent_commands"

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pages" | "actions" | "db">("all")
  const [dbResults, setDbResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [recentItems, setRecentItems] = useState<SearchResult[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  // Load recent command history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY)
      if (stored) setRecentItems(JSON.parse(stored))
    } catch {}
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Global ⌘K / Ctrl+K shortcut to open command palette
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [paletteOpen])

  // Focus search input when palette opens
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }, 50)
      setActiveIndex(0)
    } else {
      setQuery("")
      setDbResults([])
    }
  }, [paletteOpen])

  // Debounced API search for products, orders, customers
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setDbResults([])
      return
    }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const d = await res.json()
          setDbResults(d.results || [])
        }
      } catch {
        setDbResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [query])

  // Filter client items based on query
  const filteredNav = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return allNavigationItems.slice(0, 8)
    return allNavigationItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    )
  }, [query])

  const filteredActions = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return quickActions
    return quickActions.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    )
  }, [query])

  // Aggregate visible list depending on tab and query
  const combinedList = useMemo(() => {
    if (!query.trim()) {
      if (recentItems.length > 0) {
        return [...recentItems, ...quickActions]
      }
      return [...quickActions, ...allNavigationItems.slice(0, 6)]
    }

    let list: SearchResult[] = []
    if (activeTab === "all" || activeTab === "actions") {
      list = [...list, ...filteredActions]
    }
    if (activeTab === "all" || activeTab === "pages") {
      list = [...list, ...filteredNav]
    }
    if (activeTab === "all" || activeTab === "db") {
      list = [...list, ...dbResults]
    }
    return list
  }, [query, activeTab, filteredActions, filteredNav, dbResults, recentItems])

  const handleSelect = (item: SearchResult) => {
    // Save to recents
    const updated = [item, ...recentItems.filter((r) => r.id !== item.id)].slice(0, 5)
    setRecentItems(updated)
    try {
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated))
    } catch {}

    setPaletteOpen(false)
    if (item.href.startsWith("http") || item.href === "/") {
      if (item.href === "/") window.open("/", "_blank")
      else router.push(item.href)
    } else {
      router.push(item.href)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (combinedList.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % combinedList.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + combinedList.length) % combinedList.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = combinedList[activeIndex] || combinedList[0]
      if (target) handleSelect(target)
    }
  }

  return (
    <>
      {/* Topbar Header */}
      <header className="h-14 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-md border-b border-zinc-200/90 px-4 lg:px-6 shrink-0 sticky top-0 z-30 shadow-xs">
        {/* Left: Mobile Trigger & Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              }
            />
            <SheetContent side="left" className="p-0 w-64 bg-[#090a0f] border-zinc-800 text-white">
              <div className="flex h-14 items-center gap-3 px-4 border-b border-zinc-800">
                <img src="/logo.webp" alt="Berber" className="h-7 w-auto object-contain brightness-0 invert" />
                <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase ml-auto">Admin</span>
              </div>
              <div className="py-2 h-[calc(100vh-3.5rem)]">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs */}
          <div className="hidden sm:block truncate">
            <AdminBreadcrumbs />
          </div>
        </div>

        {/* Center: Command Palette Trigger Button */}
        <div className="flex-1 max-w-md mx-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/90 text-xs text-zinc-500 hover:text-zinc-700 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
              <span className="truncate">Search commands, orders, products…</span>
            </div>
            <div className="hidden sm:flex items-center gap-0.5 shrink-0 text-[10px] font-medium font-mono text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-2xs">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Store Link, Notifications, User Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Live Store"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Store</span>
          </Link>

          <AdminNotificationBell />

          {/* User Account Popover */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center text-xs font-bold ring-2 ring-zinc-100">
                {email ? email.charAt(0).toUpperCase() : "A"}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="font-semibold text-zinc-900 truncate">{email}</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Administrator
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" /> Store Settings
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" /> Customer Storefront
                  </Link>
                </div>

                <div className="border-t border-zinc-100 pt-1">
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Command Palette (⌘K) Modal Overlay ────────────────────────────── */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command, page name, order # or customer…"
                className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent outline-none"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 shrink-0" />}
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Filter Tabs */}
            {query.trim().length > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-50/70 border-b border-zinc-100 text-xs">
                {(["all", "actions", "pages", "db"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-2.5 py-1 rounded-md capitalize font-medium transition-all text-[11px]",
                      activeTab === tab
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                    )}
                  >
                    {tab === "db" ? "Store Data" : tab}
                  </button>
                ))}
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {combinedList.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  <p>No results found for &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Try searching for &ldquo;orders&rdquo;, &ldquo;inventory&rdquo;, or &ldquo;campaign&rdquo;</p>
                </div>
              ) : (
                combinedList.map((item, index) => {
                  const isSelected = index === activeIndex
                  const Icon = item.icon || (
                    item.type === "order" ? ShoppingCart :
                    item.type === "product" ? Package :
                    item.type === "customer" ? Users : ArrowRight
                  )

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs",
                        isSelected
                          ? "bg-zinc-100 text-zinc-950 font-medium"
                          : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-zinc-900 text-amber-400 shadow-2xs"
                              : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="truncate font-medium text-zinc-900">{item.label}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{item.sub}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.type === "action" && (
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                            Action
                          </span>
                        )}
                        {item.type === "order" && (
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                            Order
                          </span>
                        )}
                        {item.type === "product" && (
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Product
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Palette Footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 rounded">↑</kbd>
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 rounded">↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 rounded">↵</kbd> select
                </span>
              </div>
              <span className="font-medium text-zinc-500">Berber Command Bar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
