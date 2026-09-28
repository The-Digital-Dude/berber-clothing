"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_PILLS = [
  { value: "", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function OrdersFilters({
  currentSearch,
  currentStatus,
  currentPayment,
}: {
  currentSearch: string
  currentStatus: string
  currentPayment: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete("page")
      router.push(`/admin/orders?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-4 border-b border-zinc-200/80 bg-white space-y-3">
      {/* Preset Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {STATUS_PILLS.map((pill) => {
          const isActive = currentStatus === pill.value
          return (
            <button
              key={pill.value}
              onClick={() => update("status", pill.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-xs",
                isActive
                  ? "bg-zinc-900 text-white shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70"
              )}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {/* Search Input & Payment Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            defaultValue={currentSearch}
            placeholder="Filter by order number, customer name, phone…"
            onChange={(e) => {
              const v = e.target.value
              clearTimeout((window as any)._orderSearchTimer)
              ;(window as any)._orderSearchTimer = setTimeout(() => update("search", v), 300)
            }}
            className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-8 py-1 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Payment:</span>
          </div>
          <select
            defaultValue={currentPayment}
            onChange={(e) => update("paymentMethod", e.target.value)}
            className="flex h-9 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Gateways</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="BKASH">bKash Gateway</option>
            <option value="NAGAD">Nagad Gateway</option>
            <option value="UDDOKTAPAY">UddoktaPay</option>
          </select>
        </div>
      </div>
    </div>
  )
}
