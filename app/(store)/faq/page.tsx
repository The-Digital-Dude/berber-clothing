import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ — Berber Clothing",
  description: "Frequently asked questions about orders, shipping, returns, and care at Berber Clothing.",
}

const faqs = [
  {
    category: "Orders & Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept bKash, Nagad, Rocket, all major credit & debit cards (Visa, Mastercard), and Cash on Delivery (COD) across Bangladesh.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Orders can be modified or cancelled within 2 hours of placement. After that, the order enters our fulfilment queue. Contact us immediately at support@berberclothing.com or via WhatsApp.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes — COD is available for all orders within Bangladesh. A BDT 60 COD handling fee applies per order.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Dhaka metropolitan: 1–2 business days. Outside Dhaka: 3–5 business days. Express same-day delivery is available in Dhaka for orders placed before 12 PM.",
      },
      {
        q: "Do you ship outside Bangladesh?",
        a: "International shipping to the UK, US, Canada, and the UAE is available. Delivery takes 7–14 business days depending on destination. Duties and taxes are the buyer's responsibility.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you'll receive an SMS and email with your tracking number. You can also track orders in real time at berberclothing.com/track.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer hassle-free returns within 7 days of delivery for unused items in their original packaging. Sale items are final sale.",
      },
      {
        q: "How do I initiate a return or exchange?",
        a: "Email returns@berberclothing.com with your order number and reason, or use the Returns portal on your Account page. We'll arrange a pickup within 2 business days.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 3–5 business days of receiving the returned item. For bKash/Nagad, funds appear within 24 hours of processing.",
      },
    ],
  },
  {
    category: "Product & Care",
    items: [
      {
        q: "How do I find my size?",
        a: "Visit our detailed Size Guide page which includes measurements in inches and centimetres for all categories — suits, shirts, trousers, and ethnic wear.",
      },
      {
        q: "How should I care for my Berber garments?",
        a: "Most formal fabrics are dry-clean only. Where machine washing is safe, use a gentle cool cycle inside a mesh laundry bag. Full care instructions appear on each garment label and product page.",
      },
      {
        q: "Are your fabrics ethically sourced?",
        a: "Yes. All Berber fabrics are sourced from certified mills across Bangladesh and South Asia. We work exclusively with suppliers that meet fair-wage and environmental standards.",
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="bg-berber-black text-white py-20 px-4 text-center">
        <p className="text-berber-gold font-bold tracking-[0.2em] text-xs uppercase mb-4">Support</p>
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Everything you need to know about shopping with Berber — from orders and shipping to returns and care.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl space-y-14">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold mb-6 pb-2 border-b border-berber-border">
              {section.category}
            </h2>
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q} className="space-y-2">
                  <h3 className="font-bold text-berber-black text-sm">{item.q}</h3>
                  <p className="text-sm text-berber-text-muted leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-berber-muted rounded-2xl p-8 text-center space-y-3">
          <p className="font-bold text-berber-black">Still have questions?</p>
          <p className="text-sm text-berber-text-muted">Our team is available Sunday–Thursday, 10 AM – 7 PM (BST).</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href="mailto:support@berberclothing.com" className="px-6 py-3 bg-berber-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-berber-gold transition-colors">
              Email Us
            </a>
            <a href="/contact" className="px-6 py-3 border border-berber-border text-xs font-bold uppercase tracking-widest rounded-full hover:border-berber-black transition-colors">
              Contact Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
