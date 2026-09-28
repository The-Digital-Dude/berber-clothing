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
import AdminPagination from "@/components/admin/AdminPagination"

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

interface CustomerClientProps {
  data: Customer[]
  allCounts: {
    all: number
    registered: number
    guest: number
    vip: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentFilter: string
}

export function CustomerClient({
  data,
  allCounts,
  pagination,
  currentSearch,
  currentFilter,
}: CustomerClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(currentSearch)
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
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/customers?${params.toString()}`, { scroll: false })
  }

  const handleFilterChange = (filterType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filterType && filterType !== "ALL") {
      params.set("filter", filterType)
    } else {
      params.delete("filter")
    }
    params.set("page", "1")
    router.push(`/admin/customers?${params.toString()}`, { scroll: false })
  }

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
          {[
            { key: "ALL", label: `All (${allCounts.all})` },
            { key: "REGISTERED", label: `Registered (${allCounts.registered})` },
            { key: "GUEST", label: `Guest Shoppers (${allCounts.guest})` },
            { key: "VIP", label: `VIP High LTV (${allCounts.vip})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all text-xs whitespace-nowrap",
                currentFilter === tab.key || (!currentFilter && tab.key === "ALL")
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200/70"
              )}
            >
              {tab.label}
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
                <TableHead className="text-xs font-bold text-zinc-700">Recent Activity</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No customers found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try refining your search query or filter category.</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c) => {
                  const isGuest = c.role === "GUEST"
                  const isVip = c.totalSpent >= 10000 || c.totalOrders >= 3

                  return (
                    <TableRow key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-zinc-900 text-xs">{c.name}</p>
                              {isVip && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-600 block mt-0.5">
                              Joined {new Date(c.joinedDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-zinc-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-700">
                            <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{c.email}</span>
                          </div>
                          {c.phone && c.phone !== "—" && (
                            <div className="flex items-center gap-1.5 text-zinc-600 font-mono text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {isGuest ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              Guest Checkout
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                              Registered
                            </span>
                          )}
                          {c.isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs font-semibold text-zinc-900 font-mono">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs font-bold text-zinc-900 font-mono">
                        <span className={c.totalSpent > 0 ? "text-emerald-700" : "text-zinc-600"}>
                          ৳{c.totalSpent.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-zinc-600">
                        {c.lastOrderAt ? (
                          <span className="text-[11px]">
                            {new Date(c.lastOrderAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="pr-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                            title="View Customer Profile & Orders"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {!isGuest && (
                            <button
                              onClick={() => toggleLock(c)}
                              disabled={lockLoading}
                              className={cn(
                                "p-1.5 rounded-lg transition",
                                c.isLocked
                                  ? "text-rose-600 hover:bg-rose-50"
                                  : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                              )}
                              title={c.isLocked ? "Unlock account access" : "Lock account access"}
                            >
                              {c.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
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

        {/* AdminPagination at the bottom */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            basePath="/admin/customers"
          />
        </div>
      </div>

      {/* Profile & History Drawer Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-xl bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCustomer?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-zinc-900">
                    {selectedCustomer?.name}
                  </DialogTitle>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {selectedCustomer?.role === "GUEST" ? "Guest Shopper Profile" : "Registered Berber Account"}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-5 pt-2">
              {/* Overview Details */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Email Address:</span>
                  <span className="font-semibold text-zinc-800">{selectedCustomer.email}</span>
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
