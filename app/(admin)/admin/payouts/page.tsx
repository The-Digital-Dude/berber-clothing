import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import PayoutsClient from "./PayoutsClient"

export default async function PayoutsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const payouts = await prisma.payoutRequest.findMany({
    orderBy: { createdAt: "desc" },
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
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Partner & Reseller Payouts</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {payouts.length} payout requests
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review and disburse affiliate commissions and reseller dropship profit withdrawals (bKash, Nagad, Bank, Store Credit)
          </p>
        </div>
      </div>

      <PayoutsClient data={JSON.parse(JSON.stringify(payouts))} />
    </div>
  )
}
