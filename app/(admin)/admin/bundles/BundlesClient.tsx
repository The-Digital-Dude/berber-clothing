"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  X, 
  Search, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle2, 
  Package, 
  Save
} from "lucide-react"
import { toast } from "sonner"
import ImagePicker from "@/components/admin/ImagePicker"
import { cn } from "@/lib/utils"

type Product = { id: string; name: string; price: number; images: { url: string }[] }
type BundleItem = { id: string; productId: string; quantity: number; sortOrder: number; product: Product }
type Bundle = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  type: string
  minItems: number | null
  maxItems: number | null
  isActive: boolean
  items: BundleItem[]
}

const emptyForm = () => ({
  name: "",
  slug: "",
  description: "",
  image: "",
  type: "FIXED",
  minItems: "",
  maxItems: "",
  isActive: true,
  items: [] as { productId: string; quantity: number }[],
})

export default function BundlesClient({
  data,
  products,
}: {
  data: Bundle[]
  products: Product[]
}) {
  const [bundles, setBundles] = useState<Bundle[]>(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bundle | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = bundles.length
    const active = bundles.filter((b) => b.isActive).length
    const totalComboProducts = bundles.reduce((sum, b) => sum + b.items.length, 0)
    return { total, active, totalComboProducts }
  }, [bundles])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(b: Bundle) {
    setEditing(b)
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description || "",
      image: b.image || "",
      type: b.type,
      minItems: b.minItems ? String(b.minItems) : "",
      maxItems: b.maxItems ? String(b.maxItems) : "",
      isActive: b.isActive,
      items: b.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    })
    setOpen(true)
  }

  function addItem() {
    if (products.length === 0) return
    setForm((f) => ({ ...f, items: [...f.items, { productId: products[0].id, quantity: 1 }] }))
  }

  function updateItem(idx: number, field: "productId" | "quantity", val: string) {
    setForm((f) => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: field === "quantity" ? Number(val) : val }
      return { ...f, items }
    })
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Bundle name is required")
      return
    }
    setSaving(true)
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
    try {
      const url = editing ? `/api/admin/bundles/${editing.id}` : "/api/admin/bundles"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save bundle")
      toast.success(editing ? "Bundle updated" : "Bundle created")
      setOpen(false)
      const listRes = await fetch("/api/admin/bundles")
      setBundles(await listRes.json())
    } catch (e: any) {
      toast.error(e.message || "Failed to save bundle")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product bundle?")) return
    try {
      const res = await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Bundle deleted")
      setBundles((bs) => bs.filter((b) => b.id !== id))
    } catch {
      toast.error("Failed to delete bundle")
    }
  }

  const filtered = useMemo(() => {
    return bundles.filter((b) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = b.name.toLowerCase().includes(q)
        const matchSlug = b.slug.toLowerCase().includes(q)
        if (!matchName && !matchSlug) return false
      }
      return true
    })
  }, [bundles, search])

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Bundles</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Combo kit listings</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active in Store</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.active}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Visible on storefront</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Combo Products</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalComboProducts}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">SKU pairings</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Available Products</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{products.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Catalog inventory</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search bundle name or slug…"
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
          Create New Bundle
        </button>
      </div>

      {/* Bundles Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Bundle Information</th>
                <th className="px-4 py-3.5">Bundle Type</th>
                <th className="px-4 py-3.5">Calculated Value</th>
                <th className="px-4 py-3.5">Included Items</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No product bundles found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click &ldquo;Create New Bundle&rdquo; to build a curated package.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const combinedPrice = b.items.reduce(
                    (s, i) => s + Number(i.product.price) * i.quantity,
                    0
                  )

                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-900">
                        <div className="flex items-center gap-3">
                          {b.image ? (
                            <img
                              src={b.image}
                              alt={b.name}
                              className="w-9 h-9 rounded-xl object-cover border border-zinc-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200">
                              <Layers className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-zinc-900">{b.name}</div>
                            <div className="text-[11px] text-zinc-600 font-mono mt-0.5">/shop/bundle/{b.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {b.type === "FIXED" ? "Curated Set" : "Pick-N Custom Choice"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-900 text-xs">
                        ৳{combinedPrice.toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-zinc-800">
                        {b.items.length} item{b.items.length !== 1 ? "s" : ""}
                      </td>

                      <td className="px-4 py-3.5">
                        {b.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/shop/bundle/${b.slug}`}
                            target="_blank"
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                            title="View in storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openEdit(b)}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                            title="Edit bundle"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete bundle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{bundles.length}</strong> bundles
          </span>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Layers className="w-4 h-4 text-zinc-900" />
              <span>{editing ? "Edit Product Bundle" : "Create Product Bundle"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Bundle Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Essentials Set"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Custom URL Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="summer-essentials-set"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Description (Optional)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Bundle highlights, fabric composition, package perks..."
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Bundle Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                >
                  <option value="FIXED">Fixed (Pre-curated package)</option>
                  <option value="PICK_N">Pick-N (Shopper selects N items)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Cover Image</label>
                <ImagePicker
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  bucket="bundle-images"
                />
              </div>
            </div>

            {form.type === "PICK_N" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Min Selectable Items</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minItems}
                    onChange={(e) => setForm({ ...form, minItems: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Max Selectable Items</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxItems}
                    onChange={(e) => setForm({ ...form, maxItems: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Products in bundle */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Products Included in Bundle ({form.items.length})
                </span>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  <Plus className="w-3 h-3" /> Add Product
                </button>
              </div>

              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60">
                    <select
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium bg-white focus:outline-none"
                      value={item.productId}
                      onChange={(e) => updateItem(idx, "productId", e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ৳{Number(p.price).toLocaleString()}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-zinc-600 font-medium">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-14 px-2 py-1 text-center rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition"
                      title="Remove product"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.items.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    No products added yet. Click &ldquo;Add Product&rdquo; above.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <span className="text-xs font-semibold text-zinc-800">Publish Live on Storefront</span>
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
              {saving ? "Saving Bundle…" : editing ? "Update Product Bundle" : "Publish Product Bundle"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
