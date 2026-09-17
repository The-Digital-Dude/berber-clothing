import Link from "next/link"
import { ArrowRight } from "lucide-react"

const looks = [
  {
    title: "The Formal Edit",
    subtitle: "SS26 Collection",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
    href: "/shop?sort=newest",
  },
  {
    title: "Evening Silk",
    subtitle: "Women's Formal",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Boardroom Ready",
    subtitle: "Men's Suiting",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Festive Heritage",
    subtitle: "Ethnic Formal",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Structured Grace",
    subtitle: "Women's Co-ords",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Heritage Drop",
    subtitle: "Limited Edition",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
]

export default function LookbookPage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative h-[60vh] flex items-end overflow-hidden bg-berber-black">
        <img
          src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=2070&auto=format&fit=crop"
          alt="Berber Lookbook"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 px-8 md:px-16 pb-12 text-white">
          <p className="text-berber-gold font-bold tracking-[0.2em] text-xs uppercase mb-3">Season 2026</p>
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-none mb-4">Lookbook</h1>
          <p className="text-lg text-gray-300 max-w-md">
            Formal elegance for every occasion. Rooted in craft, dressed for the moment.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look, i) => (
            <Link
              key={i}
              href={look.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl block bg-berber-muted"
            >
              <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-berber-gold mb-1">{look.subtitle}</p>
                <h3 className="text-2xl font-heading font-bold mb-3">{look.title}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-0.5 group-hover:border-berber-gold group-hover:text-berber-gold transition-colors">
                  Shop Look <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
