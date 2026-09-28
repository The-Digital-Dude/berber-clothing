"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ShoppingBag,
  Plus,
  Search,
  Pencil,
  Trash2,
  Truck,
  CheckCircle2,
  Clock,
  Wallet,
  ExternalLink,
} from "lucide-react"

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

export default function ResellersClient({ data }: { data: Reseller[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [discountPct, setDiscountPct] = useState("15")
  const [shopName, setShopName] = useState("")
  const [saving, setSaving] = useState(false)

  function openEdit(r: Reseller) {
    setEditingReseller(r)
    setDiscountPct(String(r.resellerDiscountPct || 15))
    setShopName(r.shopName || "")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingReseller) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/affiliates/${editingReseller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resellerDiscountPct: Number(discountPct),
          shopName: shopName.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Reseller details updated")
      setEditingReseller(null)
      router.refresh()
    } catch {
      toast.error("Failed to update reseller")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
    if (res.ok) {
      toast.success("Reseller status updated")
      router.refresh()
    } else {
      toast.error("Failed to update")
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.shopName && r.shopName.toLowerCase().includes(q))
    )
  }, [data, search])

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name, owner, email…"
            className="pl-9 h-9 text-xs rounded-xl bg-white border-zinc-200"
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingReseller} onOpenChange={(v) => !v && setEditingReseller(null)}>
        <DialogContent className="sm:max-w-md w-[94vw] p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Edit Reseller Profile</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Shop / Brand Name</label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Trendy Outfit BD"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Wholesale Discount Margin (%)</label>
              <Input
                type="number"
                min={0}
                max={50}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="h-9 text-xs rounded-xl font-mono font-bold"
              />
              <p className="text-[11px] text-zinc-400">
                Reseller gets this discount off all retail prices for dropship orders.
              </p>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl"
            >
              {saving ? "Saving…" : "Save Reseller Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Reseller Shop</TableHead>
              <TableHead className="text-zinc-700 font-bold">Wholesale Discount</TableHead>
              <TableHead className="text-zinc-700 font-bold">Dropship Orders</TableHead>
              <TableHead className="text-zinc-700 font-bold">Wallet Balance</TableHead>
              <TableHead className="text-zinc-700 font-bold">Total Earned</TableHead>
              <TableHead className="text-zinc-700 font-bold">Active</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  No resellers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm block">
                        {r.shopName || r.name}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        Owner: {r.name} ({r.email})
                      </span>
                      {r.phone && <span className="text-zinc-500 font-mono text-[10px] block">{r.phone}</span>}
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
      </div>
    </div>
  )
}
