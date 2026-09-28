import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { AutoDiscountClient } from "./AutoDiscountClient"
import { Percent, Sparkles, Tag, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AutoDiscountsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const discounts = await prisma.autoDiscount.findMany({ orderBy: { createdAt: "desc" } })

  const formatted = discounts.map((d) => ({
    id: d.id,
    name: d.name,
    ruleType: d.ruleType as string,
    thresholdQty: d.thresholdQty,
    thresholdAmt: d.thresholdAmt ? Number(d.thresholdAmt) : null,
    discountPct: Number(d.discountPct),
    isActive: d.isActive,
    endsAt: d.endsAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Percent className="w-3.5 h-3.5" />
              Automated Cart Markdowns
            </span>
            <span className="text-xs text-zinc-600 font-medium">Frictionless no-code discounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Automatic Cart Discounts</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Configure automatic threshold rules applied directly in the shopping cart without requiring promo codes.
          </p>
        </div>
      </div>

      <AutoDiscountClient data={formatted} />
    </div>
  )
}
