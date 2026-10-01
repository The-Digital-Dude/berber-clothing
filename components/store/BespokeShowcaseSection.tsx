"use client"

import Link from "next/link"
import { Scissors, Sparkles, Building, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"

const HIGHLIGHT_FABRICS = [
  {
    name: "Midnight Navy Super 150s",
    mill: "Vitale Barberis Canonico (Italy)",
    tag: "Boardroom & Wedding",
    color: "#1a2436",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Barathea Formal Onyx",
    mill: "Scabal (Savile Row / England)",
    tag: "Black Tie Gala",
    color: "#111215",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Sandstone Royal Irish Linen",
    mill: "Holland & Sherry (Scotland)",
    tag: "Summer & Destination",
    color: "#d1c2a5",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Charcoal Herringbone Worsted",
    mill: "Loro Piana (Italy)",
    tag: "Timeless Executive",
    color: "#2b2e34",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
  },
]

export default function BespokeShowcaseSection() {
  return (
    <section className="w-full bg-berber-bg text-berber-text py-20 lg:py-28 relative overflow-hidden border-t border-b border-berber-border">
      {/* Subtle ambient luxury glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-berber-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-berber-black/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest">
            <Scissors className="w-3.5 h-3.5 text-berber-gold" />
            Berber Sartorial House
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-berber-black tracking-tight leading-tight">
            Handcrafted Bespoke Suits & Made-to-Measure
          </h2>
          <p className="text-sm md:text-base text-berber-text-muted max-w-2xl mx-auto leading-relaxed">
            Rooted in artisanal Savile Row standards and Italian tailoring. Custom craft your one-of-a-kind garment online or book a private fitting consultation at our Banani Flagship Atelier.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-berber-surface border border-berber-border rounded-2xl p-5 space-y-2 shadow-berber">
            <span className="text-berber-gold font-mono font-bold text-sm block">01 / FIT</span>
            <h4 className="font-bold text-berber-black text-sm">30+ Precision Measurements</h4>
            <p className="text-xs text-berber-text-muted">Custom paper pattern drafted exclusively for your anatomical posture.</p>
          </div>

          <div className="bg-berber-surface border border-berber-border rounded-2xl p-5 space-y-2 shadow-berber">
            <span className="text-berber-gold font-mono font-bold text-sm block">02 / CLOTH</span>
            <h4 className="font-bold text-berber-black text-sm">500+ European Mills</h4>
            <p className="text-xs text-berber-text-muted">Super 130s–180s wools, Irish linens, and silks from Loro Piana, VBC, & Scabal.</p>
          </div>

          <div className="bg-berber-surface border border-berber-border rounded-2xl p-5 space-y-2 shadow-berber">
            <span className="text-berber-gold font-mono font-bold text-sm block">03 / CRAFT</span>
            <h4 className="font-bold text-berber-black text-sm">Full Floating Canvas</h4>
            <p className="text-xs text-berber-text-muted">Natural horsehair chest canvas that molds organically to your body over time.</p>
          </div>

          <div className="bg-berber-surface border border-berber-border rounded-2xl p-5 space-y-2 shadow-berber">
            <span className="text-berber-gold font-mono font-bold text-sm block">04 / ATELIER</span>
            <h4 className="font-bold text-berber-black text-sm">Banani Flagship Lounge</h4>
            <p className="text-xs text-berber-text-muted">Private VIP fitting suites with master tailors, cloth bolts, and espresso bar.</p>
          </div>
        </div>

        {/* Featured Fabric Swatches */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-bold text-berber-black">Curated Mill Fabrics</h3>
            <Link href="/bespoke/builder" className="text-xs font-semibold text-berber-gold hover:text-yellow-600 flex items-center gap-1 transition">
              Explore 50+ Swatches in 3D Studio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HIGHLIGHT_FABRICS.map((f) => (
              <div
                key={f.name}
                className="group relative rounded-2xl overflow-hidden border border-berber-border bg-berber-surface flex flex-col justify-end aspect-[4/5] p-5 shadow-berber"
              >
                {/* Background Image with Dark Vignette */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${f.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-berber-black/90 via-berber-black/40 to-transparent" />

                <div className="relative z-10 space-y-1 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-berber-gold">
                    {f.tag}
                  </span>
                  <h4 className="font-bold text-sm text-white">{f.name}</h4>
                  <p className="text-[11px] text-neutral-300">{f.mill}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual CTA Banner */}
        <div className="bg-berber-black text-white border border-berber-black rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-[0.25em] text-berber-gold font-semibold block">
              Flagship Banani Experience
            </span>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Prefer an In-Person Tailoring Session?
            </h3>
            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
              Book a complimentary 45-minute VIP styling slot at our House 12, Road 11, Banani Atelier. Our Master Tailor will take your 30+ precision measurements over freshly brewed espresso.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Link
              href="/bespoke/book-appointment"
              className="px-6 py-3.5 rounded-full bg-berber-gold hover:bg-yellow-600 text-white text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              Book Atelier Fitting
            </Link>
            <Link
              href="/bespoke/builder"
              className="px-6 py-3.5 rounded-full border border-white/40 hover:bg-white hover:text-berber-black text-white text-xs font-bold text-center transition flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              Launch Suit Studio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
