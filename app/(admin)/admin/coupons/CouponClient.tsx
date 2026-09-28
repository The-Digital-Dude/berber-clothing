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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Link as LinkIcon,
  TrendingUp,
  Percent,
  Calendar,
  Gift,
  HelpCircle,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Coupon = {
  id: string
  code: string
  type: string
  value: number
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export function CouponClient({ data }: { data: Coupon[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [code, setCode] = useState("")
  const [type, setType] = useState("PERCENTAGE")
  const [value, setValue] = useState("")
  const [minOrder, setMinOrder] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [expiresAt, setExpiresAt] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  )
  const [submitting, setSubmitting] = useState(false)

  // Copy helper
  const copyShareLink = (couponCode: string) => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://www.berber.clothing"
    const shareUrl = `${siteUrl}/shop?coupon=${encodeURIComponent(couponCode)}`
    navigator.clipboard.writeText(shareUrl)
    toast.success(`Copied shareable discount link for "${couponCode}"!`)
  }

  const copyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode)
    toast.success(`Copied code "${couponCode}"`)
  }

  // Quick code generation helpers
  const generateRandomCode = (prefix = "BERBER") => {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
    setCode(`${prefix}-${randomChars}`)
  }

  const setExpiryPreset = (days: number) => {
    const targetDate = new Date(Date.now() + days * 24 * 3600 * 1000)
    setExpiresAt(targetDate.toISOString().slice(0, 10))
    toast.success(`Set expiry to +${days} days`)
  }

  // Handle coupon creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !value) {
      toast.error("Please enter a coupon code and discount value.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value),
          minOrderAmount: minOrder ? parseFloat(minOrder) : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      })

      const couponData = await res.json()
      if (!res.ok) {
        throw new Error(couponData.error || "Failed to create coupon")
      }

      toast.success(`Coupon code ${code.toUpperCase()} created successfully!`)
      setIsDialogOpen(false)
      setCode("")
      setValue("")
      setMinOrder("")
      setMaxUses("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Error creating coupon")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle active status toggle
  const handleToggle = async (id: string, currentStatus: boolean, couponCode: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        toast.success(`Coupon "${couponCode}" ${currentStatus ? "disabled" : "activated"}`)
        router.refresh()
      } else {
        toast.error("Failed to update coupon status")
      }
    } catch {
      toast.error("Error updating coupon")
    }
  }

  // Handle deletion
  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Delete coupon "${couponCode}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`Coupon "${couponCode}" deleted`)
        router.refresh()
      } else {
        toast.error("Failed to delete coupon")
      }
    } catch {
      toast.error("Error deleting coupon")
    }
  }

  // KPIs
  const activeCount = data.filter((c) => c.isActive).length
  const totalUses = data.reduce((sum, c) => sum + (c.usedCount || 0), 0)
  const topCoupon = [...data].sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))[0]

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Active Promo Codes</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            {activeCount}{" "}
            <span className="text-xs font-normal text-zinc-400">/ {data.length} total</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Total Redemptions</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 font-mono">
            {totalUses}{" "}
            <span className="text-xs font-normal text-zinc-400">orders</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Most Popular Code</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-black text-zinc-900 font-mono truncate">
            {topCoupon && topCoupon.usedCount > 0 ? (
              <>
                {topCoupon.code}{" "}
                <span className="text-xs font-semibold text-emerald-600">({topCoupon.usedCount} uses)</span>
              </>
            ) : (
              <span className="text-zinc-400 font-sans text-xs">No redemptions yet</span>
            )}
          </p>
        </div>
      </div>

      {/* Creation Modal Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Configured Promotion Codes</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage cart discounts, spend thresholds, and single-click share links</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"><Plus className="w-3.5 h-3.5" /> Create Coupon Code</Button>} />
          <DialogContent className="sm:max-w-xl w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Create New Coupon Code</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Generate shareable promo codes with min-spend rules
              </p>
            </DialogHeader>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              {/* Code input with quick generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Coupon Code
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => generateRandomCode("BERBER")}
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Random</span>
                    </button>
                    <span className="text-zinc-300">·</span>
                    <button
                      type="button"
                      onClick={() => setCode("WELCOME10")}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900"
                    >
                      WELCOME10
                    </button>
                    <span className="text-zinc-300">·</span>
                    <button
                      type="button"
                      onClick={() => setCode("EID20")}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900"
                    >
                      EID20
                    </button>
                  </div>
                </div>
                <Input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="h-9 font-mono font-bold text-xs uppercase tracking-wider rounded-xl border-zinc-300 shadow-2xs"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Discount Type
                  </label>
                  <Select value={type} onValueChange={(v) => setType(v || "PERCENTAGE")}>
                    <SelectTrigger className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%) Off</SelectItem>
                      <SelectItem value="FLAT">Flat Cash (৳) Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Discount Value
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-zinc-400 font-bold font-mono">
                      {type === "PERCENTAGE" ? "%" : "৳"}
                    </span>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={type === "PERCENTAGE" ? "20" : "300"}
                      className="h-9 pl-7 rounded-xl border-zinc-300 font-bold font-mono text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Order Spend & Max Redemptions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Min Order Spend (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="Optional (e.g. 2000)"
                    className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Usage Cap (Max Uses)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Optional (e.g. 100)"
                    className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                  />
                </div>
              </div>

              {/* Expiry Date with presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Expiration Date</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-zinc-400 mr-0.5">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(7)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(30)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      +30d
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiresAt("")}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      No Expiry
                    </button>
                  </div>
                </div>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                />
              </div>

              {/* Live Preview Pill */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-mono font-black text-xs">
                    {code || "PROMO-CODE"}
                  </span>
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">
                      {value ? (type === "PERCENTAGE" ? `${value}% OFF` : `৳${value} OFF`) : "Discount Value"}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {minOrder ? `Min cart ৳${Number(minOrder).toLocaleString()}` : "No minimum spend required"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready to Publish
                </span>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm"
                disabled={submitting}
              >
                {submitting ? "Saving Coupon…" : "Create & Activate Coupon"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Coupon Code</TableHead>
              <TableHead className="text-zinc-700 font-bold">Discount</TableHead>
              <TableHead className="text-zinc-700 font-bold">Conditions</TableHead>
              <TableHead className="text-zinc-700 font-bold">Redemptions & Cap</TableHead>
              <TableHead className="text-zinc-700 font-bold">Status & Expiry</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-400 text-xs">
                  No coupons found. Click "Create Coupon Code" to set up your first promo campaign.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => {
                const isExpired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false
                const usagePercent = c.maxUses ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : 0

                return (
                  <TableRow key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Code + Share link */}
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          className="font-mono font-black text-xs text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200/80 transition-colors flex items-center gap-1.5 shadow-2xs"
                          title="Click to copy code"
                        >
                          <span>{c.code}</span>
                          <Copy className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyShareLink(c.code)}
                          className="p-1 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Copy shareable shop link with auto-applied coupon"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Discount Value */}
                    <TableCell className="font-mono font-bold text-zinc-900">
                      {c.type === "PERCENTAGE" ? `${c.value}% OFF` : `৳${Number(c.value).toLocaleString()} OFF`}
                    </TableCell>

                    {/* Conditions */}
                    <TableCell className="text-zinc-600">
                      {c.minOrderAmount ? (
                        <span className="font-mono text-[11px]">
                          Min spend: <strong>৳{Number(c.minOrderAmount).toLocaleString()}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">No minimum</span>
                      )}
                    </TableCell>

                    {/* Redemptions progress */}
                    <TableCell>
                      <div className="space-y-1 w-32">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>{c.usedCount} used</span>
                          <span>{c.maxUses ? `/ ${c.maxUses}` : "(∞)"}</span>
                        </div>
                        {c.maxUses ? (
                          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent >= 90 ? "bg-rose-500" : "bg-indigo-600"
                              )}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Status & Expiry */}
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          {isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                              Expired
                            </span>
                          ) : c.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {c.expiresAt ? `Exp: ${new Date(c.expiresAt).toLocaleDateString()}` : "Never expires"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(c.id, c.isActive, c.code)}
                          className={cn(
                            "h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer",
                            c.isActive
                              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {c.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
