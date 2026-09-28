import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import AffiliatesClient from "./AffiliatesClient"

export const dynamic = "force-dynamic"

export default async function AffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; page?: string; limit?: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const type = (params.type || "ALL").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type !== "ALL" ? { partnerType: type } : {}),
  }

  const [affiliates, totalFiltered, totalCount, coupons] = await Promise.all([
    prisma.affiliate.findMany({
      where,
      include: {
        coupon: { select: { id: true, code: true, value: true, type: true } },
        _count: { select: { clicks: true, conversions: true, resellerOrders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.affiliate.count({ where }),
    prisma.affiliate.count(),
    prisma.coupon.findMany({
      where: { isActive: true },
      select: { id: true, code: true, value: true, type: true },
      orderBy: { code: "asc" },
    }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Affiliates & Influencers</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalCount.toLocaleString()} partners
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
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
        currentType={type}
      />
    </div>
  )
}
