import { Metadata } from "next"
import Link from "next/link"
import { Scissors, Sparkles, ArrowRight, Building, Check, Layers, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Bespoke Sartorial Lookbook | Berber Tailoring House",
  description:
    "Explore iconic bespoke suiting silhouettes handcrafted for black-tie galas, royal weddings, and boardroom executive presence. Customize any signature look in 1 click.",
}

const SIGNATURE_LOOKS = [
  {
    id: "royal-tuxedo",
    title: "The Royal Imperial Dinner Suit",
    category: "Black Tie & Gala",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
    quote: "Pure sartorial drama. Satin shawl lapels crafted on Scabal English Barathea cloth.",
    fabricCode: "SCB-130-BLK",
    fabricName: "Onyx Black Formal Barathea (Scabal England)",
    garmentType: "TUXEDO",
    breasting: "SB_1",
    lapel: "SHAWL",
    pocket: "JETTED",
    button: "MOP_SMOKE",
    lining: "SILK_CRIMSON",
    waistband: "GURKHA",
    pleat: "FLAT",
    hem: "PLAIN",
    basePrice: "৳32,500",
    tags: ["Scabal England", "Shawl Collar", "Silk Barathea"],
  },
  {
    id: "savile-row-db",
    title: "The Savile Row Double-Breasted",
    category: "Boardroom & Executive",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
    quote: "A commanding 6x2 silhouette with sweeping 3.75\" peak lapels and equestrian ticket pocket.",
    fabricCode: "VBC-150-NVY",
    fabricName: "Midnight Navy Super 150s (VBC Italy)",
    garmentType: "TWO_PIECE_SUIT",
    breasting: "DB_6_2",
    lapel: "PEAK",
    pocket: "SLANTED_TICKET",
    button: "HORN_DARK",
    lining: "PAISLEY_GOLD",
    waistband: "SIDE_ADJUSTERS",
    pleat: "SINGLE_PLEAT",
    hem: "CUFF_1_5",
    basePrice: "৳27,800",
    tags: ["Vitale Barberis Canonico", "Double-Breasted", "Peak Lapel"],
  },
  {
    id: "capri-linen",
    title: "The Capri Riviera Destination Suit",
    category: "Summer Wedding & Resort",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=800&auto=format&fit=crop",
    quote: "Effortless Mediterranean luxury in pure unconstructed Irish linen with relaxed patch pockets.",
    fabricCode: "HL-LIN-SND",
    fabricName: "Sandstone Royal Irish Linen (Holland & Sherry)",
    garmentType: "TWO_PIECE_SUIT",
    breasting: "SB_2",
    lapel: "NOTCH",
    pocket: "PATCH",
    button: "HORN_AMBER",
    lining: "SILK_NAVY",
    waistband: "SIDE_ADJUSTERS",
    pleat: "FLAT",
    hem: "CUFF_2",
    basePrice: "৳24,500",
    tags: ["Holland & Sherry", "Irish Linen", "Patch Pockets"],
  },
  {
    id: "emerald-velvet",
    title: "The Imperial Emerald Gala Blazer",
    category: "Evening Gala & Reception",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    quote: "Deep jewel-tone plush cotton velvet with contrasting silk grosgrain collar.",
    fabricCode: "VBC-130-EMR",
    fabricName: "Imperial Emerald Cotton Velvet (Reda Italy)",
    garmentType: "BLAZER_ONLY",
    breasting: "SB_1",
    lapel: "SHAWL",
    pocket: "JETTED",
    button: "COROZO_NAVY",
    lining: "FLORAL_ART",
    waistband: "BELT_LOOPS",
    pleat: "FLAT",
    hem: "PLAIN",
    basePrice: "৳21,500",
    tags: ["Italian Velvet", "Evening Wear", "Bespoke Lining"],
  },
  {
    id: "mayfair-charcoal",
    title: "The Mayfair 3-Piece Silk-Wool",
    category: "Formal Wedding & Ascot",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    quote: "Refined worsted herringbone paired with a matching sculpted horseshoe waistcoat.",
    fabricCode: "LP-160-CHR",
    fabricName: "Charcoal Herringbone Worsted (Loro Piana Italy)",
    garmentType: "THREE_PIECE_SUIT",
    breasting: "SB_2",
    lapel: "PEAK",
    pocket: "FLAP",
    button: "HORN_DARK",
    lining: "SILK_NAVY",
    waistband: "GURKHA",
    pleat: "DOUBLE_PLEAT",
    hem: "CUFF_1_5",
    basePrice: "৳34,000",
    tags: ["Loro Piana Italy", "3-Piece Suit", "Gurkha Trousers"],
  },
  {
    id: "florentine-houndstooth",
    title: "The Florentine Houndstooth Sport Coat",
    category: "Smart Casual & Weekend",
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=800&auto=format&fit=crop",
    quote: "Neapolitan soft shoulder, horn buttons, and breathable all-season wool blend.",
    fabricCode: "LP-160-CHR",
    fabricName: "Micro Houndstooth (Vitale Barberis Canonico)",
    garmentType: "BLAZER_ONLY",
    breasting: "SB_2",
    lapel: "NOTCH",
    pocket: "PATCH",
    button: "HORN_AMBER",
    lining: "PAISLEY_GOLD",
    waistband: "SIDE_ADJUSTERS",
    pleat: "FLAT",
    hem: "PLAIN",
    basePrice: "৳19,500",
    tags: ["Soft Shoulder", "Artisan Blazer", "Italian Drape"],
  },
]

