"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Sparkles,
  Link as LinkIcon,
  TrendingUp,
  Search,
  Filter,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import AdminPagination from "@/components/admin/AdminPagination"

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

interface CouponClientProps {
  data: Coupon[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentStatus: string
}

export function CouponClient({
  data,
  pagination,
  currentSearch,
  currentStatus,
}: CouponClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
  const [search, setSearch] = useState(currentSearch)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/coupons?${params.toString()}`, { scroll: false })
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "ALL") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/admin/coupons?${params.toString()}`, { scroll: false })
  }

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

  return (
    <div className="space-y-6">
      {/* Top Search & Filter & Create Row */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search promo code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-zinc-50/60 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0">
            {[
              { key: "ALL", label: "All Codes" },
              { key: "ACTIVE", label: "Active" },
              { key: "EXPIRED", label: "Expired" },
              { key: "DISABLED", label: "Disabled" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleStatusFilter(tab.key)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                  currentStatus === tab.key || (!currentStatus && tab.key === "ALL")
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer shrink-0"><Plus className="w-3.5 h-3.5" /> Create Coupon</Button>} />
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
                        onClick={() => setCode("WELCOME5")}
                        className="text-[10px] text-zinc-500 hover:text-zinc-900"
                      >
                        WELCOME5
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
                    <Input
                      required
                      type="number"
                      min="1"
                      step="0.1"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={type === "PERCENTAGE" ? "e.g. 15 (for 15%)" : "e.g. 300 (for ৳300)"}
                      className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs"
                    />
                  </div>
                </div>

                {/* Min Order & Max Uses */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold uppercase tracking-wider text-zinc-600">
                      Min. Cart Spend (৳)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      placeholder="Optional, e.g. 1500"
                      className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold uppercase tracking-wider text-zinc-600">
                      Total Usage Cap
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Optional, e.g. 100"
                      className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? "Saving Coupon…" : "Create & Activate Coupon"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  No coupons found. Click "Create Coupon" to set up your first promo campaign.
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
                          title="Copy direct share link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Discount Value */}
                    <TableCell>
                      <span className="font-bold text-zinc-900 font-mono text-xs">
                        {c.type === "PERCENTAGE" ? `${c.value}% OFF` : `৳${c.value} OFF`}
                      </span>
                    </TableCell>

                    {/* Conditions */}
                    <TableCell>
                      <span className="text-zinc-600 text-[11px]">
                        {c.minOrderAmount ? `Min. ৳${c.minOrderAmount.toLocaleString()}` : "No min. spend"}
                      </span>
                    </TableCell>

                    {/* Usage */}
                    <TableCell>
                      <div className="space-y-1 max-w-[120px]">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-zinc-900">{c.usedCount}</span>
                          <span className="text-zinc-400">/ {c.maxUses ?? "∞"}</span>
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

        {/* AdminPagination at table bottom */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            basePath="/admin/coupons"
          />
        </div>
      </div>
    </div>
  )
}
