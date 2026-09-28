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
import { Zap, Clock, Trash2, Check, Sparkles, Layers, Eye, Calendar, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

type FlashSale = {
  id: string
  name: string
  discountType: string
  discountValue: number
  scope: string
  targetName: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

function isLive(s: FlashSale) {
  const now = Date.now()
  return (
    s.isActive &&
    new Date(s.startsAt).getTime() <= now &&
    new Date(s.endsAt).getTime() >= now
  )
}

function isExpired(s: FlashSale) {
  return new Date(s.endsAt).getTime() < Date.now()
}

export function FlashSaleClient({
  data,
  products,
  categories,
}: {
  data: FlashSale[]
  products: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [discountType, setDiscountType] = useState("PERCENTAGE")
  const [discountValue, setDiscountValue] = useState("")
  const [scope, setScope] = useState("SITEWIDE")
  const [productId, setProductId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16))
  const [endsAt, setEndsAt] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  )
  const [saving, setSaving] = useState(false)

  // Duration quick presets
  const applyDurationPreset = (hours: number) => {
    const startMs = startsAt ? new Date(startsAt).getTime() : Date.now()
    const targetMs = startMs + hours * 3600 * 1000
    setEndsAt(new Date(targetMs).toISOString().slice(0, 16))
    toast.success(`Set duration to +${hours >= 24 ? `${hours / 24} days` : `${hours} hours`}`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !discountValue || !endsAt) {
      toast.error("Please fill in all required fields.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          discountType,
          discountValue: Number(discountValue),
          scope,
          productId: scope === "PRODUCT" ? productId : null,
          categoryId: scope === "CATEGORY" ? categoryId : null,
          startsAt,
          endsAt,
        }),
      })

      if (res.ok) {
        toast.success("Flash Sale campaign launched successfully!")
        setOpen(false)
        setName("")
        setDiscountValue("")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to create flash sale")
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/flash-sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      toast.success(current ? "Flash sale paused" : "Flash sale activated")
      router.refresh()
    } else {
      toast.error("Failed to update status")
    }
  }

  async function handleDelete(id: string, saleName: string) {
    if (!confirm(`Delete flash sale "${saleName}"?`)) return
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(`"${saleName}" deleted`)
      router.refresh()
    } else {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm h-9 px-4 rounded-xl cursor-pointer"><Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> New Flash Sale Campaign</Button>} />
          <DialogContent className="sm:max-w-xl w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600 fill-amber-400" />
                <span>Launch Flash Sale Campaign</span>
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Time-limited discount event with storefront countdown timer
              </p>
            </DialogHeader>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              {/* Sale Name */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">
                  Campaign / Sale Name
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eid Flash Sale / Midnight Mega Drop"
                  className="h-9 rounded-xl border-zinc-300 font-medium text-xs shadow-2xs"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Discount Mode
                  </label>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v || "PERCENTAGE")}
                  >
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
                    Discount Amount
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-zinc-400 font-bold font-mono">
                      {discountType === "PERCENTAGE" ? "%" : "৳"}
                    </span>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "PERCENTAGE" ? "20" : "250"}
                      className="h-9 pl-7 rounded-xl border-zinc-300 font-bold font-mono text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Target Scope */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">
                  Applies To
                </label>
                <Select value={scope} onValueChange={(v) => setScope(v || "SITEWIDE")}>
                  <SelectTrigger className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SITEWIDE">Entire Store (All Products)</SelectItem>
                    <SelectItem value="CATEGORY">Specific Category Only</SelectItem>
                    <SelectItem value="PRODUCT">Specific Single Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scope === "CATEGORY" && (
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Select Target Category
                  </label>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
                    <SelectTrigger className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scope === "PRODUCT" && (
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">
                    Select Target Product
                  </label>
                  <Select value={productId} onValueChange={(v) => setProductId(v || "")}>
                    <SelectTrigger className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs">
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Schedule Dates & Quick Duration Presets */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Duration & Schedule</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-zinc-400 mr-1">Quick:</span>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(6)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      6h
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(12)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      12h
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(24)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(48)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      48h
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDurationPreset(168)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
                    >
                      7d
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Start Date & Time
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      End Date & Time
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Banner */}
              <div className="p-3 bg-zinc-900 rounded-xl text-white space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Eye className="w-3 h-3" />
                  <span>Storefront Banner Preview</span>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-rose-900 via-rose-700 to-amber-800 text-white text-[11px] font-bold flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Zap className="w-3 h-3 fill-amber-300 text-amber-300 shrink-0" />
                    <span className="truncate">{name || "Flash Sale Campaign"}</span>
                    <span className="text-amber-200 font-extrabold shrink-0">
                      — {discountValue ? (discountType === "PERCENTAGE" ? `${discountValue}% OFF` : `৳${discountValue} OFF`) : "Special Discount"}
                    </span>
                  </div>
                  <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                    ⏳ 23:59:59
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm"
                disabled={saving}
              >
                {saving ? "Launching Campaign…" : "Publish Flash Sale Campaign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Sale Campaign</TableHead>
              <TableHead className="text-zinc-700 font-bold">Discount Rate</TableHead>
              <TableHead className="text-zinc-700 font-bold">Target Scope</TableHead>
              <TableHead className="text-zinc-700 font-bold">Schedule Period</TableHead>
              <TableHead className="text-zinc-700 font-bold">Live Status</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-400 text-xs">
                  No flash sales configured yet. Click above to launch a limited-time sale event.
                </TableCell>
              </TableRow>
            ) : (
              data.map((s) => {
                const live = isLive(s)
                const expired = isExpired(s)

                return (
                  <TableRow key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell className="pl-5 py-3 font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Zap
                          className={cn(
                            "w-4 h-4 shrink-0",
                            live ? "text-rose-600 fill-amber-400 animate-pulse" : "text-zinc-400"
                          )}
                        />
                        <span>{s.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono font-black text-zinc-900 text-xs">
                      {s.discountType === "PERCENTAGE" ? `${s.discountValue}%` : `৳${s.discountValue}`} OFF
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold font-mono text-[11px]">
                        {s.targetName}
                      </span>
                    </TableCell>

                    <TableCell className="text-zinc-500 font-mono text-[11px]">
                      <div>{new Date(s.startsAt).toLocaleDateString()} → {new Date(s.endsAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-400">Ends {new Date(s.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </TableCell>

                    <TableCell>
                      {live ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          Live on Store
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          Expired
                        </span>
                      ) : s.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          Paused
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(s.id, s.isActive)}
                          className={cn(
                            "h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer",
                            s.isActive
                              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {s.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Campaign"
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
