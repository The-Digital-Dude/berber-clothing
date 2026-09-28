import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import GiftCardsClient from "./GiftCardsClient"
import { Gift, CreditCard, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function GiftCardsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const cards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              <Gift className="w-3.5 h-3.5" />
              Digital Store Credit
            </span>
            <span className="text-xs text-zinc-600 font-medium">Digital gift vouchers & custom redemptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Gift Cards & Store Vouchers</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Issue personalized digital gift cards, dispatch automated redemption codes via email, and monitor outstanding liabilities.
          </p>
        </div>
      </div>

      <GiftCardsClient data={JSON.parse(JSON.stringify(cards))} />
    </div>
  )
}
