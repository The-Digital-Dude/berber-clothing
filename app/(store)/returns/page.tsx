import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Returns & Exchanges — Berber Clothing",
  description: "Our hassle-free returns and exchanges policy. Shop with confidence at Berber Clothing.",
}

export default function ReturnsPage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="bg-berber-black text-white py-20 px-4 text-center">
        <p className="text-berber-gold font-bold tracking-[0.2em] text-xs uppercase mb-4">Policy</p>
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">Returns & Exchanges</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Shop with full confidence. We make returns and exchanges straightforward, every time.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl space-y-10">

        {/* At a glance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Return Window", value: "7 Days", note: "from date of delivery" },
            { label: "Exchange Window", value: "14 Days", note: "size or colour swap" },
            { label: "Refund Processing", value: "3–5 Days", note: "after item received" },
          ].map((stat) => (
            <div key={stat.label} className="bg-berber-muted rounded-2xl p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted mb-1">{stat.label}</p>
              <p className="text-3xl font-heading font-bold text-berber-black">{stat.value}</p>
              <p className="text-xs text-berber-text-muted mt-1">{stat.note}</p>
            </div>
          ))}
        </div>

        {/* Eligibility */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Eligibility</h2>
          <ul className="space-y-2 text-sm text-berber-text-muted">
            <li className="flex gap-3"><span className="text-green-600 font-bold mt-0.5">✓</span> Item is unused, unworn, and unwashed</li>
            <li className="flex gap-3"><span className="text-green-600 font-bold mt-0.5">✓</span> Original tags and packaging intact</li>
            <li className="flex gap-3"><span className="text-green-600 font-bold mt-0.5">✓</span> Return initiated within 7 days of delivery</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold mt-0.5">✗</span> Sale items, custom orders, and intimate wear are final sale</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold mt-0.5">✗</span> Items showing signs of wear, alterations, or damage cannot be returned</li>
          </ul>
        </div>

        {/* How to Return */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">How to Initiate a Return</h2>
          <ol className="space-y-4">
            {[
              { step: "01", title: "Start your return", desc: "Log in to your Berber account and go to Orders → Return Item, or email returns@berberclothing.com with your order number and reason." },
              { step: "02", title: "Schedule pickup", desc: "We'll arrange a free pickup from your address within 2 business days. No need to visit a courier drop-off." },
              { step: "03", title: "Inspection & approval", desc: "Once received, our team inspects the item within 1 business day. You'll be notified by email of approval or any issue." },
              { step: "04", title: "Refund issued", desc: "Approved refunds are processed within 3–5 business days to your original payment method. bKash/Nagad refunds appear within 24 hours." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <span className="text-3xl font-heading font-bold text-berber-gold/40 leading-none shrink-0">{item.step}</span>
                <div>
                  <p className="font-bold text-berber-black text-sm">{item.title}</p>
                  <p className="text-sm text-berber-text-muted mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </ol>
        </div>

        {/* Exchanges */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Exchanges</h2>
          <p className="text-sm text-berber-text-muted leading-relaxed">
            Need a different size or colour? We offer free exchanges within 14 days of delivery. Simply initiate an exchange from your account or contact support. The replacement item ships as soon as we receive your return. If the new size is out of stock, we'll issue a full store credit valid for 12 months.
          </p>
        </div>

        {/* Damaged / Wrong Item */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Received a Damaged or Wrong Item?</h2>
          <p className="text-sm text-berber-text-muted leading-relaxed">
            We sincerely apologise. Please email photos of the item to support@berberclothing.com within 48 hours of delivery. We'll arrange an immediate replacement or full refund — including return shipping — at no cost to you.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-berber-muted rounded-2xl p-8 text-center space-y-3">
          <p className="font-bold text-berber-black">Need help with a return?</p>
          <p className="text-sm text-berber-text-muted">Our team is available Sunday–Thursday, 10 AM – 7 PM BST.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/account" className="px-6 py-3 bg-berber-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-berber-gold transition-colors">
              My Orders
            </Link>
            <a href="mailto:returns@berberclothing.com" className="px-6 py-3 border border-berber-border text-xs font-bold uppercase tracking-widest rounded-full hover:border-berber-black transition-colors">
              Email Returns Team
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
