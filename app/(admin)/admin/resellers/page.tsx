import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ResellersClient from "./ResellersClient"

export const dynamic = "force-dynamic"

export default async function ResellersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    partnerType: { in: ["RESELLER", "BOTH"] },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { shopName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [resellers, totalFiltered, totalCount] = await Promise.all([
    prisma.affiliate.findMany({
      where,
      include: {
        _count: { select: { resellerOrders: true, payoutRequests: true } },
        resellerOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            resellerProfit: true,
            advancePaid: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.affiliate.count({ where }),
    prisma.affiliate.count({ where: { partnerType: { in: ["RESELLER", "BOTH"] } } }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Resellers & Dropshipping Desk</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalCount.toLocaleString()} registered resellers
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage reseller shops, wholesale discount margins, dropship orders, advance delivery fee tracking, and COD profits
          </p>
        </div>
      </div>

      <ResellersClient
        data={JSON.parse(JSON.stringify(resellers))}
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
      />
    </div>
  )
}
