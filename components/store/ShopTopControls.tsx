"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Grid3X3, List as ListIcon } from "lucide-react"

export default function ShopTopControls() {
  const router = useRouter()
  const sp = useSearchParams()

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    return `/shop?${p.toString()}`
  }

  const sort = sp.get("sort") || "newest"
  const isGrid = sp.get("view") !== "list"

  return (
    <div className="flex items-center gap-4">
      <select
        value={sort}
        onChange={(e) => router.replace(buildUrl({ sort: e.target.value }), { scroll: false })}
        className="border-none bg-berber-muted text-berber-text text-sm px-4 py-2 rounded-full focus:ring-1 focus:ring-berber-gold outline-none cursor-pointer"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

      <div className="hidden md:flex items-center gap-1 bg-berber-muted p-1 rounded-full text-berber-text-muted">
        <button
          onClick={() => router.replace(buildUrl({ view: "grid" }), { scroll: false })}
          className={`p-1.5 rounded-full transition-colors ${isGrid ? "bg-white shadow-sm text-berber-black" : "hover:text-berber-black"}`}
          title="Grid view"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.replace(buildUrl({ view: "list" }), { scroll: false })}
          className={`p-1.5 rounded-full transition-colors ${!isGrid ? "bg-white shadow-sm text-berber-black" : "hover:text-berber-black"}`}
          title="List view"
        >
          <ListIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
