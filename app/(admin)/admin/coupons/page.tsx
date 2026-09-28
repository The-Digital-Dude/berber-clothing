import prisma from "@/lib/prisma"
import { CouponClient } from "./CouponClient"

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  // We have to convert Decimal to number for the client component
  const formattedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Coupons & Promo Codes</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {coupons.length} codes
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure promotional discount codes, minimum order rules, usage limits, and share links
          </p>
        </div>
      </div>
      <CouponClient data={formattedCoupons} />
    </div>
  )
}
