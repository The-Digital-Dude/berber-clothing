"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_PILLS = [
  { value: "", label: "All Products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Draft / Inactive" },
  { value: "low_stock", label: "⚠️ Low Stock (≤ 5)" },
  { value: "out_of_stock", label: "🚨 Out of Stock (0)" },
]

export default function ProductsFilters({
  currentSearch,
  currentStatus = "",
}: {
  currentSearch: string
  currentStatus?: string
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
        router.push(`/admin/products?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const activeStatus = searchParams.get("status") || currentStatus

  return (
    <div className="p-4 border-b border-zinc-200/80 bg-white space-y-3 relative">
      {/* Pending status progress bar */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-100 overflow-hidden">
          <div className="h-full bg-amber-500 animate-pulse w-full" />
        </div>
      )}

      {/* Preset Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {STATUS_PILLS.map((pill) => {
          const isActive = activeStatus === pill.value
          return (
            <button
              key={pill.value}
              disabled={isPending}
              onClick={() => update("status", pill.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-xs cursor-pointer",
                isActive
                  ? "bg-zinc-900 text-white shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70 disabled:opacity-60"
              )}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-md">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          )}
          <input
            type="search"
            defaultValue={currentSearch}
            placeholder="Filter products by title, SKU, or tag…"
            onChange={(e) => {
              const v = e.target.value
              clearTimeout((window as any)._productSearchTimer)
              ;(window as any)._productSearchTimer = setTimeout(() => update("search", v), 300)
            }}
            className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-3 py-1 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
        </div>
        {isPending && (
          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 shrink-0">
            Updating catalog…
          </span>
        )}
      </div>
    </div>
  )
}
