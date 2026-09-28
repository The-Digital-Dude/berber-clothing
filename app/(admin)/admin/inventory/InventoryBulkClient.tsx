"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  Package, 
  Layers, 
  Filter, 
  Warehouse, 
  TrendingDown,
  X,
  Loader2
} from "lucide-react"
import AdminPagination from "@/components/admin/AdminPagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Variant {
  id: string
  size: string | null
  color: string | null
  stock: number
  price: number
  sku?: string | null
  product: { name: string; slug: string }
}

interface InventoryBulkClientProps {
  variants: Variant[]
  stats: {
    totalSKUs: number
    totalUnits: number
    lowStock: number
    outOfStock: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentStatus: string
}

export default function InventoryBulkClient({
  variants,
  stats,
  pagination,
  currentSearch,
  currentStatus,
}: InventoryBulkClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [initialRows] = useState(variants)
  const [rows, setRows] = useState(variants.map((v) => ({ ...v, dirty: false })))
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null)
  const [search, setSearch] = useState(currentSearch)

  // Dirty guard modal state
  const [guardModalOpen, setGuardModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const dirtyCount = rows.filter((r) => r.dirty).length

  const update = (id: string, field: "stock" | "price", value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        const initial = initialRows.find((i) => i.id === id)
        const isDirty = initial ? initial.stock !== updated.stock || initial.price !== updated.price : true
        return { ...updated, dirty: isDirty }
      })
    )
  }

  const revertAll = () => {
    setRows(initialRows.map((v) => ({ ...v, dirty: false })))
    setResult(null)
  }

  const save = async (onSuccess?: () => void) => {
    const dirty = rows.filter((r) => r.dirty)
    if (dirty.length === 0) {
      if (onSuccess) onSuccess()
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/inventory/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirty.map((r) => ({
            variantId: r.id,
            stock: Number(r.stock),
            price: Number(r.price),
          })),
        }),
      })
      const data = await res.json()
      setResult(data)
      setRows((prev) => prev.map((r) => ({ ...r, dirty: false })))
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Safe navigation wrapper: checks if dirty rows exist before proceeding
  const performGuardedAction = (action: () => void) => {
    if (dirtyCount > 0) {
      setPendingAction(() => action)
      setGuardModalOpen(true)
    } else {
      action()
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performGuardedAction(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search.trim()) {
        params.set("search", search.trim())
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      startTransition(() => {
        router.push(`/admin/inventory?${params.toString()}`, { scroll: false })
      })
    })
  }

  const handleStatusFilter = (status: string) => {
    performGuardedAction(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (status && status !== "all") {
        params.set("status", status)
      } else {
        params.delete("status")
      }
      params.set("page", "1")
      startTransition(() => {
        router.push(`/admin/inventory?${params.toString()}`, { scroll: false })
      })
    })
  }

  const handleBeforePageChange = (targetPage: number, targetSize?: number): Promise<boolean> => {
    if (dirtyCount === 0) return Promise.resolve(true)

    return new Promise((resolve) => {
      setPendingAction(() => () => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", targetPage.toString())
        if (targetSize) params.set("limit", targetSize.toString())
        startTransition(() => {
          router.push(`/admin/inventory?${params.toString()}`, { scroll: false })
        })
        resolve(false) // handled inside callback
      })
      setGuardModalOpen(true)
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Boxes className="w-3.5 h-3.5" />
              Stock Operations
            </span>
            <span className="text-xs text-zinc-600 font-medium">Server-paginated stock management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Inventory & Stock Manager</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Real-time multi-variant inline bulk editor with live stock sync and automated back-in-stock notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <button
              onClick={revertAll}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard ({dirtyCount})
            </button>
          )}
          <button
            onClick={() => save()}
            disabled={saving || dirtyCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 rounded-xl shadow-2xs transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving Changes…" : `Save Changes ${dirtyCount > 0 ? `(${dirtyCount})` : ""}`}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Active SKUs</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalSKUs.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Configured variants</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Physical Units</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalUnits.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Live warehouse count</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleStatusFilter(currentStatus === "low" ? "all" : "low")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            currentStatus === "low" ? "border-amber-400 bg-amber-50/50" : "border-zinc-200/90 bg-white hover:border-amber-300"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Stock (&lt;5 units)</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats.lowStock.toLocaleString()}</h3>
            <span className="text-xs text-amber-700/80 font-medium mt-1 block">Requires purchase restock</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleStatusFilter(currentStatus === "out" ? "all" : "out")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            currentStatus === "out" ? "border-rose-400 bg-rose-50/50" : "border-zinc-200/90 bg-white hover:border-rose-300"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">{stats.outOfStock.toLocaleString()}</h3>
            <span className="text-xs text-rose-700/80 font-medium mt-1 block">Sales currently blocked</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Successfully updated {result.succeeded} variant records. {result.failed > 0 && `(${result.failed} failed)`}</span>
          </div>
          <button onClick={() => setResult(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search product, size, color, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Stock:
          </span>
          <button
            onClick={() => handleStatusFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentStatus === "all" || !currentStatus ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All Variants
          </button>
          <button
            onClick={() => handleStatusFilter("low")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentStatus === "low" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Low Stock ({stats.lowStock})
          </button>
          <button
            onClick={() => handleStatusFilter("out")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentStatus === "out" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Out of Stock ({stats.outOfStock})
          </button>
          <button
            onClick={() => handleStatusFilter("in")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentStatus === "in" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Healthy Stock
          </button>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg shadow-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading inventory...
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5">Size</th>
                <th className="px-4 py-3.5">Color</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 w-32">Physical Stock</th>
                <th className="px-4 py-3.5 w-36">Selling Price (৳)</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No inventory variants match filter</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isOut = r.stock === 0
                  const isLow = r.stock > 0 && r.stock < 5

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        r.dirty ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[220px] font-medium">{r.product.name}</span>
                          {r.dirty && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                              Unsaved
                            </span>
                          )}
                        </div>
                        {r.sku && <span className="text-[11px] text-zinc-600 font-mono block mt-0.5">{r.sku}</span>}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-zinc-100 text-zinc-800 text-xs">
                          {r.size || "Standard"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-zinc-100 text-zinc-800 text-xs">
                          {r.color || "Standard"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Low ({r.stock} left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            In Stock ({r.stock})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            value={r.stock}
                            onChange={(e) => update(r.id, "stock", parseInt(e.target.value) || 0)}
                            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                              r.dirty
                                ? "border-amber-400 bg-white ring-2 ring-amber-400/20 text-zinc-900"
                                : "border-zinc-200 bg-zinc-50/60 hover:bg-white focus:bg-white focus:border-zinc-900 text-zinc-900"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.price}
                            onChange={(e) => update(r.id, "price", parseFloat(e.target.value) || 0)}
                            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                              r.dirty
                                ? "border-amber-400 bg-white ring-2 ring-amber-400/20 text-zinc-900"
                                : "border-zinc-200 bg-zinc-50/60 hover:bg-white focus:bg-white focus:border-zinc-900 text-zinc-900"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/products/${r.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 text-xs font-semibold hover:underline"
                        >
                          View Store <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with AdminPagination */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            basePath="/admin/inventory"
            onBeforeChange={handleBeforePageChange}
          />
        </div>
      </div>

      {/* Unsaved Changes Guard Dialog */}
      <Dialog open={guardModalOpen} onOpenChange={setGuardModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-900">Unsaved Inventory Changes</DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 mt-1">
              You have <strong className="text-amber-700">{dirtyCount} modified variant(s)</strong> on this page. Leaving will discard these changes unless saved first.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGuardModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Stay on Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                revertAll()
                setGuardModalOpen(false)
                if (pendingAction) pendingAction()
              }}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
            >
              Discard & Leave
            </Button>
            <Button
              size="sm"
              onClick={() => {
                save(() => {
                  setGuardModalOpen(false)
                  if (pendingAction) pendingAction()
                })
              }}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl"
            >
              Save & Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
