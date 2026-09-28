"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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

export default function PayoutsClient({ data }: { data: Payout[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [loading, setLoading] = useState(false)

  const handleApprovePaid = async () => {
    if (!processingPayout) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${processingPayout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          transactionId: transactionId.trim(),
          adminNote: adminNote.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to process payout")
      toast.success("Payout marked as PAID")
      setProcessingPayout(null)
      setTransactionId("")
      setAdminNote("")
      router.refresh()
    } catch {
      toast.error("Failed to update payout")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (p: Payout) => {
    const reason = prompt(`Reject payout request for ${p.affiliate.name} (৳${p.amount})? Amount will be refunded to their wallet balance.\n\nEnter reason:`)
    if (reason === null) return
    try {
      const res = await fetch(`/api/admin/payouts/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          adminNote: reason.trim() || "Rejected by admin",
        }),
      })
      if (!res.ok) throw new Error("Failed to reject payout")
      toast.success("Payout rejected and funds refunded to partner wallet")
      router.refresh()
    } catch {
      toast.error("Failed to reject payout")
    }
  }

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter
      const q = search.toLowerCase()
      const matchSearch =
        !search.trim() ||
        p.affiliate.name.toLowerCase().includes(q) ||
        p.affiliate.email.toLowerCase().includes(q) ||
        p.accountDetails.toLowerCase().includes(q) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q))
      return matchStatus && matchSearch
    })
  }, [data, statusFilter, search])

  return (
    <div className="space-y-4">
      {/* Controls & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner, bKash, TrxID…"
            className="pl-9 h-9 text-xs rounded-xl bg-white border-zinc-200"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
          {["ALL", "PENDING", "PAID", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {st === "ALL" ? "All Payouts" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Disburse Modal */}
      <Dialog open={!!processingPayout} onOpenChange={(v) => !v && setProcessingPayout(null)}>
        <DialogContent className="sm:max-w-md w-[94vw] p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Confirm Payout Disbursement</span>
            </DialogTitle>
          </DialogHeader>

          {processingPayout && (
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Partner:</span>
                  <span className="font-bold text-zinc-900">{processingPayout.affiliate.name} ({processingPayout.affiliate.email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Method & Target:</span>
                  <span className="font-mono font-bold text-zinc-800">{processingPayout.method} — {processingPayout.accountDetails}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200">
                  <span className="text-zinc-700 font-bold">Withdrawal Amount:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">৳{Number(processingPayout.amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Transaction ID / TrxID *</label>
                <Input
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. BL88XX99 or Bank Ref"
                  className="h-9 text-xs rounded-xl font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Admin Note (Optional)</label>
                <Input
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Sent via bKash Merchant"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <Button
                onClick={handleApprovePaid}
                disabled={loading || !transactionId.trim()}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment & Mark PAID"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Partner Details</TableHead>
              <TableHead className="text-zinc-700 font-bold">Amount</TableHead>
              <TableHead className="text-zinc-700 font-bold">Method</TableHead>
              <TableHead className="text-zinc-700 font-bold">Account / Number</TableHead>
              <TableHead className="text-zinc-700 font-bold">Status</TableHead>
              <TableHead className="text-zinc-700 font-bold">Transaction ID</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  No payout requests found matching your filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm block">{p.affiliate.name}</span>
                      <span className="text-zinc-400 text-[11px] block">{p.affiliate.email}</span>
                      {p.affiliate.shopName && (
                        <span className="text-[10px] text-zinc-500 font-mono">Shop: {p.affiliate.shopName}</span>
                      )}
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
      </div>
    </div>
  )
}
