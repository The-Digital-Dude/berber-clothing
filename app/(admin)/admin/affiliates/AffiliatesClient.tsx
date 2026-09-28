"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Copy,
  Trash2,
  Search,
  Users2,
  Pencil,
  Sparkles,
  ExternalLink,
  Share2,
} from "lucide-react"

type Affiliate = {
  id: string
  name: string
  email: string
  phone?: string | null
  code: string
  partnerType: string
  status: string
  commissionType: string
  commissionValue: number
  resellerDiscountPct: number
  couponId?: string | null
  coupon?: { id: string; code: string; value: number; type: string } | null
  totalEarned: number
  totalPaid: number
  walletBalance: number
  isActive: boolean
  createdAt: string
  _count: { clicks: number; conversions: number; resellerOrders?: number }
}

type CouponOption = {
  id: string
  code: string
  value: number
  type: string
}

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  code: "",
  partnerType: "AFFILIATE",
  status: "APPROVED",
  commissionType: "PERCENTAGE",
  commissionValue: "10",
  resellerDiscountPct: "15",
  couponId: "",
  isActive: true,
})

export default function AffiliatesClient({
  data,
  coupons = [],
}: {
  data: Affiliate[]
  coupons?: CouponOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(a: Affiliate) {
    setEditingId(a.id)
    setForm({
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      code: a.code,
      partnerType: a.partnerType || "AFFILIATE",
      status: a.status || "APPROVED",
      commissionType: a.commissionType || "PERCENTAGE",
      commissionValue: String(a.commissionValue || 10),
      resellerDiscountPct: String(a.resellerDiscountPct || 15),
      couponId: a.couponId || "",
      isActive: a.isActive,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/affiliates/${editingId}` : "/api/admin/affiliates"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionValue: Number(form.commissionValue),
          resellerDiscountPct: Number(form.resellerDiscountPct),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editingId ? "Affiliate updated" : "Affiliate created")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete affiliate "${name}"?`)) return
    await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" })
    toast.success("Affiliate deleted")
    router.refresh()
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
    if (res.ok) {
      toast.success("Status updated")
      router.refresh()
    } else {
      toast.error("Failed to update")
    }
  }

  function copyLink(code: string) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${code}`
    navigator.clipboard.writeText(url)
    toast.success("Referral link copied!")
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, code…"
            className="pl-9 h-9 text-xs rounded-xl bg-white border-zinc-200"
          />
        </div>

        <Button
          onClick={openAdd}
          className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Partner
        </Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-amber-600" />
              <span>{editingId ? "Edit Partner Details" : "New Affiliate / Partner"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Full Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Rakib Hasan"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Phone Number</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Email Address *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="partner@example.com"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Referral Code (Unique) *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="RAKIB10"
                required
                className="h-9 text-xs font-mono font-bold uppercase rounded-xl"
              />
              <p className="text-[11px] text-zinc-400 font-mono">Share URL: ...?ref={form.code || "CODE"}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Commission Type</label>
                <select
                  value={form.commissionType}
                  onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                  className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (৳)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Commission Value</label>
                <Input
                  type="number"
                  value={form.commissionValue}
                  onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                  className="h-9 text-xs font-mono font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Link Exclusive Coupon */}
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Linked Influencer Coupon (Optional)</label>
              <select
                value={form.couponId}
                onChange={(e) => setForm({ ...form, couponId: e.target.value })}
                className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800"
              >
                <option value="">No exclusive coupon linked</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} ({c.type === "PERCENTAGE" ? `${c.value}% off` : `৳${c.value} off`})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Partner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Partner Details</TableHead>
              <TableHead className="text-zinc-700 font-bold">Referral Code</TableHead>
              <TableHead className="text-zinc-700 font-bold">Commission</TableHead>
              <TableHead className="text-zinc-700 font-bold">Linked Coupon</TableHead>
              <TableHead className="text-zinc-700 font-bold">Clicks / Conv.</TableHead>
              <TableHead className="text-zinc-700 font-bold">Total Earned</TableHead>
              <TableHead className="text-zinc-700 font-bold">Active</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-zinc-400 text-xs">
                  No affiliate partners found. Click &quot;Add Partner&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm">{a.name}</span>
                      <span className="text-zinc-400 text-[11px] block">{a.email}</span>
                      {a.phone && <span className="text-zinc-500 font-mono text-[10px]">{a.phone}</span>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md text-[11px]">
                        {a.code}
                      </span>
                      <button
                        onClick={() => copyLink(a.code)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                        title="Copy Referral Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-zinc-800">
                      {a.commissionValue}
                      {a.commissionType === "PERCENTAGE" ? "%" : " ৳"}
                    </span>
                  </TableCell>

                  <TableCell>
                    {a.coupon ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-900">
                        <Sparkles className="w-2.5 h-2.5" />
                        {a.coupon.code}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[10px]">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-600">{a._count?.clicks || 0} clk</span>
                      <span className="text-zinc-300">/</span>
                      <span className="font-mono font-bold text-zinc-900">{a._count?.conversions || 0} ord</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <span className="font-mono font-bold text-emerald-700 block">
                        ৳{Number(a.totalEarned || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Bal: ৳{Number(a.walletBalance || 0).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={a.isActive}
                      onCheckedChange={(v) => toggleActive(a.id, v)}
                    />
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(a)}
                        className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
                        title="Edit Partner"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(a.id, a.name)}
                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Partner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
