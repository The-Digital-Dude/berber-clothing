import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import PayoutsClient from "./PayoutsClient"

export const dynamic = "force-dynamic"

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string; limit?: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const status = (params.status || "ALL").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { affiliate: { name: { contains: search, mode: "insensitive" } } },
            { affiliate: { email: { contains: search, mode: "insensitive" } } },
            { affiliate: { phone: { contains: search } } },
            { affiliate: { shopName: { contains: search, mode: "insensitive" } } },
            { transactionId: { contains: search, mode: "insensitive" } },
            { accountDetails: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [payouts, totalFiltered, totalCount, pendingCount, paidCount] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        affiliate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            shopName: true,
            partnerType: true,
            code: true,
            walletBalance: true,
          },
        },
      },
    }),
    prisma.payoutRequest.count({ where }),
    prisma.payoutRequest.count(),
    prisma.payoutRequest.count({ where: { status: "PENDING" } }),
    prisma.payoutRequest.count({ where: { status: "PAID" } }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Partner & Reseller Payouts</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {totalCount.toLocaleString()} payout requests
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review and disburse affiliate commissions and reseller dropship profit withdrawals (bKash, Nagad, Bank, Store Credit)
          </p>
        </div>
      </div>

      <PayoutsClient
        data={JSON.parse(JSON.stringify(payouts))}
        counts={{
          all: totalCount,
          pending: pendingCount,
          paid: paidCount,
        }}
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
