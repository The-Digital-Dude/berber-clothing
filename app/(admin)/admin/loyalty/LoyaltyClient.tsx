"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Award,
  Crown,
  Gift,
  Coins,
  TrendingUp,
  User,
  Plus,
  Minus,
  Check,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Customer = {
  id: string
  name: string
  email: string
  currentBalance: number
  totalEarned: number
  totalRedeemed: number
  tier: "BRONZE" | "SILVER" | "GOLD"
}

const TIER_CONFIG = {
  BRONZE: {
    label: "Bronze Member",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "🥉",
    perk: "1x Points Earning",
  },
  SILVER: {
    label: "Silver VIP",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    icon: "🥈",
    perk: "1.25x Points + Priority Dispatch",
  },
  GOLD: {
    label: "Gold Elite",
    badge: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold",
    icon: "🥇",
    perk: "1.5x Points + Free Delivery on All Orders",
  },
}

export function LoyaltyClient({
  customers,
  initialSettings,
}: {
  customers: Customer[]
  initialSettings: { pointsPerTaka: string; pointsRedemptionRate: string }
}) {
  const router = useRouter()
  const [pointsPerTaka, setPointsPerTaka] = useState(initialSettings.pointsPerTaka)
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(initialSettings.pointsRedemptionRate)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [adjustPoints, setAdjustPoints] = useState("")
  const [adjustNote, setAdjustNote] = useState("")
  const [submittingAdjust, setSubmittingAdjust] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Calculations
  const redemptionRateNum = Number(pointsRedemptionRate) || 10
  const totalPointsIssued = customers.reduce((sum, c) => sum + (c.totalEarned || 0), 0)
  const totalPointsBalance = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0)
  const totalLiabilityTaka = Math.round(totalPointsBalance / redemptionRateNum)
  const vipCount = customers.filter((c) => c.tier === "GOLD" || c.tier === "SILVER").length

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            points_per_taka: pointsPerTaka,
            points_redemption_rate: pointsRedemptionRate,
          },
        }),
      })
      if (res.ok) {
        toast.success("Loyalty program rules saved successfully!")
        router.refresh()
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !adjustPoints) return

    setSubmittingAdjust(true)
    try {
      const pts = parseInt(adjustPoints)
      const res = await fetch("/api/admin/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          points: pts,
          description: adjustNote.trim() || `Manual admin adjustment (${pts > 0 ? `+${pts}` : pts} pts)`,
        }),
      })
      if (res.ok) {
        toast.success(
          `${pts > 0 ? "Credited" : "Debited"} ${Math.abs(pts)} points for ${selectedCustomer.name}`
        )
        setSelectedCustomer(null)
        setAdjustPoints("")
        setAdjustNote("")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to adjust points")
      }
    } catch {
      toast.error("Error adjusting points")
    } finally {
      setSubmittingAdjust(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Loyalty Members</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            {customers.length}{" "}
            <span className="text-xs font-normal text-zinc-400">enrolled</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>VIP Tier Members</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            {vipCount}{" "}
            <span className="text-xs font-normal text-zinc-400">Silver & Gold</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Active Point Balance</span>
            <Coins className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            {totalPointsBalance.toLocaleString()}{" "}
            <span className="text-xs font-normal text-zinc-400">pts</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Points Liability</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            ৳{totalLiabilityTaka.toLocaleString()}{" "}
            <span className="text-xs font-normal text-zinc-400">store credit</span>
          </p>
        </div>
      </div>

      {/* Program Settings Grid */}
      <div className="p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-zinc-700" />
              <span>Loyalty Points Earning & Redemption Rules</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automated point rewards on delivered orders & checkout conversion rates
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-8 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-2xs"
          >
            {isSaving ? "Saving…" : "Save Rules"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <label className="font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
              Earning Rate (Points per ৳100 Spent)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={pointsPerTaka}
                onChange={(e) => setPointsPerTaka(e.target.value)}
                className="h-9 font-mono font-bold text-xs bg-white rounded-xl border-zinc-300 shadow-2xs"
              />
              <span className="text-zinc-500 font-medium whitespace-nowrap">pts / ৳100</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Customer receives points automatically when an order is marked as DELIVERED.
            </p>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <label className="font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
              Redemption Rate (Points needed for ৳1 Discount)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={pointsRedemptionRate}
                onChange={(e) => setPointsRedemptionRate(e.target.value)}
                className="h-9 font-mono font-bold text-xs bg-white rounded-xl border-zinc-300 shadow-2xs"
              />
              <span className="text-zinc-500 font-medium whitespace-nowrap">pts = ৳1</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              e.g. 10 points = ৳1 off. 1,000 points = ৳100 off at cart checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Loyalty Leaderboard */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/40">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Customer Loyalty Ledger & VIP Tiers</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Top point earners, tier levels, and manual point adjustment controls</p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name or email…"
              className="h-8 rounded-xl border-zinc-300 text-xs bg-white shadow-2xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Customer</TableHead>
              <TableHead className="text-zinc-700 font-bold">VIP Tier</TableHead>
              <TableHead className="text-zinc-700 font-bold">Current Balance</TableHead>
              <TableHead className="text-zinc-700 font-bold">Equivalent Value</TableHead>
              <TableHead className="text-zinc-700 font-bold">Lifetime Earned / Redeemed</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-400 text-xs">
                  No customers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => {
                const tierInfo = TIER_CONFIG[c.tier] || TIER_CONFIG.BRONZE
                const equivTaka = Math.round(c.currentBalance / redemptionRateNum)

                return (
                  <TableRow key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Customer */}
                    <TableCell className="pl-5 py-3">
                      <div>
                        <p className="font-bold text-zinc-900">{c.name}</p>
                        <p className="text-zinc-400 font-mono text-[11px]">{c.email}</p>
                      </div>
                    </TableCell>

                    {/* Tier */}
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          tierInfo.badge
                        )}
                      >
                        <span>{tierInfo.icon}</span>
                        <span>{tierInfo.label}</span>
                      </span>
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="font-mono font-black text-zinc-900 text-xs">
                      {c.currentBalance.toLocaleString()} pts
                    </TableCell>

                    {/* Value */}
                    <TableCell className="font-mono font-bold text-emerald-700 text-xs">
                      ৳{equivTaka.toLocaleString()}
                    </TableCell>

                    {/* Lifetime */}
                    <TableCell className="text-zinc-500 font-mono text-[11px]">
                      <div>+{c.totalEarned.toLocaleString()} earned</div>
                      <div className="text-zinc-400">-{c.totalRedeemed.toLocaleString()} redeemed</div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-5">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Adjust Points</span>
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manual Point Adjuster Modal */}
      {selectedCustomer && (
        <Dialog open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
          <DialogContent className="sm:max-w-md w-[94vw] p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Adjust Customer Loyalty Points</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Member: <strong className="text-zinc-800">{selectedCustomer.name}</strong> ({selectedCustomer.currentBalance} pts)
              </p>
            </DialogHeader>

            <form onSubmit={handleAdjustPoints} className="p-6 space-y-4 text-xs">
              {/* Point Adjustment with quick presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Points Amount (positive to add, negative to deduct)
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAdjustPoints("100")}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPoints("500")}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPoints("1000")}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      +1000
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPoints("-500")}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold"
                    >
                      -500
                    </button>
                  </div>
                </div>
                <Input
                  required
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  placeholder="e.g. 500 or -200"
                  className="h-9 font-mono font-bold text-xs rounded-xl border-zinc-300 shadow-2xs"
                />
              </div>

              {/* Reason / Audit Note */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">
                  Adjustment Reason / Audit Note
                </label>
                <Input
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Customer support bonus / compensation for delivery delay"
                  className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAdjust || !adjustPoints}
                  className="h-9 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs"
                >
                  {submittingAdjust ? "Applying…" : "Apply Adjustment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
