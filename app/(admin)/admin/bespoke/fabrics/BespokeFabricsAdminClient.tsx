"use client"

import { useState, useRef } from "react"
import {
  Palette,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Layers,
  AlertTriangle,
  RefreshCw,
  Eye,
  Building,
  Sparkles,
  Upload,
  Scissors,
  Loader2,
  ArrowUpRight,
  Minus,
  Check,
} from "lucide-react"
import { toast } from "sonner"

type Fabric = {
  id: string
  name: string
  code: string
  millName: string | null
  composition: string
  superCount: string | null
  weightGsm: number | null
  pattern: string
  colorHex: string
  textureImageUrl: string
  swatchImageUrl: string
  pricePerMeter: number
  stockMeters: number
  isAvailable: boolean
  season: string | null
  createdAt: string
}

export default function BespokeFabricsAdminClient({
  initialFabrics = [],
}: {
  initialFabrics: Fabric[]
}) {
  const [fabrics, setFabrics] = useState<Fabric[]>(initialFabrics)
  const [search, setSearch] = useState("")
  const [seasonFilter, setSeasonFilter] = useState("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Form State
  const [form, setForm] = useState({
    name: "",
    code: "",
    millName: "",
    composition: "100% Australian Merino Wool",
    superCount: "Super 150s",
    weightGsm: "280",
    pattern: "Solid Twill",
    colorHex: "#1a2436",
    textureImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: "3500",
    stockMeters: "50",
    isAvailable: true,
    season: "All Season",
  })

  const reloadData = async () => {
    try {
      const url = new URL("/api/admin/bespoke/fabrics", window.location.origin)
      if (seasonFilter !== "ALL") url.searchParams.set("season", seasonFilter)
      if (search) url.searchParams.set("search", search)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.fabrics) setFabrics(data.fabrics)
    } catch {
      toast.error("Failed to reload fabrics")
    }
  }

  const openAddModal = () => {
    setEditingFabric(null)
    setForm({
      name: "",
      code: `VBC-${Math.floor(100 + Math.random() * 900)}`,
      millName: "Vitale Barberis Canonico (Italy)",
      composition: "100% Australian Merino Wool",
      superCount: "Super 150s",
      weightGsm: "280",
      pattern: "Solid Twill",
      colorHex: "#1a2436",
      textureImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
      swatchImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=300&auto=format&fit=crop",
      pricePerMeter: "3500",
      stockMeters: "50",
      isAvailable: true,
      season: "All Season",
    })
    setIsModalOpen(true)
  }

  const openEditModal = (f: Fabric) => {
    setEditingFabric(f)
    setForm({
      name: f.name,
      code: f.code,
      millName: f.millName || "",
      composition: f.composition,
      superCount: f.superCount || "Super 150s",
      weightGsm: f.weightGsm?.toString() || "280",
      pattern: f.pattern,
      colorHex: f.colorHex,
      textureImageUrl: f.textureImageUrl,
      swatchImageUrl: f.swatchImageUrl,
      pricePerMeter: f.pricePerMeter.toString(),
      stockMeters: f.stockMeters.toString(),
      isAvailable: f.isAvailable,
      season: f.season || "All Season",
    })
    setIsModalOpen(true)
  }

  // Handle Direct Swatch Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "bespoke-fabrics")

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      const uploadedUrl = data.url
      setForm((prev) => ({
        ...prev,
        textureImageUrl: uploadedUrl,
        swatchImageUrl: uploadedUrl,
      }))
      toast.success("Cloth swatch & texture uploaded successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code || !form.pricePerMeter) {
      toast.error("Please fill in required fields.")
      return
    }

    setIsSaving(true)
    try {
      const url = "/api/admin/bespoke/fabrics"
      const method = editingFabric ? "PATCH" : "POST"
      const payload = editingFabric ? { id: editingFabric.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")

      toast.success(editingFabric ? "Cloth specifications updated" : "New bespoke cloth registered")
      setIsModalOpen(false)
      reloadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save fabric")
    } finally {
      setIsSaving(false)
    }
  }

  // In-table Quick Stock Adjustment
  const handleAdjustStock = async (id: string, deltaStock: number) => {
    setUpdatingStockId(id)
    try {
      const res = await fetch("/api/admin/bespoke/fabrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deltaStock }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to adjust stock")

      setFabrics((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data.fabric } : item))
      )

      if (deltaStock > 0) {
        toast.success(`+${deltaStock}m bolt added to running stock`)
      } else {
        toast.success(`${deltaStock}m deducted for suit cut`)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock")
    } finally {
      setUpdatingStockId(null)
    }
  }

  const handleToggleAvailability = async (f: Fabric) => {
    try {
      const res = await fetch("/api/admin/bespoke/fabrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, isAvailable: !f.isAvailable }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(!f.isAvailable ? `${f.name} marked Active in Studio` : `${f.name} hidden from studio`)
      setFabrics((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, isAvailable: !f.isAvailable } : item))
      )
    } catch {
      toast.error("Failed to toggle availability")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return
    try {
      const res = await fetch(`/api/admin/bespoke/fabrics?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Fabric removed")
      setFabrics((prev) => prev.filter((item) => item.id !== id))
    } catch {
      toast.error("Failed to remove fabric")
    }
  }

  const filtered = fabrics.filter((f) => {
    const matchSeason = seasonFilter === "ALL" || (f.season && f.season.toLowerCase().includes(seasonFilter.toLowerCase()))
    const matchSearch =
      search === "" ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      (f.millName && f.millName.toLowerCase().includes(search.toLowerCase()))
    return matchSeason && matchSearch
  })

  const lowStockCount = fabrics.filter((f) => f.stockMeters > 0 && f.stockMeters < 15).length
  const depletedCount = fabrics.filter((f) => f.stockMeters <= 0).length
  const activeCount = fabrics.filter((f) => f.isAvailable).length

  return (
    <div className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-500" />
            European Mill Fabric & Swatch Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage mill cloth catalogs, running meter stock, suit yield estimations, and studio swatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition shadow-sm bg-white dark:bg-neutral-900"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Mill Cloth
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Fabrics</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{fabrics.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 uppercase">Active in Studio</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase">Low Stock (&lt;15m)</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockCount}</p>
            {depletedCount > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                {depletedCount} Depleted
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-blue-500 uppercase">Average Price/Meter</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            ৳
            {fabrics.length > 0
              ? Math.round(fabrics.reduce((s, f) => s + Number(f.pricePerMeter), 0) / fabrics.length).toLocaleString()
              : 0}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by cloth name, code, or mill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Seasons</option>
            <option value="All Season">All Season</option>
            <option value="Summer">Summer / Destination</option>
            <option value="Winter">Winter / Gala</option>
          </select>
        </div>
      </div>

      {/* Fabrics Grid / Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No fabrics found matching the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Swatch & Code</th>
                  <th className="py-3.5 px-4">Cloth Name & Mill</th>
                  <th className="py-3.5 px-4">Composition & Count</th>
                  <th className="py-3.5 px-4">Price / Meter</th>
                  <th className="py-3.5 px-4">Running Stock & Yield</th>
                  <th className="py-3.5 px-4">Quick Adjust</th>
                  <th className="py-3.5 px-4">Studio Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filtered.map((item) => {
                  const stock = Number(item.stockMeters)
                  const twoPieceYield = Math.floor(stock / 3.25)
                  const threePieceYield = Math.floor(stock / 3.85)
                  const isUpdating = updatingStockId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-950/50 transition">
                      {/* Swatch & Code */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-lg border border-gray-300 dark:border-neutral-700 shadow-inner shrink-0 overflow-hidden relative"
                            style={{ backgroundColor: item.colorHex }}
                          >
                            {item.swatchImageUrl && (
                              <img
                                src={item.swatchImageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover mix-blend-multiply opacity-80"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-gray-900 dark:text-white text-xs">
                              {item.code}
                            </div>
                            <div className="text-[10px] text-gray-400">{item.pattern}</div>
                          </div>
                        </div>
                      </td>

                      {/* Name & Mill */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {item.millName || "European Mill"}
                        </div>
                      </td>

                      {/* Composition */}
                      <td className="py-4 px-4">
                        <span className="text-xs text-gray-700 dark:text-neutral-300 block">
                          {item.composition}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {item.superCount || "Fine Weave"} • {item.weightGsm || 280}gsm
                        </span>
                      </td>

                      {/* Price / Meter */}
                      <td className="py-4 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        ৳{Number(item.pricePerMeter).toLocaleString()}
                      </td>

                      {/* Running Stock & Yield */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              stock <= 0
                                ? "bg-red-500/10 text-red-500 border-red-500/30"
                                : stock < 15
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {stock < 15 && <AlertTriangle className="w-3 h-3" />}
                            {stock.toFixed(1)} Meters
                          </span>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            ≈ {twoPieceYield} Two-Piece / {threePieceYield} Three-Piece
                          </div>
                        </div>
                      </td>

                      {/* Quick Bolt Adjusters */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(item.id, -3.5)}
                            disabled={isUpdating || stock < 3.5}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold transition disabled:opacity-30"
                            title="Deduct 1 Suit Cut (-3.5m)"
                          >
                            <span className="flex items-center gap-1 text-[11px]">
                              <Scissors className="w-3 h-3 text-amber-500" />
                              -3.5m
                            </span>
                          </button>

                          <button
                            onClick={() => handleAdjustStock(item.id, 10)}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold transition disabled:opacity-30"
                            title="Restock Bolt (+10m)"
                          >
                            <span className="flex items-center gap-1 text-[11px]">
                              <Plus className="w-3 h-3 text-emerald-500" />
                              +10m
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Studio Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                            item.isAvailable
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"
                          }`}
                        >
                          {item.isAvailable ? "Active in Studio" : "Hidden"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 transition"
                            title="Edit cloth details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                            title="Delete cloth"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-3xl w-full p-6 md:p-8 space-y-5 text-gray-900 dark:text-white shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                {editingFabric ? "Edit Mill Cloth Specifications" : "Register New European Mill Cloth"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Top Swatch Upload Dropzone & Color Picker */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Visual Swatch Preview Box */}
                <div
                  className="w-24 h-24 rounded-2xl border-2 border-gray-300 dark:border-neutral-700 shadow-md shrink-0 overflow-hidden relative flex items-center justify-center"
                  style={{ backgroundColor: form.colorHex }}
                >
                  {form.swatchImageUrl ? (
                    <img
                      src={form.swatchImageUrl}
                      alt="Swatch Preview"
                      className="w-full h-full object-cover mix-blend-multiply opacity-80"
                    />
                  ) : (
                    <Palette className="w-8 h-8 text-white/50" />
                  )}
                </div>

                {/* Upload Action & Dropzone */}
                <div className="flex-1 space-y-2 text-left w-full">
                  <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
                    Macro Weave Swatch & Texture Upload
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                    Upload a high-resolution cloth swatch or woven texture (PNG, JPG, WEBP).
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{isUploading ? "Uploading to Cloud..." : "Upload Cloth Image"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-gray-400">Color Hex:</label>
                      <input
                        type="color"
                        value={form.colorHex}
                        onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.colorHex}
                        onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                        className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloth Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Cloth Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Midnight Navy Super 150s"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Cloth Code (Unique) *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VBC-150-NVY"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Mill Name & Origin</label>
                <input
                  type="text"
                  value={form.millName}
                  onChange={(e) => setForm({ ...form, millName: e.target.value })}
                  placeholder="e.g. Vitale Barberis Canonico (Italy)"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Composition *</label>
                <input
                  type="text"
                  required
                  value={form.composition}
                  onChange={(e) => setForm({ ...form, composition: e.target.value })}
                  placeholder="e.g. 100% Australian Merino Wool"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Super Count</label>
                <input
                  type="text"
                  value={form.superCount}
                  onChange={(e) => setForm({ ...form, superCount: e.target.value })}
                  placeholder="e.g. Super 150s"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Weight (GSM)</label>
                <input
                  type="number"
                  value={form.weightGsm}
                  onChange={(e) => setForm({ ...form, weightGsm: e.target.value })}
                  placeholder="e.g. 280"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Weave Pattern</label>
                <input
                  type="text"
                  value={form.pattern}
                  onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                  placeholder="e.g. Solid Twill, Herringbone, Glen Plaid"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Season</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5"
                >
                  <option value="All Season">All Season</option>
                  <option value="Summer / Lightweight">Summer / Lightweight</option>
                  <option value="Winter / Flannel">Winter / Flannel</option>
                  <option value="Evening / Black Tie">Evening / Black Tie</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Price per Meter (BDT) *</label>
                <input
                  type="number"
                  required
                  value={form.pricePerMeter}
                  onChange={(e) => setForm({ ...form, pricePerMeter: e.target.value })}
                  placeholder="3500"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Bolt Running Stock (Meters) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={form.stockMeters}
                  onChange={(e) => setForm({ ...form, stockMeters: e.target.value })}
                  placeholder="50"
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>

            {/* Custom URLs Fallback */}
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-neutral-800 text-xs">
              <div>
                <label className="font-semibold text-gray-500 block mb-1">Texture Image URL (CDN / Direct)</label>
                <input
                  type="url"
                  value={form.textureImageUrl}
                  onChange={(e) => setForm({ ...form, textureImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-[11px] font-mono"
                />
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="isAvailable" className="text-xs font-semibold">
                Active in Bespoke Studio Customizer
              </label>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition shadow-sm"
              >
                {isSaving ? "Saving..." : editingFabric ? "Update Cloth Specs" : "Register Cloth"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
