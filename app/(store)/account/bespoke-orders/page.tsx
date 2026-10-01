import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Scissors, Sparkles, ChevronRight, Calendar, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CustomerBespokeOrdersListPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?redirect=/account/bespoke-orders")
  }

  const orders = await prisma.bespokeOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      timelineLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  return (
    <div className="w-full min-h-screen bg-berber-bg text-berber-text py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs text-berber-text-muted hover:text-berber-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-berber-border">
          <div>
            <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Scissors className="w-3.5 h-3.5 text-berber-gold" />
              Sartorial Commissions
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-berber-black">
              My Bespoke Tailoring Commissions
            </h1>
          </div>

          <Link
            href="/bespoke/builder"
            className="inline-flex items-center gap-2 bg-berber-gold hover:bg-yellow-600 text-white font-bold px-5 py-2.5 rounded-full text-xs transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            New Bespoke Commission
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-berber-surface border border-berber-border rounded-3xl p-12 text-center space-y-4 shadow-berber">
            <Scissors className="w-10 h-10 text-berber-gold mx-auto opacity-80" />
            <h2 className="text-lg font-heading font-bold text-berber-black">No Bespoke Commissions Yet</h2>
            <p className="text-xs text-berber-text-muted max-w-md mx-auto">
              Experience handcrafted made-to-measure tailoring. Design your suit online or book a private fitting session at our Banani Flagship Atelier.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/bespoke/builder"
                className="bg-berber-gold text-white font-bold px-6 py-2.5 rounded-full text-xs hover:bg-yellow-600 transition shadow-sm"
              >
                Launch Suit Configurator
              </Link>
              <Link
                href="/bespoke/book-appointment"
                className="border border-berber-border bg-white text-berber-black font-medium px-6 py-2.5 rounded-full text-xs hover:bg-berber-muted transition"
              >
                Book Atelier Fitting
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const specs = typeof o.designSpecs === "string" ? JSON.parse(o.designSpecs) : o.designSpecs || {}
              return (
                <Link
                  key={o.id}
                  href={`/account/bespoke-orders/${o.id}`}
                  className="block bg-berber-surface hover:bg-white border border-berber-border hover:border-berber-gold rounded-3xl p-6 transition group shadow-berber"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-berber-black text-base">#{o.orderNumber}</span>
                        <span className="text-xs bg-berber-gold/15 text-berber-black border border-berber-gold/30 px-3 py-0.5 rounded-full font-medium">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-berber-black font-semibold">
                        {o.garmentType.replace(/_/g, " ")} • {specs.fabric?.name || "Bespoke Wool"}
                      </p>
                      <p className="text-[11px] text-berber-text-muted">
                        Commissioned on {new Date(o.createdAt).toLocaleDateString()} • Value: ৳{o.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-berber-gold group-hover:text-yellow-700">
                      <span>View Atelier Progress</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
