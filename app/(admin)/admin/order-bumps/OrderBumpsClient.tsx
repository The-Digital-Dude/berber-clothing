"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Sparkles, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight,
  Save,
  Package
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Product = { id: string; name: string }
type OrderBump = {
  id: string
  productId: string
  headline: string
  description: string | null
  discountPct: number
  triggerMinTotal: number | null
  isActive: boolean
  sortOrder: number
  product: { id: string; name: string; price: number; images: { url: string }[] }
}

function emptyForm() {
  return {
    productId: "",
    headline: "",
    description: "",
    discountPct: "0",
    triggerMinTotal: "",
    isActive: true,
    sortOrder: 0,
  }
}

export default function OrderBumpsClient({
  data,
  products,
}: {
  data: OrderBump[]
  products: Product[]
}) {
  const [bumps, setBumps] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OrderBump | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = bumps.length
    const active = bumps.filter((b) => b.isActive).length
    const discounted = bumps.filter((b) => Number(b.discountPct) > 0).length
    return { total, active, discounted }
  }, [bumps])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(b: OrderBump) {
    setEditing(b)
    setForm({
      productId: b.productId,
      headline: b.headline,
      description: b.description || "",
      discountPct: b.discountPct.toString(),
      triggerMinTotal: b.triggerMinTotal?.toString() || "",
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.productId || !form.headline.trim()) {
      toast.error("Target product and headline offer are required")
      return
    }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/order-bumps/${editing.id}` : "/api/admin/order-bumps"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save order bump")
      toast.success(editing ? "Order bump updated" : "Order bump created")
      setOpen(false)
      const listRes = await fetch("/api/admin/order-bumps")
      setBumps(await listRes.json())
    } catch (e: any) {
      toast.error(e.message || "Failed to save order bump")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this order bump?")) return
    try {
      await fetch(`/api/admin/order-bumps/${id}`, { method: "DELETE" })
      toast.success("Order bump deleted")
      setBumps((bs) => bs.filter((b) => b.id !== id))
    } catch {
      toast.error("Failed to delete order bump")
    }
  }

  async function toggleActive(b: OrderBump) {
    const updated = !b.isActive
    setBumps((bs) => bs.map((x) => (x.id === b.id ? { ...x, isActive: updated } : x)))
    try {
      await fetch(`/api/admin/order-bumps/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, isActive: updated }),
      })
      toast.success(`Order bump ${updated ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const filtered = useMemo(() => {
    return bumps.filter((b) => {
      if (search) {
        const q = search.toLowerCase()
        const matchProduct = b.product.name.toLowerCase().includes(q)
        const matchHead = b.headline.toLowerCase().includes(q)
        if (!matchProduct && !matchHead) return false
      }
      return true
    })
  }, [bumps, search])

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Bumps</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Configured upsell offers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active at Checkout</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.active}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Live 1-click offers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Discounted Deals</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.discounted}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">With exclusive checkout markdown</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Catalog Pool</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{products.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Eligible active products</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search bump offer or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Order Bump
        </button>
      </div>

      {/* Bumps Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Upsell Product</th>
                <th className="px-4 py-3.5">Promotional Headline</th>
                <th className="px-4 py-3.5">Impulse Discount</th>
                <th className="px-4 py-3.5">Min Cart Subtotal</th>
                <th className="px-4 py-3.5">Active</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No checkout order bumps found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click &ldquo;New Order Bump&rdquo; to configure a 1-click upsell.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span>{b.product.name}</span>
                        <span className="text-[11px] font-mono text-zinc-600 font-medium">৳{Number(b.product.price).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900 truncate max-w-[240px]">{b.headline}</div>
                      {b.description && (
                        <div className="text-[11px] text-zinc-600 truncate max-w-[240px] mt-0.5">{b.description}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {b.discountPct > 0 ? (
                        <span className="font-mono font-bold text-emerald-700 text-xs">
                          {b.discountPct}% OFF
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-medium">Regular price</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-zinc-800">
                      {b.triggerMinTotal ? `&ge; ৳${Number(b.triggerMinTotal).toLocaleString()}` : "Any cart amount"}
                    </td>

                    <td className="px-4 py-3.5">
                      <Switch
                        checked={b.isActive}
                        onCheckedChange={() => toggleActive(b)}
                      />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                          title="Edit order bump"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete order bump"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{bumps.length}</strong> order bumps
          </span>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>{editing ? "Edit Order Bump" : "Create Checkout Order Bump"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Target Upsell Product *</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                <option value="">— Select eligible product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Call-To-Action Headline *</label>
              <input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. Add premium cotton socks for only ৳150!"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Short Description (Optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Breathable combed cotton, 3-pack assortment"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Exclusive Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPct}
                  onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Min Cart Total (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={form.triggerMinTotal}
                  onChange={(e) => setForm({ ...form, triggerMinTotal: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <span className="text-xs font-semibold text-zinc-800">Display Live at Checkout</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving Offer…" : editing ? "Update Order Bump" : "Deploy Checkout Order Bump"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
