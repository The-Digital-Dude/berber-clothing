"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_PILLS = [
  { value: "", label: "All Products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Draft / Inactive" },
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

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete("page")
      router.push(`/admin/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const activeStatus = searchParams.get("status") || currentStatus

  return (
    <div className="p-4 border-b border-zinc-200/80 bg-white space-y-3">
      {/* Preset Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {STATUS_PILLS.map((pill) => {
          const isActive = activeStatus === pill.value
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

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
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
    </div>
  )
}
