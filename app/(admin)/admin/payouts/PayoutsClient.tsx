"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  CreditCard,
  Building2,
  Loader2,
} from "lucide-react"
import AdminPagination from "@/components/admin/AdminPagination"

type Payout = {
  id: string
  affiliateId: string
  amount: number
  method: string
  accountDetails: string
  status: string
  transactionId?: string | null
  adminNote?: string | null
  createdAt: string
  processedAt?: string | null
  affiliate: {
    id: string
    name: string
    email: string
    phone?: string | null
    shopName?: string | null
    partnerType: string
    code: string
    walletBalance: number
  }
}

interface PayoutsClientProps {
  data: Payout[]
  counts: {
    all: number
    pending: number
    paid: number
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

export default function PayoutsClient({
  data,
  counts,
  pagination,
  currentSearch,
  currentStatus,
}: PayoutsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentSearch)
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/payouts?${params.toString()}`, { scroll: false })
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "ALL") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/admin/payouts?${params.toString()}`, { scroll: false })
  }

  const handleApprovePaid = async () => {
    if (!processingPayout) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${processingPayout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          transactionId,
          adminNote,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to update payout")
      }

      toast.success("Payout marked as PAID and transaction details recorded!")
      setProcessingPayout(null)
      setTransactionId("")
      setAdminNote("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (payout: Payout) => {
    const reason = prompt("Please provide a reason for rejection (balance will be refunded to partner):")
    if (reason === null) return

    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          adminNote: reason || "Rejected by administrator",
        }),
      })

      if (!res.ok) throw new Error("Failed to reject payout")
      toast.success("Payout rejected and balance returned to partner wallet")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search partner, shop, phone, trxID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-zinc-50/60 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { key: "ALL", label: `All (${counts.all})` },
            { key: "PENDING", label: `Pending (${counts.pending})` },
            { key: "PAID", label: `Paid (${counts.paid})` },
            { key: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusFilter(tab.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                currentStatus === tab.key || (!currentStatus && tab.key === "ALL")
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disburse Modal */}
      <Dialog open={Boolean(processingPayout)} onOpenChange={(open) => !open && setProcessingPayout(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>Confirm Payout Disbursement</span>
            </DialogTitle>
          </DialogHeader>

          {processingPayout && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Partner:</span>
                  <span className="font-bold text-zinc-900">
                    {processingPayout.affiliate?.name}{" "}
                    {processingPayout.affiliate?.shopName && `(${processingPayout.affiliate.shopName})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Withdrawal Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ৳{Number(processingPayout.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Gateway:</span>
                  <span className="font-bold text-zinc-800">{processingPayout.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recipient Account:</span>
                  <span className="font-mono font-bold text-zinc-900">{processingPayout.accountDetails}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Bank / MFS Transaction Reference ID</label>
                <Input
                  required
                  placeholder="e.g. bKash TrxID: 9J38FKL2"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Internal Admin Note (Optional)</label>
                <Input
                  placeholder="e.g. Sent via agent counter"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProcessingPayout(null)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={loading}
                  onClick={handleApprovePaid}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
              <TableHead className="text-xs font-bold text-zinc-700 pl-5">Partner / Shop</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Amount</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Method</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Account Details</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Status</TableHead>
              <TableHead className="text-xs font-bold text-zinc-700">Transaction ID</TableHead>
              <TableHead className="text-right text-xs font-bold text-zinc-700 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-zinc-600">No payout requests found</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Requests submitted by affiliates or resellers will appear here</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="font-bold text-zinc-900 block text-xs">
                        {p.affiliate?.shopName || p.affiliate?.name}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        {p.affiliate?.name} • {p.affiliate?.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      ৳{Number(p.amount).toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-zinc-800">{p.method}</span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-zinc-700 text-xs">{p.accountDetails}</span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        p.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                      }`}
                    >
                      {p.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-zinc-500 text-[11px]">{p.transactionId || "-"}</span>
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    {p.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setProcessingPayout(p)}
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Disburse
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(p)}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Reject Payout"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {p.processedAt ? new Date(p.processedAt).toLocaleDateString("en-GB") : "-"}
                      </span>
                    )}
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
            basePath="/admin/payouts"
          />
        </div>
      </div>
    </div>
  )
}
