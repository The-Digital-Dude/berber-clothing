"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type Variant = {
  id: string
  productName: string
  categoryName: string
  size: string
  color: string
  sku: string
  stock: number
}

type Category = {
  id: string
  name: string
}

export function InventoryClient({ 
  data, 
  categories, 
  lowStockCount 
}: { 
  data: Variant[]
  categories: Category[]
  lowStockCount: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = useState<string>("")
  const [localData, setLocalData] = useState<Variant[]>(data)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/inventory?${params.toString()}`)
  }

  const handleStockClick = (variant: Variant) => {
    setEditingStockId(variant.id)
    setEditingStockValue(variant.stock.toString())
  }

  const handleStockSave = async (id: string) => {
    const newStock = parseInt(editingStockValue)
    if (isNaN(newStock) || newStock < 0) {
      setEditingStockId(null)
      return
    }

    try {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      })

      if (res.ok) {
        setLocalData(prev => prev.map(v => v.id === id ? { ...v, stock: newStock } : v))
      } else {
        alert("Failed to update stock")
      }
    } catch (e) {
      alert("Error updating stock")
    } finally {
      setEditingStockId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Variants</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Variants with less than 5 units</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          value={searchParams.get("category") || "all"} 
          onValueChange={(val) => handleFilterChange("category", val || "")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={searchParams.get("stock") || "all"} 
          onValueChange={(val) => handleFilterChange("stock", val || "")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Status</SelectItem>
            <SelectItem value="in_stock">In Stock (5+)</SelectItem>
            <SelectItem value="low_stock">Low Stock (1-4)</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No inventory found.
                </TableCell>
              </TableRow>
            ) : (
              localData.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.productName}</TableCell>
                  <TableCell>{variant.categoryName}</TableCell>
                  <TableCell>{variant.size} - {variant.color}</TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>
                    {variant.stock === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : variant.stock < 5 ? (
                      <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500 text-white hover:bg-green-600">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right cursor-pointer" onClick={() => handleStockClick(variant)}>
                    {editingStockId === variant.id ? (
                      <Input 
                        autoFocus
                        type="number"
                        className="w-20 ml-auto"
                        value={editingStockValue}
                        onChange={(e) => setEditingStockValue(e.target.value)}
                        onBlur={() => handleStockSave(variant.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStockSave(variant.id)}
                      />
                    ) : (
                      <span className="font-medium underline decoration-dotted underline-offset-4">{variant.stock}</span>
                    )}
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
