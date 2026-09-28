"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  orders: "Orders",
  products: "Products",
  customers: "Customers",
  inventory: "Inventory",
  "stock-alerts": "Stock Alerts",
  analytics: "Analytics",
  categories: "Categories",
  brands: "Brands",
  collections: "Collections",
  reviews: "Reviews",
  returns: "Returns & RMA",
  "abandoned-carts": "Abandoned Carts",
  coupons: "Coupons",
  "flash-sales": "Flash Sales",
  "gift-cards": "Gift Cards",
  campaigns: "Campaigns",
  "email-studio": "Email Studio",
  subscribers: "Subscribers",
  "store-credit": "Store Credit",
  loyalty: "Loyalty Points",
  affiliates: "Affiliates",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  expenses: "Expenses",
  "shipping-zones": "Shipping Zones",
  delivery: "Delivery Methods",
  locations: "Inventory Locations",
  blog: "Blog Posts",
  pages: "Content Pages",
  contact: "Inbox & Messages",
  reports: "Reports",
  export: "Export Data",
  "audit-log": "Audit Log",
  settings: "Settings",
  new: "Create New",
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname()
  if (!pathname || pathname === "/admin") return null

  const segments = pathname.split("/").filter(Boolean)
  // Example: segments = ["admin", "orders", "12345"]

  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/")
    let label = ROUTE_LABELS[seg]
    const isId = !label && (seg.length >= 8 || !isNaN(Number(seg)))

    if (!label) {
      if (isId) {
        label = seg.length > 12 ? `#${seg.slice(0, 8)}…` : `#${seg}`
      } else {
        label = seg
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      }
    }

    const isLast = idx === segments.length - 1
    return { href, label, isLast, isId }
  })

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-500 overflow-x-auto py-1">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-zinc-900 transition-colors shrink-0"
        title="Admin Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-zinc-400" />
      </Link>

      {crumbs.slice(1).map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="w-3 h-3 text-zinc-300" />
          {crumb.isLast ? (
            <span
              className={`font-semibold ${
                crumb.isId ? "font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]" : "text-zinc-900"
              }`}
            >
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
