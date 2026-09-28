import prisma from "@/lib/prisma"
import { FlashSaleClient } from "./FlashSaleClient"

export default async function FlashSalesPage() {
  const [sales, products, categories] = await Promise.all([
    prisma.flashSale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const formatted = sales.map((s) => ({
    id: s.id,
    name: s.name,
    discountType: s.discountType as string,
    discountValue: Number(s.discountValue),
    scope: s.scope as string,
    targetName: s.product?.name || s.category?.name || "Sitewide",
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    isActive: s.isActive,
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Flash Sales Studio</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {sales.length} campaigns
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Time-limited discounts with live countdown timers applied automatically across the store
          </p>
        </div>
      </div>
      <FlashSaleClient
        data={formatted}
        products={products}
        categories={categories}
      />
    </div>
  )
}
