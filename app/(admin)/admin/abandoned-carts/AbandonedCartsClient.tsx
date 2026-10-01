"use client"

import { useState } from "react"
import {
  ShoppingCart,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Package,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  Tag,
  Sparkles,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AbandonedCartsClient({
  initialCarts,
}: {
  initialCarts: any[]
}) {
  const [carts, setCarts] = useState(initialCarts)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [editingCart, setEditingCart] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" })
  const [editErrors, setEditErrors] = useState<{ email?: string }>({})
  const [saving, setSaving] = useState(false)

  const startEditing = (cart: any) => {
    setEditingCart(cart)
    setEditForm({ name: cart.name || "", email: cart.email || "", phone: cart.phone || "" })
    setEditErrors({})
  }

  const saveEdit = async () => {
    if (!editingCart) return
    const email = editForm.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEditErrors({ email: "Enter a valid email" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${editingCart.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      toast.success("Abandoned cart updated")
      setCarts((prev) => prev.map((c) => (c.id === editingCart.id ? { ...c, ...data } : c)))
      setEditingCart(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const total = carts.reduce((s, c) => s + Number(c.subtotal || 0), 0)
  const recovered = carts.filter((c) => c.recoveredAt)
  const recoveredTotal = recovered.reduce((s, c) => s + Number(c.subtotal || 0), 0)
  const recoveryRate = carts.length > 0 ? Math.round((recovered.length / carts.length) * 100) : 0

  const handleSendRecoveryEmail = async (cartId: string, email: string) => {
    if (!email) {
      toast.error("No email address saved for this abandoned cart")
      return
    }

    setSendingId(cartId)
    try {
      const res = await fetch("/api/admin/abandoned-carts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send email")

      toast.success(`🎉 5% recovery voucher email sent to ${email}`)
      setCarts((prev) =>
        prev.map((c) =>
          c.id === cartId
            ? { ...c, emailSent: true, emailSentAt: new Date().toISOString(), email1SentAt: c.email1SentAt || new Date().toISOString() }
            : c
        )
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to send recovery email")
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <ShoppingCart className="w-3.5 h-3.5" />
              Checkout Recovery
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Tag className="w-3 h-3" />
              5% Coupon Automated (COMEBACK5)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Abandoned Carts Recovery</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Monitor abandoned checkout sessions, send 5% discount recovery emails, and boost conversion rates.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Abandoned</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{carts.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Incomplete checkouts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Pipeline at Stake</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">৳{total.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Total unrecovered cart value</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Recovered Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">৳{recoveredTotal.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">{recovered.length} carts successfully reclaimed</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Recovery Win Rate</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{recoveryRate}%</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">5% discount conversion</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table of Carts */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Customer Contact</th>
                <th className="px-4 py-3.5">Cart Items</th>
                <th className="px-4 py-3.5">Cart Value</th>
                <th className="px-4 py-3.5">Email Drips</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Abandoned At</th>
                <th className="px-4 py-3.5 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {carts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No abandoned carts found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">All customer checkouts have been completed or converted.</p>
                  </td>
                </tr>
              ) : (
                carts.map((cart) => {
                  let items: any[] = []
                  try {
                    items = JSON.parse((cart.items as string) || "[]")
                  } catch {
                    items = []
                  }
                  const emailsSent = [cart.email1SentAt, cart.email2SentAt, cart.email3SentAt].filter(Boolean).length
                  const isRecovered = !!cart.recoveredAt
                  const phoneClean = cart.phone ? cart.phone.replace(/[^0-9]/g, "") : null
                  const isSending = sendingId === cart.id

                  return (
                    <tr key={cart.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-900">
                          {cart.email || cart.phone || <span className="text-zinc-400 font-normal">Anonymous Shopper</span>}
                        </div>
                        {cart.email && cart.phone && (
                          <div className="text-[11px] text-zinc-600 font-mono mt-0.5">{cart.phone}</div>
                        )}
                        {cart.name && (
                          <div className="text-[11px] text-zinc-500">{cart.name}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                        </div>
                        {items.length > 0 && items[0]?.name && (
                          <span className="text-[11px] text-zinc-600 truncate block max-w-[180px] mt-0.5">
                            {items[0].name} {items.length > 1 && `+${items.length - 1} more`}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-zinc-900 text-xs">
                          ৳{Number(cart.subtotal).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3].map((step) => {
                              const sent = emailsSent >= step
                              return (
                                <span
                                  key={step}
                                  className={`w-2 h-2 rounded-full ${
                                    sent ? "bg-emerald-500" : "bg-zinc-200"
                                  }`}
                                  title={`Stage ${step} ${sent ? "Sent" : "Pending"}`}
                                />
                              )
                            })}
                          </div>
                          <span className="text-[11px] text-zinc-600 font-medium">
                            {emailsSent}/3 Sent
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isRecovered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Recovered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                        {new Date(cart.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditing(cart)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300 shadow-2xs transition"
                            title="Edit customer contact details"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>

                          {cart.email && !isRecovered && (
                            <button
                              onClick={() => handleSendRecoveryEmail(cart.id, cart.email)}
                              disabled={isSending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 shadow-2xs transition disabled:opacity-50"
                              title="Send 5% discount COMEBACK5 recovery email"
                            >
                              {isSending ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-800" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-amber-600" />
                              )}
                              <span>Send 5% Coupon</span>
                            </button>
                          )}

                          {phoneClean && (
                            <a
                              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi ${cart.name || "there"}, you left items in your cart at Berber Clothing! Use code COMEBACK5 for 5% off today: https://www.berber.clothing/checkout?recover=${cart.sessionId}&coupon=COMEBACK5`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
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
            Showing <strong>{carts.length}</strong> recorded abandoned checkouts
          </span>
        </div>
      </div>

      <Dialog open={!!editingCart} onOpenChange={(open) => !open && setEditingCart(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Contact Details</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="customer@email.com" />
              {editErrors.email && <p className="text-xs text-red-500 mt-1">{editErrors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <p className="text-xs text-zinc-500">
              Fixing a typo'd email or missing phone number here lets recovery emails and WhatsApp outreach actually reach this customer.
            </p>
            <Button className="w-full" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
