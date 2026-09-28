"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import AdminPagination from "@/components/admin/AdminPagination"

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
})

interface AffiliatesClientProps {
  data: Affiliate[]
  coupons: CouponOption[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentType: string
}

export default function AffiliatesClient({
  data,
  coupons,
  pagination,
  currentSearch,
  currentType,
}: AffiliatesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentSearch)
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/affiliates?${params.toString()}`, { scroll: false })
  }

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type && type !== "ALL") {
      params.set("type", type)
    } else {
      params.delete("type")
    }
    params.set("page", "1")
    router.push(`/admin/affiliates?${params.toString()}`, { scroll: false })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setOpenModal(true)
  }

  const openEdit = (a: Affiliate) => {
    setEditingId(a.id)
    setForm({
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      code: a.code,
      partnerType: a.partnerType || "AFFILIATE",
      status: a.status || "APPROVED",
      commissionType: a.commissionType,
      commissionValue: a.commissionValue.toString(),
      resellerDiscountPct: a.resellerDiscountPct?.toString() || "15",
      couponId: a.couponId || "",
    })
    setOpenModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId ? `/api/admin/affiliates/${editingId}` : `/api/admin/affiliates`
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionValue: parseFloat(form.commissionValue) || 0,
          resellerDiscountPct: parseFloat(form.resellerDiscountPct) || 15,
          couponId: form.couponId ? form.couponId : null,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }

      toast.success(editingId ? "Partner updated successfully" : "Partner created successfully")
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: current }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Status updated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete partner "${name}"?`)) return

    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete partner")
      toast.success("Partner deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const copyRefLink = (code: string) => {
    const url = `${window.location.origin}/shop?ref=${code}`
    navigator.clipboard.writeText(url)
    toast.success("Referral URL copied to clipboard!")
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search name, code, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-zinc-50/60 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {[
              { key: "ALL", label: "All" },
              { key: "AFFILIATE", label: "Affiliates" },
              { key: "INFLUENCER", label: "Influencers" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTypeChange(t.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentType === t.key || (!currentType && t.key === "ALL")
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={openCreate}
            className="h-9 px-3.5 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Partner</span>
          </Button>
        </div>
      </div>

      {/* Modal Drawer */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900">
              {editingId ? "Edit Partner Profile" : "Register New Partner / Influencer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Full Name</label>
              <Input
                required
                placeholder="e.g. Nusrat Jahan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="nusrat@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Phone</label>
                <Input
                  placeholder="01711000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Referral Code</label>
                <Input
                  required
                  placeholder="NUSRAT10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                  className="h-9 text-xs font-mono uppercase rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Partner Type</label>
                <select
                  value={form.partnerType}
                  onChange={(e) => setForm({ ...form, partnerType: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="AFFILIATE">Standard Affiliate</option>
                  <option value="INFLUENCER">Social Influencer</option>
                  <option value="RESELLER">Reseller</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Commission Model</label>
                <select
                  value={form.commissionType}
                  onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (৳)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Commission Rate</label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={form.commissionType === "PERCENTAGE" ? "10" : "150"}
                  value={form.commissionValue}
                  onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span>Linked Exclusive Coupon (Optional)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Auto-tracks sales with this code</span>
              </label>
              <select
                value={form.couponId}
                onChange={(e) => setForm({ ...form, couponId: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="">-- No Linked Coupon (Link Tracking Only) --</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} ({c.type === "PERCENTAGE" ? `${c.value}% OFF` : `৳${c.value} OFF`})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModal(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
              >
                {loading ? "Saving…" : editingId ? "Update Partner" : "Register Partner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Partners Table Card */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
              <TableHead className="text-xs font-bold text-zinc-700 pl-5">Partner</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Type & Code</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Commission Rate</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Linked Coupon</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Clicks / Orders</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Earnings & Balance</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Active</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100 text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-zinc-400">
                  <Users2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-zinc-600">No affiliate partners found</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Click "Add Partner" to register an affiliate or influencer</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((a) => (
                <TableRow key={a.id} className="hover:bg-zinc-50/70 transition-colors">
                  <TableCell className="pl-5 font-medium text-zinc-900">
                    <div>
                      <p className="font-bold text-xs">{a.name}</p>
                      <p className="text-[11px] text-zinc-500">{a.email}</p>
                      {a.phone && <p className="text-[10px] text-zinc-400 font-mono">{a.phone}</p>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {a.partnerType || "AFFILIATE"}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-900">
                        <span>{a.code}</span>
                        <button
                          onClick={() => copyRefLink(a.code)}
                          className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded"
                          title="Copy referral link"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      {a.commissionType === "PERCENTAGE" ? `${a.commissionValue}%` : `৳${a.commissionValue}`}
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

        {/* AdminPagination at table bottom */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            basePath="/admin/affiliates"
          />
        </div>
      </div>
    </div>
  )
}
