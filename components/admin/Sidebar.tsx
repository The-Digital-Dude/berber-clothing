"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Package,
  BarChart2, Settings, Tag, RotateCcw, Ticket, Zap, CreditCard, Bell,
  Globe, MessageSquare, Building2, Truck, Warehouse, Mail,
  ChevronRight, Star, Users2, Wallet, Award, ScrollText,
  Receipt, Download, Layers, Search, PlusCircle, PanelLeftClose, PanelLeftOpen,
  Pin, Sparkles, HelpCircle, X, Image, Scissors, Palette
} from "lucide-react"

// ─── Navigation structure ───────────────────────────────────────────────────
export const primaryItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/delivery", label: "Deliveries", icon: Truck },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/stock-alerts", label: "Stock Alerts", icon: Bell },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
]

export const groups = [
  {
    label: "Bespoke & Tailoring",
    items: [
      { href: "/admin/bespoke/orders", label: "Workshop Orders", icon: Scissors },
      { href: "/admin/bespoke/fabrics", label: "Fabric Inventory", icon: Palette },
      { href: "/admin/bespoke/appointments", label: "Atelier Fittings", icon: Scissors },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/brands", label: "Brands", icon: Award },
      { href: "/admin/collections", label: "Collections", icon: Layers },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Sales & Orders",
    items: [
      { href: "/admin/returns", label: "Returns & RMA", icon: RotateCcw },
      { href: "/admin/abandoned-carts", label: "Abandoned Carts", icon: ShoppingCart },
    ],
  },
  {
    label: "Marketing & Promo",
    items: [
      { href: "/admin/banners", label: "Banners", icon: Image },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
      { href: "/admin/gift-cards", label: "Gift Cards", icon: CreditCard },
      { href: "/admin/campaigns", label: "Email Campaigns", icon: Mail },
      { href: "/admin/email-studio", label: "Email Studio", icon: Sparkles },
      { href: "/admin/subscribers", label: "Subscribers", icon: Users2 },
    ],
  },
  {
    label: "Partner & Reseller Ecosystem",
    items: [
      { href: "/admin/affiliates", label: "Affiliates", icon: Users2 },
      { href: "/admin/resellers", label: "Resellers & Dropship", icon: ShoppingBag },
      { href: "/admin/payouts", label: "Partner Payouts", icon: Wallet },
      { href: "/admin/store-credit", label: "Store Credit", icon: CreditCard },
      { href: "/admin/loyalty", label: "Loyalty Points", icon: Award },
    ],
  },
  {
    label: "Supply & Finance",
    items: [
      { href: "/admin/suppliers", label: "Suppliers", icon: Building2 },
      { href: "/admin/purchase-orders", label: "Purchase Orders", icon: Receipt },
      { href: "/admin/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    label: "Fulfillment & Logistics",
    items: [
      { href: "/admin/delivery", label: "Packzy Courier Hub", icon: Zap },
      { href: "/admin/shipping-labels", label: "Shipping Labels", icon: Receipt },
      { href: "/admin/shipping-zones", label: "Shipping Zones", icon: Truck },
      { href: "/admin/locations", label: "Warehouses / Locations", icon: Warehouse },
    ],
  },
  {
    label: "Storefront & Content",
    items: [
      { href: "/admin/blog", label: "Blog Articles", icon: Globe },
      { href: "/admin/pages", label: "Content Pages", icon: Globe },
      { href: "/admin/contact", label: "Support Inbox", icon: MessageSquare },
    ],
  },
  {
    label: "System & Config",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart2 },
      { href: "/admin/export", label: "Export Data", icon: Download },
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
      { href: "/admin/settings", label: "Store Settings", icon: Settings },
    ],
  },
]

const PINNED_STORAGE_KEY = "admin_sidebar_pinned_routes"

// ─── Component ───────────────────────────────────────────────────────────────
export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
}: {
  collapsed?: boolean
  onToggleCollapsed?: () => void
} = {}) {
  const pathname = usePathname()

  const defaultOpen = groups.reduce<Record<string, boolean>>((acc, g) => {
    acc[g.label] = g.items.some((i) => isActive(pathname, i.href, false))
    return acc
  }, {})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen)
  const [search, setSearch] = useState("")
  const [pinnedRoutes, setPinnedRoutes] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY)
      if (stored) {
        setPinnedRoutes(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const togglePin = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPinnedRoutes((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const toggle = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  const q = search.toLowerCase().trim()
  const allItems = [...primaryItems, ...groups.flatMap((g) => g.items)]
  const filtered = q ? allItems.filter((i) => i.label.toLowerCase().includes(q)) : null

  const pinnedItems = allItems.filter((i) => pinnedRoutes.includes(i.href))

  if (collapsed) {
    return (
      <div className="flex flex-col h-full items-center justify-between py-2">
        <div className="flex-1 overflow-y-auto py-1 space-y-1.5 px-1.5 w-full flex flex-col items-center scrollbar-none">
          {primaryItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed />
          ))}

          <div className="w-6 border-t border-zinc-800 my-1" />

          {pinnedItems.map((item) => (
            <NavLink key={`pinned-${item.href}`} item={item} pathname={pathname} collapsed isPinned />
          ))}

          {groups.flatMap((g) => g.items).filter(i => !pinnedRoutes.includes(i.href)).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed />
          ))}
        </div>

        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            className="mt-2 w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Search Bar */}
      <div className="px-3 pb-2.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter navigation…"
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="px-3 pb-3 flex gap-1.5">
        <Link
          href="/admin/orders/new"
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all shadow-sm"
        >
          <ShoppingCart className="w-3 h-3 text-amber-400" />
          <span>New Order</span>
        </Link>
        <Link
          href="/admin/products/new"
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all shadow-sm"
        >
          <PlusCircle className="w-3 h-3" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 space-y-0.5 px-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {filtered ? (
          /* Filter results */
          <div className="space-y-0.5">
            <p className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Search Results</p>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-zinc-500 text-center">No matching pages found</p>
            ) : (
              filtered.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isPinned={pinnedRoutes.includes(item.href)}
                  onTogglePin={(e) => togglePin(item.href, e)}
                  onClick={() => setSearch("")}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Pinned Quick Links (if any) */}
            {pinnedItems.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  <span className="flex items-center gap-1.5">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">{pinnedItems.length}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {pinnedItems.map((item) => (
                    <NavLink
                      key={`pinned-${item.href}`}
                      item={item}
                      pathname={pathname}
                      isPinned={true}
                      onTogglePin={(e) => togglePin(item.href, e)}
                      primary
                    />
                  ))}
                </div>
                <div className="mx-2 my-2.5 border-t border-zinc-800/80" />
              </div>
            )}

            {/* Primary Navigation */}
            <div className="space-y-0.5 mb-2.5">
              {primaryItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isPinned={pinnedRoutes.includes(item.href)}
                  onTogglePin={(e) => togglePin(item.href, e)}
                  primary
                />
              ))}
            </div>

            {/* Divider */}
            <div className="mx-2 my-2.5 border-t border-zinc-800/80" />

            {/* Categorized Groups */}
            {groups.map((group) => {
              const isOpen = !!openGroups[group.label]
              const hasActive = group.items.some((i) => isActive(pathname, i.href, false))
              return (
                <div key={group.label} className="mb-1">
                  <button
                    onClick={() => toggle(group.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors group",
                      hasActive ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform duration-200 opacity-60 group-hover:opacity-100",
                        isOpen && "rotate-90 text-amber-400"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-1 space-y-0.5 mt-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          isPinned={pinnedRoutes.includes(item.href)}
                          onTogglePin={(e) => togglePin(item.href, e)}
                          indent
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

function isActive(pathname: string, href: string, exact = false) {
  if (exact || href === "/admin") return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function NavLink({
  item,
  pathname,
  primary,
  indent,
  collapsed,
  isPinned,
  onTogglePin,
  onClick,
}: {
  item: { href: string; label: string; icon: any; exact?: boolean }
  pathname: string
  primary?: boolean
  indent?: boolean
  collapsed?: boolean
  isPinned?: boolean
  onTogglePin?: (e: React.MouseEvent) => void
  onClick?: () => void
}) {
  const active = isActive(pathname, item.href, item.exact)

  if (collapsed) {
    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={item.label}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0 group",
          active
            ? "bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20"
            : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
        )}
      >
        <item.icon className="w-4 h-4" />
        {isPinned && !active && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
        )}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all",
        indent && "pl-3.5 text-[12px]",
        primary && "font-medium text-[13px]",
        active
          ? "bg-amber-500 text-zinc-950 font-semibold shadow-sm shadow-amber-500/10"
          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
      )}
    >
      <div className="flex items-center gap-2.5 truncate">
        <item.icon
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-200",
            indent ? "w-3.5 h-3.5" : "w-4 h-4"
          )}
        />
        <span className="truncate">{item.label}</span>
      </div>

      {onTogglePin && (
        <button
          onClick={onTogglePin}
          title={isPinned ? "Unpin item" : "Pin item to top"}
          className={cn(
            "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
            active ? "hover:bg-amber-600/30 text-zinc-950" : "hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200",
            isPinned && "opacity-100 text-amber-400"
          )}
        >
          <Pin className={cn("w-3 h-3", isPinned && "fill-amber-400 text-amber-400")} />
        </button>
      )}
    </Link>
  )
}
