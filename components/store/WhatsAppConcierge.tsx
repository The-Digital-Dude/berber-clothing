"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"

// Real WhatsApp glyph (not a lucide icon -- lucide has no brand marks) so the
// button is instantly recognizable rather than a generic speech bubble.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.004 2.667c-7.364 0-13.333 5.97-13.333 13.333 0 2.353.615 4.566 1.69 6.483L2.667 29.333l7.03-1.843a13.26 13.26 0 0 0 6.307 1.607h.006c7.363 0 13.333-5.97 13.333-13.334 0-3.56-1.387-6.907-3.903-9.424a13.246 13.246 0 0 0-9.436-3.672Zm0 24.4a11.03 11.03 0 0 1-5.62-1.54l-.403-.24-4.173 1.094 1.114-4.067-.263-.42a11.01 11.01 0 0 1-1.69-5.894c0-6.096 4.96-11.057 11.058-11.057 2.954 0 5.73 1.152 7.82 3.244a10.986 10.986 0 0 1 3.238 7.823c0 6.096-4.96 11.057-11.081 11.057Zm6.063-8.284c-.332-.167-1.966-.971-2.27-1.081-.305-.111-.527-.167-.749.166-.221.334-.858 1.082-1.052 1.304-.194.223-.388.25-.72.084-.332-.167-1.402-.517-2.67-1.649-.987-.882-1.654-1.97-1.848-2.304-.194-.333-.021-.513.146-.679.15-.15.333-.39.5-.584.166-.194.221-.334.332-.556.111-.223.055-.417-.028-.584-.083-.167-.748-1.804-1.026-2.472-.27-.65-.545-.562-.748-.572l-.637-.012c-.221 0-.582.083-.887.417-.305.334-1.163 1.137-1.163 2.773 0 1.636 1.19 3.217 1.357 3.439.166.222 2.342 3.576 5.674 5.016.793.342 1.411.547 1.893.7.795.253 1.519.217 2.09.132.638-.095 1.966-.804 2.244-1.581.277-.777.277-1.443.194-1.581-.083-.139-.305-.222-.637-.389Z" />
    </svg>
  )
}

export default function WhatsAppConcierge({ phone }: { phone: string }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Known spots where this button's fixed bottom-left position collides
    // with real interactive content, confirmed by hand:
    // - PDP's color/size selectors (VariantSelector.tsx, id="variant-selector")
    // - the homepage hero's Shop Now / View Lookbook buttons (id="hero-cta")
    // Hidden only while one of these is actually in view; pages without
    // either id are completely unaffected.
    const targets = ["variant-selector", "hero-cta"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (targets.length === 0) return

    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      })
      setHidden(visible.size > 0)
    }, { threshold: 0 })
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  // Close the menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close the menu whenever the page changes, so it doesn't stay open across navigation
  useEffect(() => setMenuOpen(false), [pathname])

  if (!phone) return null

  const normalized = phone.replace(/\D/g, "").replace(/^0/, "880").replace(/^(?!880)/, "880")
  const pageTitle = () => (typeof document !== "undefined" ? document.title.split("|")[0].trim() : "")
  const pageUrl = () => (typeof window !== "undefined" ? window.location.href : "")

  // /shop is the listing page (no specific item); /shop/<slug> and
  // /shop/bundle/<slug> are actual product/bundle detail pages -- only those
  // get the "about this product" option with the real page title plugged in,
  // so the message never claims a product context that isn't there (e.g. on
  // the homepage, cart, or shop listing).
  const isProductPage = pathname.startsWith("/shop/")

  const options = [
    isProductPage
      ? {
          label: "🛍️ Question about this product",
          message: () => `Hi Berber Clothing! I have a question about "${pageTitle()}" (${pageUrl()}). Could you help me?`,
        }
      : {
          label: "🛒 General shopping question",
          message: () => `Hi Berber Clothing! I have a question about your products — could you help me?`,
        },
    {
      label: "📦 Help with an existing order",
      message: () => `Hi Berber Clothing! I need help with an order I placed. Could someone assist me?`,
    },
    {
      label: "📏 Sizing & fit help",
      message: () => `Hi Berber Clothing! I'd like some help choosing the right size. Could you assist me?`,
    },
    {
      label: "💬 Something else",
      message: () => `Hi Berber Clothing! I have a question — could you help me?`,
    },
  ]

  const openWhatsApp = (message: string) => {
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
    setMenuOpen(false)
  }

  // bottom-40 matches the verified clearance above the mobile bottom nav
  // (h-16) + sticky add-to-bag bar (combined ~142px) -- same offset already
  // confirmed safe for the social-proof toast.
  return (
    <div ref={containerRef} className={`fixed z-40 bottom-40 left-4 md:bottom-6 transition-all ${hidden ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100"}`}>
      {menuOpen && (
        <div className="absolute bottom-16 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-berber-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-[#25D366] text-white px-4 py-3 flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5" />
            <span className="text-sm font-bold">Chat with Berber Clothing</span>
          </div>
          <div className="p-2">
            <p className="text-[11px] text-berber-text-muted px-2 pt-1 pb-2">What can we help you with?</p>
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => openWhatsApp(opt.message())}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-berber-black hover:bg-berber-muted transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close WhatsApp menu" : "Chat with us on WhatsApp"}
        title="Chat with us on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#1ebe5a] transition-colors hover:scale-105 active:scale-95"
      >
        {menuOpen ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7" />}
      </button>
    </div>
  )
}
