import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { 
  ShoppingCart, 
  RotateCcw, 
  TrendingUp, 
  MailCheck, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Package,
  CheckCircle2,
  Clock
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AbandonedCartsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const carts = await prisma.abandonedCart.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const total = carts.reduce((s, c) => s + Number(c.subtotal), 0)
  const recovered = carts.filter((c) => c.recoveredAt)
  const recoveredTotal = recovered.reduce((s, c) => s + Number(c.subtotal), 0)
  const recoveryRate = carts.length > 0 ? Math.round((recovered.length / carts.length) * 100) : 0

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
            <span className="text-xs text-zinc-600 font-medium">Automated 3-stage drip email sequence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Abandoned Carts Recovery</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Track carts abandoned during checkout, monitor automated recovery emails, and re-engage lost shoppers.
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
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Sequence conversion efficacy</span>
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
                <th className="px-4 py-3.5">Email Sequence</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Abandoned At</th>
                <th className="px-4 py-3.5 text-right">Direct Re-engage</th>
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

                  return (
                    <tr key={cart.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-900">
                          {cart.email || cart.phone || <span className="text-zinc-400 font-normal">Anonymous Shopper</span>}
                        </div>
                        {cart.email && cart.phone && (
                          <div className="text-[11px] text-zinc-600 font-mono mt-0.5">{cart.phone}</div>
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
                            {emailsSent}/3 Drips
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
                          {phoneClean && (
                            <a
                              href={`https://wa.me/${phoneClean}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                          {cart.email && (
                            <a
                              href={`mailto:${cart.email}?subject=Did you leave something behind at Berber?`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                            >
                              Email
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
    </div>
  )
}
