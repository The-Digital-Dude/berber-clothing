"use client"

import {
  Scissors,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building,
  ShieldCheck,
  MessageSquare,
  FileText,
  Camera,
} from "lucide-react"
import Link from "next/link"
import { buildWaLink } from "@/lib/whatsapp"

const STAGES = [
  { key: "FABRIC_SOURCING", label: "Cloth Sourced", desc: "Cloth reserved & pre-shrunk" },
  { key: "PATTERN_CUTTING", label: "Pattern Cutting", desc: "Laser & hand-drafted pattern" },
  { key: "BASTE_FITTING_SCHEDULED", label: "Baste Trial", desc: "Muslin trial fitting at atelier" },
  { key: "FINAL_TAILORING", label: "Handcrafting", desc: "Floating canvas & hand-stitching" },
  { key: "QUALITY_CONTROL", label: "QA Audit", desc: "Final pressing & inspection" },
  { key: "READY_FOR_PICKUP_OR_DELIVERY", label: "Ready for Pickup", desc: "Prepared at Flagship Atelier" },
]

const STAGE_ORDER: Record<string, number> = {
  CONSULTATION_BOOKED: 0,
  MEASUREMENTS_PENDING: 0,
  FABRIC_SOURCING: 1,
  PATTERN_CUTTING: 2,
  BASTE_FITTING_SCHEDULED: 3,
  BASTE_FITTING_COMPLETED: 3,
  FINAL_TAILORING: 4,
  QUALITY_CONTROL: 5,
  READY_FOR_PICKUP_OR_DELIVERY: 6,
  DELIVERED: 7,
  COMPLETED: 7,
}

