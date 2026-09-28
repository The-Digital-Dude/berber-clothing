"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Search, X, Truck, CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_PILLS = [
  { value: "", label: "All Orders" },
  { value: "PENDING", label: "Pending", alert: true },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
]

export default function OrdersFilters({
  currentSearch,
  currentStatus,
  currentPayment,
  currentCourier,
  statusCounts = {},
}: {
  currentSearch: string
  currentStatus: string
  currentPayment: string
  currentCourier?: string
  statusCounts?: Record<string, number>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete("page")
      startTransition(() => {
        router.push(`/admin/orders?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/admin/orders", { scroll: false })
    })
  }

  const hasActiveFilters = Boolean(
    currentSearch || currentStatus || currentPayment || currentCourier
  )

  return (
    <div className="p-4 border-b border-zinc-200/80 bg-white space-y-3.5 relative">
      {/* Pending status progress bar */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-100 overflow-hidden">
          <div className="h-full bg-amber-500 animate-pulse w-full" />
        </div>
      )}

      {/* 1. Status Segmented Tabs with Counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-200 text-xs">
        {STATUS_PILLS.map((pill) => {
          const isActive = currentStatus === pill.value
          const count = pill.value === "" ? statusCounts.ALL : statusCounts[pill.value]

          return (
            <button
              key={pill.value}
              disabled={isPending}
              onClick={() => update("status", pill.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all text-xs group cursor-pointer",
                isActive
                  ? "bg-zinc-900 text-white shadow-xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70 disabled:opacity-60"
              )}
            >
              <span>{pill.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold",
                    isActive
                      ? "bg-zinc-800 text-amber-400"
                      : pill.alert && pill.value === "PENDING"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-zinc-200/80 text-zinc-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 2. Multi-Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          )}
          <input
            type="search"
            defaultValue={currentSearch}
            placeholder="Search order #, customer, phone, area…"
            onChange={(e) => {
              const v = e.target.value
              clearTimeout((window as any)._orderSearchTimer)
              ;(window as any)._orderSearchTimer = setTimeout(() => update("search", v), 300)
            }}
            className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-8 py-1 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Payment Method */}
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={currentPayment || ""}
              disabled={isPending}
              onChange={(e) => update("paymentMethod", e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Payments</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="BKASH">bKash Gateway</option>
              <option value="NAGAD">Nagad Gateway</option>
              <option value="UDDOKTAPAY">UddoktaPay</option>
            </select>
          </div>

          {/* Courier Method */}
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={currentCourier || ""}
              disabled={isPending}
              onChange={(e) => update("courier", e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Couriers</option>
              <option value="STEADFAST">Steadfast Courier</option>
              <option value="PATHAO">Pathao Courier</option>
              <option value="REDX">RedX Delivery</option>
              <option value="PAPERFLY">Paperfly</option>
              <option value="SELF">Self Delivery</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              disabled={isPending}
              className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all text-xs font-medium shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
