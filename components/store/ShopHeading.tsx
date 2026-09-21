"use client"

import { useSearchParams } from "next/navigation"

export default function ShopHeading() {
  const sp = useSearchParams()
  const search = sp.get("search") || ""
  return (
    <div>
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-berber-black mb-2">
        {search ? `"${search}"` : "Shop All"}
      </h1>
    </div>
  )
}