export default function CustomerBespokeTimelineClient({ order }: { order: any }) {
  const specs =
    typeof order.designSpecs === "string"
      ? JSON.parse(order.designSpecs)
      : order.designSpecs || {}

  const currentStageIndex = STAGE_ORDER[order.status] ?? 1

  const waMessage = `Hi Berber Bespoke Atelier, I am inquiring about my bespoke commission *#${order.orderNumber}* (${order.garmentType.replace(/_/g, " ")}).`
  const waLink = buildWaLink("0170000000", waMessage)

  return (
    <div className="w-full bg-berber-bg min-h-screen text-berber-text py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs text-berber-text-muted hover:text-berber-black mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account Dashboard
        </Link>

        {/* Header Banner */}
        <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-berber">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Scissors className="w-3.5 h-3.5 text-berber-gold" />
              Bespoke Commission
            </div>
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-berber-black">
              Commission #{order.orderNumber}
            </h1>
            <p className="text-xs text-berber-text-muted">
              Commissioned on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {order.status === "BASTE_FITTING_SCHEDULED" && (
              <Link
                href="/bespoke/book-appointment"
                className="inline-flex items-center justify-center gap-2 bg-berber-gold hover:bg-yellow-600 text-white font-bold px-6 py-3 rounded-full text-xs transition shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                Book Baste Trial Fitting
              </Link>
            )}

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-berber-muted text-berber-black font-semibold px-5 py-3 rounded-full text-xs transition border border-berber-border shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Atelier Concierge
            </a>
          </div>
        </div>

        {/* Visual Stepper Card */}
        <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 mb-8 shadow-berber">
          <h2 className="text-base font-heading font-bold text-berber-black uppercase tracking-wider mb-8 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-berber-gold" />
            Handcrafting Milestone Progress
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative">
            {STAGES.map((st, idx) => {
              const stepNum = idx + 1
              const isCompleted = currentStageIndex > stepNum
              const isCurrent = currentStageIndex === stepNum

              return (
                <div
                  key={st.key}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    isCurrent
                      ? "bg-berber-gold/10 border-berber-gold ring-1 ring-berber-gold shadow-sm"
                      : isCompleted
                      ? "bg-berber-muted/50 border-emerald-600/30 text-berber-text"
                      : "bg-white border-berber-border text-berber-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isCurrent
                          ? "bg-berber-gold text-white"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {isCompleted ? "✓" : stepNum}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-berber-gold text-white px-2 py-0.5 rounded-full font-bold">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold mb-1 ${isCurrent ? "text-berber-black" : isCompleted ? "text-berber-black" : "text-berber-text-muted"}`}>
                      {st.label}
                    </h3>
                    <p className="text-[10px] text-berber-text-muted leading-tight">{st.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Two Column Layout: Specifications & Live Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Garment Specs Blueprint */}
          <div className="lg:col-span-5 bg-berber-surface border border-berber-border rounded-3xl p-6 space-y-6 shadow-berber">
            <div className="pb-4 border-b border-berber-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-berber-gold" />
              <h3 className="font-heading font-bold text-berber-black text-sm uppercase tracking-wider">Garment Blueprint</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Garment Type:</span>
                <span className="text-berber-black font-semibold">{order.garmentType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Cloth & Mill:</span>
                <span className="text-berber-black font-semibold">{specs.fabric?.name || "Bespoke Wool"}</span>
              </div>
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Lapel Architecture:</span>
                <span className="text-berber-black">{specs.lapel || "Notch Lapel"}</span>
              </div>
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Breasting & Vents:</span>
                <span className="text-berber-black">{specs.breasting || "Single Breasted"} • {specs.vent || "Side Vents"}</span>
              </div>
              {specs.waistcoat && (
                <div className="flex justify-between border-b border-berber-border pb-2">
                  <span className="text-berber-text-muted">Waistcoat:</span>
                  <span className="text-berber-gold font-semibold">{specs.waistcoat.style}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Interior Silk Lining:</span>
                <span className="text-berber-black">{specs.lining || "Bemberg Silk"}</span>
              </div>
              {specs.monogram && (
                <div className="flex justify-between border-b border-berber-border pb-2">
                  <span className="text-berber-text-muted">Monogram Embroidery:</span>
                  <span className="text-berber-gold font-serif tracking-widest font-bold">{specs.monogram.text}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 font-bold text-sm">
                <span className="text-berber-text">Commission Total:</span>
                <span className="text-berber-black font-mono">৳{Number(order.totalPrice).toLocaleString()}</span>
              </div>
            </div>

            {/* Collection Location Notice */}
            <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-berber-black font-semibold">
                <Building className="w-4 h-4 text-berber-gold" />
                <span>Flagship Atelier Collection</span>
              </div>
              <p className="text-berber-text-muted text-[11px] leading-relaxed">
                House 12, Road 11, Block D, Banani, Dhaka. Free valet parking and private fitting suites available upon arrival.
              </p>
            </div>
          </div>

          {/* Right: Live Workshop Activity Logs */}
          <div className="lg:col-span-7 bg-berber-surface border border-berber-border rounded-3xl p-6 space-y-6 shadow-berber">
            <div className="pb-4 border-b border-berber-border flex items-center gap-2">
              <Clock className="w-4 h-4 text-berber-gold" />
              <h3 className="font-heading font-bold text-berber-black text-sm uppercase tracking-wider">Atelier Progress Activity</h3>
            </div>

            {order.timelineLogs && order.timelineLogs.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-berber-border">
                {order.timelineLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-berber-gold/20 border border-berber-gold/40 text-berber-gold flex items-center justify-center shrink-0 z-10 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="bg-berber-muted/40 border border-berber-border rounded-2xl p-4 flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-berber-black">{log.title}</h4>
                        <span className="text-[10px] text-berber-text-muted">
                          {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-xs text-berber-text-muted leading-relaxed">{log.description}</p>
                      )}
                      {log.photoUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-berber-border max-w-xs shadow-sm">
                          <img src={log.photoUrl} alt="Progress Proof" className="w-full h-auto object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-berber-text-muted">
                Your bespoke commission has been received. Atelier activity will be logged here as craft begins.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
