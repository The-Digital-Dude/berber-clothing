import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { CouponClient } from "./CouponClient"

export const dynamic = "force-dynamic"

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string; limit?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const status = (params.status || "ALL").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const now = new Date()

  const where: any = {
    ...(search ? { code: { contains: search, mode: "insensitive" } } : {}),
    ...(status === "ACTIVE"
      ? {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        }
      : status === "EXPIRED"
      ? {
          expiresAt: { lte: now },
        }
      : status === "DISABLED"
      ? {
          isActive: false,
        }
      : {}),
  }

  const [coupons, totalFiltered, totalCount] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.coupon.count({ where }),
    prisma.coupon.count(),
  ])

  // Convert Decimal to number for the client component
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

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Coupons & Promo Codes</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalCount.toLocaleString()} codes
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure promotional discount codes, minimum order rules, usage limits, and share links
          </p>
        </div>
      </div>
      <CouponClient
        data={formattedCoupons}
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  )
}
