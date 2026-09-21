import prisma from "@/lib/prisma"
import ShopFilters from "@/components/store/ShopFilters"
import ShopTopControls from "@/components/store/ShopTopControls"
import ShopProductGrid from "@/components/store/ShopProductGrid"
import ShopHeading from "@/components/store/ShopHeading"
import { Suspense } from "react"

export default async function ShopPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true } }).catch(() => []),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }).catch(() => []),
  ])

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-berber-border pb-6 mb-8 gap-4">
        <Suspense fallback={<div className="h-16 bg-berber-muted rounded-xl animate-pulse w-48" />}>
          <ShopHeading />
        </Suspense>
        <Suspense fallback={null}>
          <ShopTopControls />
        </Suspense>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
          <ShopFilters categories={categories as any} brands={brands as any} />
        </Suspense>

        <Suspense fallback={
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-berber-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        }>
          <ShopProductGrid />
        </Suspense>
      </div>
    </div>
  )
}

