import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import OrderBumpsClient from "./OrderBumpsClient"
import { ShoppingCart, Sparkles, ArrowUpRight, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrderBumpsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const [bumps, products] = await Promise.all([
    prisma.orderBump.findMany({
      include: { product: { select: { id: true, name: true, price: true, images: { take: 1 } } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              Checkout Upsell Engine
            </span>
            <span className="text-xs text-zinc-600 font-medium">1-click impulse additions at checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Checkout Order Bumps</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Boost Average Order Value (AOV) by displaying high-converting impulse add-on products during the final checkout step.
          </p>
        </div>
      </div>

      <OrderBumpsClient
        data={JSON.parse(JSON.stringify(bumps))}
        products={JSON.parse(JSON.stringify(products))}
      />
    </div>
  )
}