export default function LookbookPage() {
  return (
    <div className="w-full bg-berber-bg min-h-screen text-berber-text">
      {/* Editorial Header */}
      <section className="relative py-16 md:py-24 border-b border-berber-border overflow-hidden bg-berber-surface">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest">
            <Scissors className="w-3.5 h-3.5 text-berber-gold" />
            Berber Sartorial Lookbook
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-berber-black tracking-tight">
            Iconic Bespoke Silhouettes
          </h1>
          <p className="text-sm md:text-base text-berber-text-muted max-w-2xl mx-auto leading-relaxed">
            Curated sartorial blueprints drafted for discerning gentlemen. Load any signature look directly into our 3D Studio to personalize cloth, linings, waistbands, and monogramming.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-berber-black">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-berber-gold" />
              1-Click 3D Customizer Loading
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-berber-gold" />
              Savile Row & Italian Canvassing
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-berber-gold" />
              Banani Atelier Private Fittings
            </span>
          </div>
        </div>
      </section>

      {/* Signature Looks Editorial Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SIGNATURE_LOOKS.map((look) => {
            const customizeUrl = `/bespoke/builder?garment=${look.garmentType}&fabric=${look.fabricCode}&breasting=${look.breasting}&lapel=${look.lapel}&pocket=${look.pocket}&button=${look.button}&lining=${look.lining}&waistband=${look.waistband}&pleat=${look.pleat}&hem=${look.hem}`

            return (
              <div
                key={look.id}
                className="bg-berber-surface border border-berber-border rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-berber-gold hover:shadow-xl group"
              >
                {/* Visual Editorial Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${look.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-berber-black/85 via-berber-black/20 to-transparent" />

                  {/* Category Pill */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-berber-surface/90 backdrop-blur-md border border-berber-border text-berber-black font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {look.category}
                    </span>
                  </div>

                  {/* Quote Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                    <p className="text-xs italic text-neutral-200 line-clamp-2">"{look.quote}"</p>
                    <span className="text-[11px] font-mono font-bold text-berber-gold block">
                      From {look.basePrice}
                    </span>
                  </div>
                </div>

                {/* Spec Details */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-berber-black group-hover:text-berber-gold transition-colors">
                      {look.title}
                    </h3>
                    <p className="text-xs font-medium text-berber-text-muted">{look.fabricName}</p>

                    {/* Sartorial Tag Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {look.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-berber-muted border border-berber-border text-berber-text px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-4 border-t border-berber-border space-y-2">
                    <Link
                      href={customizeUrl}
                      className="w-full bg-berber-gold hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Customize in 3D Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </Link>

                    <Link
                      href="/bespoke/book-appointment"
                      className="w-full bg-white hover:bg-berber-muted border border-berber-border text-berber-black font-medium py-2.5 px-4 rounded-full text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Building className="w-3.5 h-3.5 text-berber-gold" />
                      <span>Book Banani Atelier Fitting</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Flagship Showroom Banner */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-berber-black text-white border border-berber-black rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-[0.25em] text-berber-gold font-semibold block">
              Flagship Banani Experience
            </span>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Prefer an In-Person Master Fitting?
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
              <Building className="w-4 h-4" />
              Book Atelier Fitting
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
