"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ProductsTable({ products }: { products: any[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      if (data.softDeleted) {
        toast.warning(`"${name}" has existing orders — deactivated instead of deleted.`)
      } else {
        toast.success(`"${name}" deleted`)
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
          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No products found.</TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {products.map((product: any) => {
        const totalStock = product.variants.reduce((acc: number, v: any) => acc + v.stock, 0)
        return (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
            <TableCell>৳{Number(product.price).toLocaleString()}</TableCell>
            <TableCell>
              {totalStock}{" "}
              <span className="text-xs text-muted-foreground">({product.variants.length} variants)</span>
            </TableCell>
            <TableCell>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Link href={`/admin/products/${product.id}`}>
                  <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deleting === product.id}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )
}
