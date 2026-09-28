"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Percent, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  ShoppingBag, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Save
} from "lucide-react"
import { cn } from "@/lib/utils"

const RULE_LABELS: Record<string, { label: string; desc: string }> = {
  SPEND_X_GET_PERCENT: {
    label: "Cart Spend Threshold",
    desc: "Applies when total cart value reaches target amount",
  },
  BUY_X_GET_PERCENT: {
    label: "Same Product Quantity",
    desc: "Applies when customer buys X units of a single product",
  },
  BUY_X_ITEMS_GET_PERCENT: {
    label: "Total Cart Items Count",
    desc: "Applies when customer has X total items in cart",
  },
}

type AutoDiscount = {
  id: string
  name: string
  ruleType: string
  thresholdQty: number | null
  thresholdAmt: number | null
  discountPct: number
  isActive: boolean
  endsAt: string | null
}

export function AutoDiscountClient({ data }: { data: AutoDiscount[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [ruleType, setRuleType] = useState("SPEND_X_GET_PERCENT")
  const [thresholdQty, setThresholdQty] = useState("")
  const [thresholdAmt, setThresholdAmt] = useState("")
  const [discountPct, setDiscountPct] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = data.length
    const active = data.filter((d) => d.isActive).length
    const spendRules = data.filter((d) => d.ruleType === "SPEND_X_GET_PERCENT").length
    const qtyRules = data.filter((d) => d.ruleType !== "SPEND_X_GET_PERCENT").length
    return { total, active, spendRules, qtyRules }
  }, [data])

  function ruleHint() {
    if (ruleType === "BUY_X_GET_PERCENT") return "Minimum quantity of the same product"
    if (ruleType === "SPEND_X_GET_PERCENT") return "Minimum cart subtotal (৳)"
    return "Minimum total items across cart"
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !discountPct) {
      toast.error("Rule name and discount percentage are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/auto-discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ruleType,
          thresholdQty: ruleType !== "SPEND_X_GET_PERCENT" ? parseInt(thresholdQty) || null : null,
          thresholdAmt: ruleType === "SPEND_X_GET_PERCENT" ? parseFloat(thresholdAmt) || null : null,
          discountPct: parseFloat(discountPct),
          endsAt: endsAt || null,
        }),
      })
      if (res.ok) {
        toast.success("Automatic discount rule created")
        setOpen(false)
        setName("")
        setThresholdQty("")
        setThresholdAmt("")
        setDiscountPct("")
        setEndsAt("")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to create discount rule")
      }
    } catch {
      toast.error("Error creating discount rule")
    } finally {
      setSaving(false)
    }
  }

  async function toggle(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/auto-discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      })
      if (res.ok) {
        toast.success(`Discount rule ${!current ? "enabled" : "disabled"}`)
        router.refresh()
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function del(id: string) {
    if (!confirm("Are you sure you want to delete this auto discount rule?")) return
    try {
      const res = await fetch(`/api/admin/auto-discounts/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Discount rule deleted")
        router.refresh()
      }
    } catch {
      toast.error("Failed to delete rule")
    }
  }

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = d.name.toLowerCase().includes(q)
        const matchType = (RULE_LABELS[d.ruleType]?.label || d.ruleType).toLowerCase().includes(q)
        if (!matchName && !matchType) return false
      }
      return true
    })
  }, [data, search])

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Rules</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Configured auto discounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Rules</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.active}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Applying in customer carts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Spend Thresholds</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.spendRules}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Basket size boosters</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Quantity Tiers</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.qtyRules}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Volume discounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search rule name or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Auto Discount
        </button>
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Rule Name</th>
                <th className="px-4 py-3.5">Condition Type</th>
                <th className="px-4 py-3.5">Trigger Threshold</th>
                <th className="px-4 py-3.5">Cart Markdown</th>
                <th className="px-4 py-3.5">Expiration</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Percent className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No automatic discounts configured</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click &ldquo;New Auto Discount&rdquo; to create a cart rule.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-zinc-900">
                      {d.name}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {RULE_LABELS[d.ruleType]?.label || d.ruleType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-medium text-zinc-800">
                      {d.ruleType === "SPEND_X_GET_PERCENT" ? (
                        <span>Subtotal &ge; ৳{d.thresholdAmt?.toLocaleString()}</span>
                      ) : (
                        <span>Qty &ge; {d.thresholdQty} units</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700 text-xs">
                      {d.discountPct}% OFF
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                      {d.endsAt
                        ? new Date(d.endsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No expiration"}
                    </td>

                    <td className="px-4 py-3.5">
                      <Switch
                        checked={d.isActive}
                        onCheckedChange={() => toggle(d.id, d.isActive)}
                      />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => del(d.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{data.length}</strong> auto discount rules
          </span>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Percent className="w-4 h-4 text-zinc-900" />
              <span>Create Automatic Cart Discount</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Rule Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spend ৳3,000 Get 10% Off Everything"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Rule Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              >
                {Object.entries(RULE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">{ruleHint()} *</label>
              {ruleType === "SPEND_X_GET_PERCENT" ? (
                <input
                  required
                  type="number"
                  min="1"
                  value={thresholdAmt}
                  onChange={(e) => setThresholdAmt(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              ) : (
                <input
                  required
                  type="number"
                  min="1"
                  value={thresholdQty}
                  onChange={(e) => setThresholdQty(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Discount Percentage (%) *</label>
              <input
                required
                type="number"
                min="1"
                max="100"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Expiration Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Deploying Rule…" : "Save & Activate Auto Discount"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
