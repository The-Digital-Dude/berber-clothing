"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Package,
  BarChart2, Settings, Tag, RotateCcw, Ticket, Zap, CreditCard, Bell,
  Globe, MessageSquare, Building2, Truck, Warehouse, Mail,
  ChevronRight, Star, Users2, Wallet, Award, ScrollText,
  Receipt, Download, Layers, Search, PlusCircle,
} from "lucide-react"

// ─── Navigation structure ───────────────────────────────────────────────────
// Primary items always visible. Groups are expandable.
const primaryItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: null },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/stock-alerts", label: "Stock Alerts", icon: Bell },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
]

const groups = [
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
    label: "Orders",
    items: [
      { href: "/admin/returns", label: "Returns & RMA", icon: RotateCcw },
      { href: "/admin/abandoned-carts", label: "Abandoned Carts", icon: ShoppingCart },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
      { href: "/admin/gift-cards", label: "Gift Cards", icon: CreditCard },
      { href: "/admin/campaigns", label: "Email Campaigns", icon: Mail },
      { href: "/admin/subscribers", label: "Subscribers", icon: Users2 },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/store-credit", label: "Store Credit", icon: Wallet },
      { href: "/admin/loyalty", label: "Loyalty Points", icon: Award },
      { href: "/admin/affiliates", label: "Affiliates", icon: Users2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/suppliers", label: "Suppliers", icon: Building2 },
      { href: "/admin/purchase-orders", label: "Purchase Orders", icon: Receipt },
      { href: "/admin/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    label: "Shipping",
    items: [
      { href: "/admin/shipping-zones", label: "Zones", icon: Truck },
      { href: "/admin/delivery", label: "Methods", icon: Truck },
      { href: "/admin/locations", label: "Locations", icon: Warehouse },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Globe },
      { href: "/admin/pages", label: "Pages", icon: Globe },
      { href: "/admin/contact", label: "Inbox", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart2 },
      { href: "/admin/export", label: "Export Data", icon: Download },
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()

  const defaultOpen = groups.reduce<Record<string, boolean>>((acc, g) => {
    acc[g.label] = g.items.some(i => isActive(pathname, i.href, false))
    return acc
  }, {})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen)
  const [search, setSearch] = useState("")

  const toggle = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))

  const q = search.toLowerCase().trim()
  const allItems = [...primaryItems, ...groups.flatMap(g => g.items)]
  const filtered = q ? allItems.filter(i => i.label.toLowerCase().includes(q)) : null

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/6 border border-white/10 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        <Link href="/admin/orders/new" className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-white/6 border border-white/10 text-[10px] font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-all">
          <ShoppingCart className="w-3 h-3" /> Order
        </Link>
        <Link href="/admin/products/new" className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/25 hover:text-amber-300 transition-all">
          <PlusCircle className="w-3 h-3" /> Product
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 space-y-0.5 px-2">
        {filtered ? (
          /* Search results */
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-500 text-center">Nothing found</p>
            )}
            {filtered.map(item => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setSearch("")} />
            ))}
          </div>
        ) : (
          <>
            {/* Primary nav */}
            <div className="space-y-0.5 mb-3">
              {primaryItems.map(item => (
                <NavLink key={item.href} item={item} pathname={pathname} primary />
              ))}
            </div>

            {/* Divider */}
            <div className="mx-3 my-3 border-t border-white/8" />

            {/* Groups */}
            {groups.map(group => {
              const isOpen = !!openGroups[group.label]
              const hasActive = group.items.some(i => isActive(pathname, i.href, false))
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggle(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors",
                      hasActive ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                    )}
                  >
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="ml-1 space-y-0.5 mb-1">
                      {group.items.map(item => (
                        <NavLink key={item.href} item={item} pathname={pathname} indent />
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

function NavLink({ item, pathname, primary, indent, onClick }: {
  item: { href: string; label: string; icon: any; exact?: boolean }
  pathname: string
  primary?: boolean
  indent?: boolean
  onClick?: () => void
}) {
  const active = isActive(pathname, item.href, item.exact)
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
        indent && "pl-4 text-[13px]",
        primary && "font-medium",
        active
          ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/20 font-semibold"
          : "text-slate-400 hover:bg-white/8 hover:text-white"
      )}
    >
      <item.icon className={cn("shrink-0", indent ? "w-3.5 h-3.5" : "w-4 h-4")} />
      {item.label}
    </Link>
  )
}
