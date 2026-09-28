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
  ShoppingBag,
  Search,
  Pencil,
  Truck,
  CheckCircle2,
  Clock,
  Wallet,
  ExternalLink,
} from "lucide-react"
import AdminPagination from "@/components/admin/AdminPagination"

type Reseller = {
  id: string
  name: string
  email: string
  phone?: string | null
  shopName?: string | null
  facebookPage?: string | null
  partnerType: string
  status: string
  resellerDiscountPct: number
  walletBalance: number
  totalEarned: number
  totalPaid: number
  isActive: boolean
  createdAt: string
  _count: { resellerOrders: number; payoutRequests: number }
  resellerOrders?: {
    id: string
    orderNumber: string
    status: string
    total: number
    resellerProfit: number
    advancePaid: boolean
    createdAt: string
  }[]
}

interface ResellersClientProps {
  data: Reseller[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
}

export default function ResellersClient({
  data,
  pagination,
  currentSearch,
}: ResellersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentSearch)
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [discountPct, setDiscountPct] = useState("15")
  const [shopName, setShopName] = useState("")
  const [saving, setSaving] = useState(false)

  function openEdit(r: Reseller) {
    setEditingReseller(r)
    setDiscountPct(r.resellerDiscountPct?.toString() || "15")
    setShopName(r.shopName || "")
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/resellers?${params.toString()}`, { scroll: false })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingReseller) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/affiliates/${editingReseller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resellerDiscountPct: parseFloat(discountPct) || 15,
          shopName,
        }),
      })

      if (!res.ok) throw new Error("Failed to update reseller settings")
      toast.success("Reseller settings updated successfully")
      setEditingReseller(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: current }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Reseller status updated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search shop name, owner, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-zinc-50/60 focus:bg-white"
          />
        </form>

        <span className="text-xs text-zinc-500">
          Default Dropship Wholesale Tier: <strong className="text-zinc-900 font-mono">15% off</strong> retail
        </span>
      </div>

      {/* Edit Drawer Dialog */}
      <Dialog open={Boolean(editingReseller)} onOpenChange={(open) => !open && setEditingReseller(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900">
              Edit Reseller: {editingReseller?.name}
            </DialogTitle>
          </DialogHeader>

          {editingReseller && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Shop / Brand Name</label>
                <Input
                  placeholder="e.g. Trendy Outfit BD"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Wholesale Discount Percentage (% off regular price)
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="80"
                  step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="h-9 text-xs font-mono rounded-xl"
                />
                <p className="text-[11px] text-zinc-500">
                  Defines the reseller's wholesale base purchase price. Their profit is: (Customer Retail Price - Wholesale Base Price).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingReseller(null)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reseller Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
              <TableHead className="text-xs font-bold text-zinc-700 pl-5">Reseller Shop</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Wholesale Tier</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Dropship Orders</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Wallet Balance</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Total Settled Profit</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Active</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  No resellers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm block">
                        {r.shopName || r.name}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Owner: {r.name} ({r.email})
                      </span>
                      {r.phone && <span className="text-zinc-400 font-mono text-[10px] block">{r.phone}</span>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-mono font-bold text-[11px]">
                      {r.resellerDiscountPct}% off catalog
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-900">
                      <Truck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{r._count?.resellerOrders || 0} orders</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-zinc-900">
                      ৳{Number(r.walletBalance || 0).toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-emerald-700">
                      ৳{Number(r.totalEarned || 0).toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={(v) => toggleActive(r.id, v)}
                    />
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(r)}
                      className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
                      title="Edit Reseller"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
            basePath="/admin/resellers"
          />
        </div>
      </div>
    </div>
  )
}
