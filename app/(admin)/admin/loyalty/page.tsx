import prisma from "@/lib/prisma"
import { LoyaltyClient } from "./LoyaltyClient"

export default async function LoyaltyPage() {
  const users = await prisma.user.findMany({
    include: {
      loyaltyPoints: true,
    },
  })

  const customers = users
    .map((user) => {
      let earned = 0
      let redeemed = 0
      user.loyaltyPoints.forEach((lp) => {
        if (lp.points > 0) earned += lp.points
        else redeemed += Math.abs(lp.points)
      })

      const tier: "BRONZE" | "SILVER" | "GOLD" =
        earned >= 5000 ? "GOLD" : earned >= 1000 ? "SILVER" : "BRONZE"

      return {
        id: user.id,
        name: user.name || "N/A",
        email: user.email,
        currentBalance: earned - redeemed,
        totalEarned: earned,
        totalRedeemed: redeemed,
        tier,
      }
    })
    .sort((a, b) => b.currentBalance - a.currentBalance)

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["points_per_taka", "points_redemption_rate"],
      },
    },
  })

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Loyalty & VIP Rewards Hub</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {customers.length} members
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage customer VIP tiers (Bronze, Silver, Gold), automated order point rewards, and points redemption liabilities
          </p>
        </div>
      </div>
      <LoyaltyClient
        customers={customers}
        initialSettings={{
          pointsPerTaka: settingsMap["points_per_taka"] || "1",
          pointsRedemptionRate: settingsMap["points_redemption_rate"] || "10",
        }}
      />
    </div>
  )
}
