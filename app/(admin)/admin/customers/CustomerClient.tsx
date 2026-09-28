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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search, 
  User, 
  ShoppingCart, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Phone, 
  Mail, 
  MessageSquare,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react"
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
  const [filterType, setFilterType] = useState<"ALL" | "REGISTERED" | "GUEST" | "VIP">("ALL")
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
      router.push(`/admin/customers?search=${encodeURIComponent(searchTerm.trim())}`, { scroll: false })
    } else {
      router.push(`/admin/customers`, { scroll: false })
    }
  }

  const filteredData = data.filter((c) => {
    if (filterType === "REGISTERED") return c.role !== "GUEST"
    if (filterType === "GUEST") return c.role === "GUEST"
    if (filterType === "VIP") return c.totalSpent >= 10000 || c.totalOrders >= 3
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search by name, email, or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "REGISTERED", "GUEST", "VIP"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all text-xs whitespace-nowrap",
                filterType === t
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70"
              )}
            >
              {t === "ALL"
                ? `All (${data.length})`
                : t === "REGISTERED"
                ? `Registered (${data.filter((c) => c.role !== "GUEST").length})`
                : t === "GUEST"
                ? `Guest Shoppers (${data.filter((c) => c.role === "GUEST").length})`
                : `VIP High LTV (${data.filter((c) => c.totalSpent >= 10000 || c.totalOrders >= 3).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/60 hover:bg-zinc-50/60 border-zinc-200">
                <TableHead className="text-xs font-bold text-zinc-700 pl-5">Customer Profile</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Contact Details</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Type & Status</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Orders</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Lifetime Spent (LTV)</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Last Active</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-zinc-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No customers found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try searching with a different keyword or filter.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((customer) => {
                  const isGuest = customer.role === "GUEST"
                  const isVIP = customer.totalSpent >= 10000 || customer.totalOrders >= 3

                  return (
                    <TableRow
                      key={customer.id}
                      className="text-xs hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell className="py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-zinc-400 transition-colors shadow-2xs">
                            {customer.name && customer.name !== "—"
                              ? customer.name.charAt(0).toUpperCase()
                              : "C"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                                {customer.name}
                              </p>
                              {isVIP && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-600 font-mono mt-0.5 truncate">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-zinc-600">
                          <span className="font-mono text-xs text-zinc-900 font-medium">{customer.phone}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
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
                          {customer.isLocked && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Locked
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-zinc-900 font-mono">
                        {customer.totalOrders} order{customer.totalOrders !== 1 ? "s" : ""}
                      </TableCell>

                      <TableCell className="font-bold text-zinc-900 font-mono text-xs">
                        ৳{customer.totalSpent.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-zinc-600 text-[11px]">
                        {new Date(customer.lastOrderAt || customer.joinedDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition"
                          >
                            Profile
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          {!isGuest && (
                            <button
                              onClick={() => toggleLock(customer)}
                              disabled={lockLoading}
                              title={customer.isLocked ? "Unlock Account" : "Lock Account"}
                              className={cn(
                                "p-1.5 text-xs rounded-lg border transition",
                                customer.isLocked
                                  ? "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100"
                                  : "text-zinc-600 bg-white border-zinc-200 hover:text-zinc-900 hover:bg-zinc-50"
                              )}
                            >
                              {customer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
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

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> total customers
          </span>
        </div>
      </div>

      {/* Customer Profile & History Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <User className="w-4 h-4 text-zinc-900" />
              <span>Customer Profile & Purchase History</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-5 pt-2 text-xs">
              {/* Profile Card */}
              <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Customer Name:</span>
                  <span className="font-bold text-zinc-900 text-sm">{selectedCustomer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Email Address:</span>
                  <span className="font-mono text-zinc-800">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Phone Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-800 font-bold">{selectedCustomer.phone}</span>
                    {selectedCustomer.phone && selectedCustomer.phone !== "—" && (
                      <a
                        href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200 font-bold text-sm">
                  <span className="text-zinc-700">Lifetime Revenue (LTV):</span>
                  <span className="text-zinc-950 font-mono text-base text-emerald-700">
                    ৳{selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-zinc-900" /> Lifetime Orders ({selectedCustomer.orders.length})
                  </span>
                </h4>
                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-white">
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="p-4 text-center text-zinc-400">No completed orders on record</p>
                  ) : (
                    selectedCustomer.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors">
                        <div>
                          <p className="font-bold text-zinc-900 font-mono">#{o.orderNumber}</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">
                            {new Date(o.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-zinc-900 font-mono">৳{Number(o.total).toLocaleString()}</p>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {o.status}
                            </span>
                          </div>
                          <Link href={`/admin/orders/${o.id}`} target="_blank">
                            <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
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
