import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import AffiliatesClient from "./AffiliatesClient"

export default async function AffiliatesPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const [affiliates, coupons] = await Promise.all([
    prisma.affiliate.findMany({
      include: {
        coupon: { select: { id: true, code: true, value: true, type: true } },
        _count: { select: { clicks: true, conversions: true, resellerOrders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coupon.findMany({
      where: { isActive: true },
      select: { id: true, code: true, value: true, type: true },
      orderBy: { code: "asc" },
    }),
  ])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Affiliates & Influencers</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {affiliates.length} partners
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Track referral links, commission rates, linked influencer coupons, and conversion payouts
          </p>
        </div>
      </div>

      <AffiliatesClient
        data={JSON.parse(JSON.stringify(affiliates))}
        coupons={JSON.parse(JSON.stringify(coupons))}
      />
    </div>
  )
}
