"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Eye, ExternalLink, Loader2, Sparkles, Check, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function ProductsTable({ products: initialProducts }: { products: any[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

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
        const imgUrl = product.images?.[0]?.url || "/placeholder.png"

        return (
          <TableRow key={product.id} className="text-xs transition-colors hover:bg-zinc-50/80 group">
            {/* Product Item info */}
            <TableCell className="py-3 pl-4">
              <div className="flex items-center gap-3">
                <img
                  src={imgUrl}
                  alt={product.name}
                  className="w-11 h-11 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
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

            {/* Price */}
            <TableCell className="font-mono font-bold text-zinc-900">
              ৳{Number(product.price).toLocaleString()}
              {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                <span className="text-[10px] text-zinc-400 line-through block font-normal">
                  ৳{Number(product.comparePrice).toLocaleString()}
                </span>
              )}
            </TableCell>

            {/* Stock Levels */}
            <TableCell>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono font-bold text-xs px-2 py-0.5 rounded-full border",
                    totalStock === 0
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : totalStock <= 5
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}
                >
                  {totalStock} in stock
                </span>
                <span className="text-[11px] text-zinc-400">
                  ({product.variants?.length || 0} var)
                </span>
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
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer",
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
                <Link href={`/admin/products/${product.id}`} title="Edit Product">
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
        )
      })}
    </TableBody>
  )
}
