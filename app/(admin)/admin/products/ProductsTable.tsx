"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import {
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VariantRowProps {
  productId: string
  productBasePrice: number
  variant: any
  onVariantUpdated: (updatedVariant: any) => void
}

function VariantQuickEditorRow({
  productId,
  productBasePrice,
  variant,
  onVariantUpdated,
}: VariantRowProps) {
  const [stock, setStock] = useState<number>(variant.stock ?? 0)
  const [price, setPrice] = useState<string>(
    variant.price !== null && variant.price !== undefined ? String(variant.price) : ""
  )
  const [costPrice, setCostPrice] = useState<string>(
    variant.costPrice !== null && variant.costPrice !== undefined ? String(variant.costPrice) : ""
  )
  const [sku, setSku] = useState<string>(variant.sku ?? "")
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const effectiveRetail = Number(price || productBasePrice || 0)
  const numericCost = Number(costPrice || 0)
  const margin = effectiveRetail > 0 && numericCost > 0 ? effectiveRetail - numericCost : null
  const marginPct = margin !== null && effectiveRetail > 0 ? Math.round((margin / effectiveRetail) * 100) : null

  const handleSave = async (overrideField?: Partial<{ stock: number; price: string; costPrice: string; sku: string }>) => {
    const nextStock = overrideField?.stock !== undefined ? overrideField.stock : stock
    const nextPrice = overrideField?.price !== undefined ? overrideField.price : price
    const nextCost = overrideField?.costPrice !== undefined ? overrideField.costPrice : costPrice
    const nextSku = overrideField?.sku !== undefined ? overrideField.sku : sku

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: nextStock,
          price: nextPrice === "" ? null : Number(nextPrice),
          costPrice: nextCost === "" ? null : Number(nextCost),
          sku: nextSku.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update variant")

      onVariantUpdated(data)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } catch (err: any) {
      toast.error(err.message || "Could not save variant changes")
    } finally {
      setSaving(false)
    }
  }

  const handleStockStep = (delta: number) => {
    const newStock = Math.max(0, stock + delta)
    setStock(newStock)
    handleSave({ stock: newStock })
  }

  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors text-xs">
      {/* Variant label */}
      <td className="py-2.5 pl-6 pr-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-800 font-bold font-mono text-[11px] shadow-2xs">
            {variant.size || "Standard"}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-700 font-medium font-mono text-[11px] shadow-2xs">
            {variant.color || "Default"}
          </span>
          {stock === 0 ? (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              Out of stock
            </span>
          ) : stock <= 5 ? (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Low stock ({stock})
            </span>
          ) : null}
        </div>
      </td>

      {/* SKU */}
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onBlur={() => handleSave()}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
          placeholder="e.g. BRB-M-BLK"
          className="w-28 h-7 px-2 font-mono text-[11px] rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
        />
      </td>

      {/* Cost Price */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1 w-24">
          <span className="text-zinc-400 font-mono text-xs">৳</span>
          <input
            type="number"
            min={0}
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
            placeholder="Cost"
            className="w-full h-7 px-2 font-mono font-bold text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>
      </td>

      {/* Retail Price */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1 w-24">
          <span className="text-zinc-400 font-mono text-xs">৳</span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
            placeholder={String(productBasePrice)}
            className="w-full h-7 px-2 font-mono font-bold text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>
      </td>

      {/* Gross Margin Calc */}
      <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
        {margin !== null ? (
          <span className={cn("font-bold", margin > 0 ? "text-emerald-700" : "text-rose-600")}>
            ৳{margin} ({marginPct}%)
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )}
      </td>

      {/* Stock Stepper & Quick Edit */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStockStep(-1)}
            disabled={stock <= 0 || saving}
            className="w-6 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 disabled:opacity-30 shadow-2xs cursor-pointer"
          >
            -
          </button>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
            onBlur={() => handleSave()}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
            className="w-14 h-7 text-center font-mono font-black text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => handleStockStep(1)}
            disabled={saving}
            className="w-6 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 shadow-2xs cursor-pointer"
          >
            +
          </button>
        </div>
      </td>

      {/* Status indicator */}
      <td className="py-2.5 pr-6 text-right">
        <div className="flex items-center justify-end">
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          ) : justSaved ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
              <Check className="w-3 h-3 stroke-[3]" /> Saved
            </span>
          ) : (
            <span className="text-[10px] text-zinc-300">Auto-saves</span>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function ProductsTable({ products: initialProducts }: { products: any[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleToggleActive = async (id: string, current: boolean, name: string) => {
    setToggling(id)
    const nextState = !current
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: nextState } : p))
      )
      toast.success(`"${name}" is now ${nextState ? "Active" : "Draft"}`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to update product")
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      if (data.softDeleted) {
        toast.warning(`"${name}" has existing orders — deactivated instead of deleted.`)
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
        )
      } else {
        toast.success(`"${name}" deleted`)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      }
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleVariantUpdated = (productId: string, updatedVariant: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p
        const updatedVariants = (p.variants || []).map((v: any) =>
          v.id === updatedVariant.id ? updatedVariant : v
        )
        return {
          ...p,
          variants: updatedVariants,
        }
      })
    )
    toast.success(`Variant ${updatedVariant.size}/${updatedVariant.color} saved!`)
  }

  if (products.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={6} className="text-center py-12 text-xs text-zinc-400">
            No products match your filter.
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {products.map((product: any) => {
        const totalStock = product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) ?? 0
        const isToggling = toggling === product.id
        const isExpanded = expandedProductIds.has(product.id)
        const imgUrl = product.images?.[0]?.url || "/placeholder.png"
        const variantCount = product.variants?.length || 0

        return (
          <>
            <TableRow
              key={product.id}
              className={cn(
                "text-xs transition-colors hover:bg-zinc-50/80 group",
                isExpanded && "bg-zinc-50/60 border-b-0"
              )}
            >
              {/* Product Info + Variant expander */}
              <TableCell className="py-3 pl-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(product.id)}
                    className={cn(
                      "p-1.5 rounded-lg border text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer shrink-0 shadow-2xs",
                      isExpanded
                        ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 hover:text-white"
                        : "bg-white border-zinc-200 hover:bg-zinc-100"
                    )}
                    title={isExpanded ? "Collapse variants" : "Quick edit variants stock & prices"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-11 h-11 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                      /{product.slug}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell className="text-zinc-600 font-medium">
                {product.category?.name || "Uncategorized"}
              </TableCell>

              {/* Base Retail Price */}
              <TableCell className="font-mono font-bold text-zinc-900">
                ৳{Number(product.price).toLocaleString()}
                {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                  <span className="text-[10px] text-zinc-400 line-through block font-normal">
                    ৳{Number(product.comparePrice).toLocaleString()}
                  </span>
                )}
              </TableCell>

              {/* Stock Levels & Expand Pill */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(product.id)}
                    className={cn(
                      "font-mono font-bold text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer",
                      totalStock === 0
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : totalStock <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    )}
                  >
                    <span>{totalStock} in stock</span>
                    <span className="text-[10px] text-zinc-400">({variantCount} var)</span>
                  </button>
                </div>
              </TableCell>

              {/* Status Toggle */}
              <TableCell>
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => handleToggleActive(product.id, product.isActive, product.name)}
                  title="Click to toggle status"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs",
                    product.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                  )}
                >
                  {isToggling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        product.isActive ? "bg-emerald-500" : "bg-zinc-400"
                      )}
                    />
                  )}
                  <span>{product.isActive ? "Active" : "Draft"}</span>
                </button>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right pr-4">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/shop/${product.slug}`} target="_blank" title="View in storefront">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/admin/products/${product.id}`} title="Edit Full Product Page">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deleting === product.id}
                    title="Delete Product"
                    className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* EXPANDABLE INLINE QUICK VARIANT EDITOR */}
            {isExpanded && (
              <tr key={`${product.id}-variants-expansion`} className="bg-zinc-50/90 border-b border-zinc-200/80">
                <td colSpan={6} className="p-0">
                  <div className="py-3 px-6 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-200/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                          Variant Stock & Price Quick-Editor
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Edits auto-save on blur / Enter)
                        </span>
                      </div>
                      <Link
                        href={`/admin/products/${product.id}#variants`}
                        className="text-[11px] font-semibold text-amber-600 hover:underline"
                      >
                        Manage variant sizes/colors in full editor →
                      </Link>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            <th className="py-2 pl-6 pr-3">Size & Color</th>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3">Cost Price (৳)</th>
                            <th className="py-2 px-3">Retail Price (৳)</th>
                            <th className="py-2 px-3">Gross Margin</th>
                            <th className="py-2 px-3">Stock Units</th>
                            <th className="py-2 pr-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {product.variants?.map((v: any) => (
                            <VariantQuickEditorRow
                              key={v.id}
                              productId={product.id}
                              productBasePrice={Number(product.price)}
                              variant={v}
                              onVariantUpdated={(updated) => handleVariantUpdated(product.id, updated)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </>
        )
      })}
    </TableBody>
  )
}
