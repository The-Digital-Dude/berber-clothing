"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, User, ShoppingCart, Lock, Unlock, Mail, Phone, ExternalLink, ShieldCheck, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Order = {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isLocked: boolean
  joinedDate: string
  totalOrders: number
  totalSpent: number
  orders: Order[]
  lastOrderAt?: string
}

export function CustomerClient({ data }: { data: Customer[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [filterType, setFilterType] = useState<"ALL" | "REGISTERED" | "GUEST">("ALL")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [lockLoading, setLockLoading] = useState(false)

  const toggleLock = async (customer: Customer) => {
    if (!customer.id.startsWith("guest:")) {
      setLockLoading(true)
      await fetch(`/api/admin/customers/${customer.id}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !customer.isLocked }),
      })
      setLockLoading(false)
      router.refresh()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/admin/customers?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      router.push(`/admin/customers`)
    }
  }

  const filteredData = data.filter((c) => {
    if (filterType === "REGISTERED") return c.role !== "GUEST"
    if (filterType === "GUEST") return c.role === "GUEST"
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-zinc-200/80 bg-white space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {(["ALL", "REGISTERED", "GUEST"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-all text-xs",
                filterType === t
                  ? "bg-zinc-900 text-white shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70"
              )}
            >
              {t === "ALL" ? `All (${data.length})` : t === "REGISTERED" ? "Registered Accounts" : "Guest Shoppers"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name, email, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-3 py-1 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs">
            Search
          </Button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
              <TableHead className="text-xs font-bold text-zinc-700 pl-4">Customer</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Contact</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Type</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Orders</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Total Spent (LTV)</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-4">Profile & History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-400">
                  No customers found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((customer) => {
                const isGuest = customer.role === "GUEST"
                return (
                  <TableRow
                    key={customer.id}
                    className="text-xs hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-amber-400/60 transition-colors">
                          {customer.name && customer.name !== "—"
                            ? customer.name.charAt(0).toUpperCase()
                            : "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                            {customer.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-zinc-600">
                        <span className="font-mono text-[11px]">{customer.phone}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          isGuest
                            ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                            : customer.role === "ADMIN"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {customer.role}
                      </span>
                    </TableCell>

                    <TableCell className="font-bold text-zinc-900 font-mono">
                      {customer.totalOrders} order{customer.totalOrders !== 1 ? "s" : ""}
                    </TableCell>

                    <TableCell className="font-bold text-zinc-900 font-mono text-xs">
                      ৳{customer.totalSpent.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="h-8 px-2.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                        >
                          <span>View History</span>
                        </Button>
                        {!isGuest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLock(customer)}
                            disabled={lockLoading}
                            title={customer.isLocked ? "Unlock Account" : "Lock Account"}
                            className={cn(
                              "h-8 px-2 text-xs rounded-lg",
                              customer.isLocked
                                ? "text-rose-600 hover:bg-rose-50"
                                : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
                            )}
                          >
                            {customer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Profile & History Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-zinc-900">
              <User className="w-4 h-4 text-amber-500" />
              <span>Customer Profile</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-5 pt-2 text-xs">
              {/* Profile Card */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Name:</span>
                  <span className="font-bold text-zinc-900">{selectedCustomer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Email:</span>
                  <span className="font-mono text-zinc-800">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Phone:</span>
                  <span className="font-mono text-zinc-800">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 font-bold text-sm">
                  <span className="text-zinc-700">Lifetime Spent (LTV):</span>
                  <span className="text-zinc-950 font-mono">৳{selectedCustomer.totalSpent.toLocaleString()}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Order History ({selectedCustomer.orders.length})
                </h4>
                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-white">
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="p-4 text-center text-zinc-400">No orders recorded</p>
                  ) : (
                    selectedCustomer.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors">
                        <div>
                          <p className="font-bold text-zinc-900 font-mono">{o.orderNumber}</p>
                          <p className="text-[11px] text-zinc-400">
                            {new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-zinc-900 font-mono">৳{Number(o.total).toLocaleString()}</p>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {o.status}
                            </span>
                          </div>
                          <Link href={`/admin/orders/${o.id}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-900">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
