"use client"

import { useState, useEffect, useTransition } from "react"
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
  TrendingUp,
  X,
  Loader2,
  DollarSign,
  BarChart3,
  Percent,
  Coins,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Wallet
} from "lucide-react"
import AdminPagination from "@/components/admin/AdminPagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Variant {
  id: string
  size: string | null
  color: string | null
  stock: number
  price: number
  costPrice: number
  sku?: string | null
  product: { name: string; slug: string; price?: number }
}

interface PerformanceMetric {
  grossRevenue: number
  netRevenue: number
  cogs: number
  grossProfit: number
  margin: number
  unitsSold: number
  ordersCount: number
}

interface InventoryBulkClientProps {
  variants: Variant[]
  stats: {
    totalSKUs: number
    totalUnits: number
    lowStock: number
    outOfStock: number
  }
  valuation: {
    totalStockUnits: number
    totalInventoryCost: number
    totalRetailValue: number
    projectedGrossProfit: number
    projectedMargin: number
  }
  salesPerformance: {
    today: PerformanceMetric
    d7: PerformanceMetric
    d30: PerformanceMetric
    thisMonth: PerformanceMetric
    allTime: PerformanceMetric
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
  valuation,
  salesPerformance,
  pagination,
  currentSearch,
  currentStatus,
}: InventoryBulkClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [initialRows, setInitialRows] = useState(variants)
  const [rows, setRows] = useState(
    variants.map((v) => ({
      ...v,
      costPrice: Number(v.costPrice ?? 0),
      price: Number(v.price ?? v.product?.price ?? 0),
      dirty: false,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null)
  const [search, setSearch] = useState(currentSearch)
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "d7" | "d30" | "thisMonth" | "allTime">("d30")

  useEffect(() => {
    setInitialRows(variants)
    setRows(
      variants.map((v) => ({
        ...v,
        costPrice: Number(v.costPrice ?? 0),
        price: Number(v.price ?? v.product?.price ?? 0),
        dirty: false,
      }))
    )
    setResult(null)
  }, [variants])

  useEffect(() => {
    setSearch(currentSearch)
  }, [currentSearch])

  // Dirty guard modal state
  const [guardModalOpen, setGuardModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const dirtyCount = rows.filter((r) => r.dirty).length

  const update = (id: string, field: "stock" | "price" | "costPrice", value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        const initial = initialRows.find((i) => i.id === id)
        const isDirty = initial
          ? initial.stock !== updated.stock ||
            Number(initial.price ?? initial.product?.price ?? 0) !== Number(updated.price) ||
            Number(initial.costPrice ?? 0) !== Number(updated.costPrice)
          : true
        return { ...updated, dirty: isDirty }
      })
    )
  }

  const revertAll = () => {
    setRows(
      initialRows.map((v) => ({
        ...v,
        costPrice: Number(v.costPrice ?? 0),
        price: Number(v.price ?? v.product?.price ?? 0),
        dirty: false,
      }))
    )
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
            costPrice: Number(r.costPrice),
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

  const currentMetrics = salesPerformance[selectedTimeframe] || salesPerformance.d30

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Boxes className="w-3.5 h-3.5" />
              Stock & Financial Analytics
            </span>
            <span className="text-xs text-zinc-500 font-medium">Costing, Valuation & Profit Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Inventory & Financial Manager</h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
            Manage cost prices, retail prices, live stock, and monitor gross revenue & profit margins in real-time.
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

      {/* SECTION 1: WAREHOUSE VALUATION & ASSET DASHBOARD */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-zinc-700" />
            <span>Current Warehouse Stock Asset Valuation</span>
          </h2>
          <span className="text-[11px] text-zinc-400 font-mono">
            {stats.totalUnits.toLocaleString()} units · {stats.totalSKUs.toLocaleString()} active SKUs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset Cost Value */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inventory Asset Cost</span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold font-mono text-zinc-900 mt-2">
              ৳{Math.round(valuation.totalInventoryCost).toLocaleString()}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Capital tied in warehouse stock (Cost Price)
            </p>
          </div>

          {/* Potential Retail Revenue */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Potential Retail Value</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold font-mono text-blue-700 mt-2">
              ৳{Math.round(valuation.totalRetailValue).toLocaleString()}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Expected gross revenue at current selling prices
            </p>
          </div>

          {/* Projected Gross Profit */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Projected Stock Profit</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold font-mono text-emerald-700 mt-2">
              +৳{Math.round(valuation.projectedGrossProfit).toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>{Math.round(valuation.projectedMargin)}% projected margin</span>
            </p>
          </div>

          {/* Stock Health Overview */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stock Attention</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => handleStatusFilter("low")}
                className="flex-1 p-2 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100 transition text-left"
              >
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Low Stock</span>
                <span className="text-lg font-bold font-mono text-amber-900">{stats.lowStock} SKUs</span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilter("out")}
                className="flex-1 p-2 rounded-xl bg-rose-50/70 border border-rose-200 hover:bg-rose-100 transition text-left"
              >
                <span className="text-[10px] font-bold uppercase text-rose-700 block">Out of Stock</span>
                <span className="text-lg font-bold font-mono text-rose-900">{stats.outOfStock} SKUs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: REALIZED SALES PERFORMANCE & GROSS PROFIT TRACKER */}
      <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Realized Sales, Revenue & Gross Profit Performance</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Financial calculation based on actual customer orders and product unit costings (excluding cancelled orders).
            </p>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0">
            {[
              { key: "today", label: "Today" },
              { key: "d7", label: "7 Days" },
              { key: "d30", label: "30 Days" },
              { key: "thisMonth", label: "This Month" },
              { key: "allTime", label: "All Time" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTimeframe(t.key as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  selectedTimeframe === t.key
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Realized Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
          {/* Gross Revenue */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Gross Sales Volume</span>
            <p className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
              ৳{Math.round(currentMetrics.grossRevenue).toLocaleString()}
            </p>
            <span className="text-[10px] text-zinc-400 block font-medium">Before coupon discounts</span>
          </div>

          {/* Net Product Revenue */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Net Product Revenue</span>
            <p className="text-lg sm:text-xl font-bold font-mono text-blue-900">
              ৳{Math.round(currentMetrics.netRevenue).toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-600/80 block font-medium">After promo deductions</span>
          </div>

          {/* COGS */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">COGS (Goods Cost)</span>
            <p className="text-lg sm:text-xl font-bold font-mono text-amber-900">
              ৳{Math.round(currentMetrics.cogs).toLocaleString()}
            </p>
            <span className="text-[10px] text-amber-600/80 block font-medium">{currentMetrics.unitsSold.toLocaleString()} units sold</span>
          </div>

          {/* Gross Profit */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Realized Gross Profit</span>
            <p className="text-lg sm:text-xl font-bold font-mono text-emerald-800">
              ৳{Math.round(currentMetrics.grossProfit).toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 block font-semibold">Net Rev − COGS</span>
          </div>

          {/* Gross Margin % */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Gross Margin %</span>
            <p className="text-lg sm:text-xl font-bold font-mono text-emerald-800">
              {Math.round(currentMetrics.margin)}%
            </p>
            <span className="text-[10px] text-emerald-600/80 block font-medium">From {currentMetrics.ordersCount} orders</span>
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
            Filter:
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
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5">Size</th>
                <th className="px-4 py-3.5">Color</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 w-28">Stock Qty</th>
                <th className="px-4 py-3.5 w-32">Cost Price (৳)</th>
                <th className="px-4 py-3.5 w-32">Selling Price (৳)</th>
                <th className="px-4 py-3.5 w-36">Unit Profit & Margin</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No inventory variants match filter</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isOut = r.stock === 0
                  const isLow = r.stock > 0 && r.stock < 5
                  const cost = Number(r.costPrice || 0)
                  const selling = Number(r.price || 0)
                  const unitProfit = selling - cost
                  const marginPct = selling > 0 ? Math.round((unitProfit / selling) * 100) : 0

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "hover:bg-zinc-50/80 transition-colors",
                        r.dirty && "bg-amber-50/40"
                      )}
                    >
                      {/* Product Name & SKU */}
                      <td className="px-5 py-3 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products?search=${encodeURIComponent(r.product.name)}`}
                            className="hover:underline flex items-center gap-1 font-bold text-zinc-900"
                          >
                            <span>{r.product.name}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400 opacity-60" />
                          </Link>
                          {r.dirty && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{r.sku || "NO-SKU"}</p>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-bold font-mono">
                          {r.size || "Standard"}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-bold">
                          {r.color || "Default"}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity Input */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={r.stock}
                          onChange={(e) => update(r.id, "stock", Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className={cn(
                            "w-20 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition",
                            isOut ? "border-rose-300 bg-rose-50/30" : "border-zinc-300"
                          )}
                        />
                      </td>

                      {/* Cost Price (৳) Input */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={r.costPrice === 0 ? "" : r.costPrice}
                            placeholder="0"
                            onChange={(e) => update(r.id, "costPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-300 font-mono font-bold text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                          />
                        </div>
                      </td>

                      {/* Selling Price (৳) Input */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={r.price}
                          onChange={(e) => update(r.id, "price", Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-300 font-mono font-bold text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                        />
                      </td>

                      {/* Unit Profit & Margin */}
                      <td className="px-4 py-3">
                        {cost > 0 && selling > 0 ? (
                          unitProfit >= 0 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 text-xs">
                                +৳{unitProfit.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-emerald-600 block font-semibold">
                                {marginPct}% margin
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 text-xs">
                                -৳{Math.abs(unitProfit).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-rose-600 block font-semibold">
                                Loss ({marginPct}%)
                              </span>
                            </div>
                          )
                        ) : cost === 0 ? (
                          <span className="text-[11px] text-zinc-400 italic">No cost set</span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/products?search=${encodeURIComponent(r.product.name)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
                        >
                          <span>Edit Product</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Showing variants <span className="font-bold text-zinc-900">{pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-bold text-zinc-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
            <span className="font-bold text-zinc-900">{pagination.total.toLocaleString()}</span> filtered results
          </p>

          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            totalItems={pagination.total}
            onBeforeChange={handleBeforePageChange}
          />
        </div>
      </div>

      {/* Dirty Changes Navigation Guard Modal */}
      <Dialog open={guardModalOpen} onOpenChange={setGuardModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Unsaved Inventory Changes</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1.5">
              You have <span className="font-bold text-amber-600 font-mono">{dirtyCount} unsaved stock or price change(s)</span>. If you navigate away without saving, these changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGuardModalOpen(false)
                revertAll()
                if (pendingAction) pendingAction()
              }}
              className="rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Discard Changes
            </Button>
            <Button
              size="sm"
              onClick={() => {
                save(() => {
                  setGuardModalOpen(false)
                  if (pendingAction) pendingAction()
                })
              }}
              disabled={saving}
              className="rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xs"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save & Continue</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
