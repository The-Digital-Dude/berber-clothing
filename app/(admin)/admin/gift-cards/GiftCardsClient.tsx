"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Gift, 
  Plus, 
  Copy, 
  Check, 
  Search, 
  DollarSign, 
  CreditCard, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Save,
  Send
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type GiftCard = {
  id: string
  code: string
  amount: number
  balance: number
  senderName: string | null
  senderEmail: string | null
  recipientEmail: string
  message: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

const emptyForm = () => ({
  recipientEmail: "",
  recipientName: "",
  senderName: "",
  amount: "",
  message: "",
  expiresAt: "",
  sendEmail: true,
})

export default function GiftCardsClient({ data }: { data: GiftCard[] }) {
  const [cards, setCards] = useState<GiftCard[]>(data)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REDEEMED">("ALL")

  const stats = useMemo(() => {
    const totalIssued = cards.reduce((s, c) => s + Number(c.amount), 0)
    const totalBalance = cards.reduce((s, c) => s + Number(c.balance), 0)
    const totalRedeemed = totalIssued - totalBalance
    const redemptionRate = totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0
    return {
      count: cards.length,
      totalIssued,
      totalBalance,
      redemptionRate,
    }
  }, [cards])

  async function handleCreate() {
    if (!form.recipientEmail || !form.amount) {
      toast.error("Recipient email and voucher amount are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to create gift card")
      toast.success("Gift voucher generated and email dispatched!")
      setOpen(false)
      setForm(emptyForm())
      const listRes = await fetch("/api/admin/gift-cards")
      setCards(await listRes.json())
    } catch (e: any) {
      toast.error(e.message || "Failed to create gift card")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      setCards((cs) => cs.map((c) => (c.id === id ? { ...c, isActive } : c)))
      toast.success(`Gift card ${isActive ? "activated" : "deactivated"}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success("Voucher code copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (statusFilter === "ACTIVE" && !c.isActive) return false
      if (statusFilter === "REDEEMED" && Number(c.balance) > 0) return false

      if (search) {
        const q = search.toLowerCase()
        const matchCode = c.code.toLowerCase().includes(q)
        const matchEmail = c.recipientEmail.toLowerCase().includes(q)
        const matchSender = (c.senderName || "").toLowerCase().includes(q)
        if (!matchCode && !matchEmail && !matchSender) return false
      }
      return true
    })
  }, [cards, statusFilter, search])

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Gift Cards Issued</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.count}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Total digital vouchers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Gross Value Issued</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{stats.totalIssued.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Face value generated</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Outstanding Balance</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">৳{stats.totalBalance.toLocaleString()}</h3>
            <span className="text-xs text-amber-700/80 font-medium mt-1 block">Unredeemed liability</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Redemption Rate</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.redemptionRate}%</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Converted into orders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search code, recipient, sender…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "ACTIVE", "REDEEMED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all text-xs whitespace-nowrap",
                statusFilter === t
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {t === "ALL" ? `All (${cards.length})` : t === "ACTIVE" ? "Active" : "Fully Redeemed"}
            </button>
          ))}

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Issue Gift Card
          </button>
        </div>
      </div>

      {/* Cards Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Voucher Code</th>
                <th className="px-4 py-3.5">Recipient & Sender</th>
                <th className="px-4 py-3.5">Initial Value</th>
                <th className="px-4 py-3.5">Live Balance</th>
                <th className="px-4 py-3.5">Expiration</th>
                <th className="px-4 py-3.5 text-right">Active Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Gift className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No gift cards match filter</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Issue a new card or clear filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isZero = Number(c.balance) <= 0

                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                            title="Copy code"
                          >
                            {copied === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900">{c.recipientEmail}</div>
                        {c.senderName && (
                          <div className="text-[11px] text-zinc-600 mt-0.5">From: {c.senderName}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-medium text-zinc-800">
                        ৳{Number(c.amount).toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isZero ? "text-zinc-400" : "text-emerald-700"
                          }`}
                        >
                          ৳{Number(c.balance).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Never expires"}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end">
                          <Switch
                            checked={c.isActive}
                            onCheckedChange={(v) => toggleActive(c.id, v)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{cards.length}</strong> gift cards
          </span>
        </div>
      </div>

      {/* Issue Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Gift className="w-4 h-4 text-zinc-900" />
              <span>Issue Digital Gift Card</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Recipient Email Address *</label>
              <input
                required
                type="email"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                placeholder="customer@email.com"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Recipient Name</label>
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="e.g. Ayesha"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Sender Name</label>
                <input
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                  placeholder="e.g. Berber Team"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Voucher Amount (৳) *</label>
              <input
                required
                type="number"
                min="50"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Personal Message</label>
              <input
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="e.g. Happy Birthday! Enjoy shopping with Berber."
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <span className="text-xs font-semibold text-zinc-800">Dispatch Email with Voucher Code</span>
              <Switch
                checked={form.sendEmail}
                onCheckedChange={(v) => setForm({ ...form, sendEmail: v })}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              {saving ? "Generating Voucher…" : "Issue Digital Gift Card"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
