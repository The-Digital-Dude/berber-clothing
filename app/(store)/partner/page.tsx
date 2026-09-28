"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Users2,
  TrendingUp,
  Truck,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ShoppingBag,
  Share2,
  DollarSign,
  HelpCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PartnerPage() {
  const [openModal, setOpenModal] = useState(false)
  const [partnerType, setPartnerType] = useState<"AFFILIATE" | "RESELLER" | "BOTH">("BOTH")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    shopName: "",
    facebookPage: "",
    website: "",
    payoutMethod: "BKASH",
    payoutNumber: "",
    bankName: "",
    bankAccountNumber: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, partnerType }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Welcome to the Berber Partner Program!")
        setSubmitted(true)
      } else {
        toast.error(data.error || "Application submission failed")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-berber-surface text-berber-text">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-berber-border bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_50%)] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Berber Partner & Dropship Network
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight leading-tight">
            Earn With Premium Fashion. <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              Affiliate Links & Zero-Stock Reselling.
            </span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Partner with Bangladesh's fastest growing premium clothing label. Share your referral links or dropship directly to your customers with custom shop branding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => setOpenModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-extrabold px-8 h-12 rounded-xl shadow-lg cursor-pointer flex items-center gap-2 text-sm"
            >
              Apply as Partner Now <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/account">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white h-12 rounded-xl text-sm font-semibold"
              >
                Go to Partner Desk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two Powerful Ways to Earn */}
      <section className="py-16 md:py-20 container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900">
            Two Ways to Monetize Your Audience
          </h2>
          <p className="text-sm text-zinc-500">
            Choose what fits your business best, or do both simultaneously from one dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Affiliate Program Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xs space-y-6 flex flex-col justify-between hover:border-amber-400/80 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">1. Influencer & Affiliate Program</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Ideal for content creators, bloggers, and fashion influencers. Share your unique link or custom coupon with your followers and earn automated commissions on every completed purchase.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>10% Commission</strong> on every delivered customer order</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>30-Day Cookie Tracking</strong> + custom discount coupon attribution</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Instant bKash, Nagad, or Bank Transfer cashouts</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => {
                setPartnerType("AFFILIATE")
                setOpenModal(true)
              }}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Start as Affiliate
            </Button>
          </div>

          {/* Reseller Dropshipping Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xs space-y-6 flex flex-col justify-between hover:border-amber-400/80 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">2. Reseller Dropshipping Hub</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Run your own fashion business with zero inventory. You get exclusive wholesale pricing (15%+ off catalog). Place orders for your customers with your shop name as the sender, and we handle packaging, delivery & COD collection.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>15%+ Wholesale Discount</strong> on all catalog items</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Custom Sender Branding</strong> (Delivered under your shop name)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Automated COD Profit Crediting</strong> upon customer delivery</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => {
                setPartnerType("RESELLER")
                setOpenModal(true)
              }}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Start as Reseller
            </Button>
          </div>
        </div>
      </section>

      {/* How Reseller Dropshipping Works */}
      <section className="py-16 bg-zinc-100/70 border-y border-zinc-200">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900">
              How the Dropshipping Desk Works
            </h2>
            <p className="text-xs text-zinc-500">
              Four simple steps from placing customer orders to receiving net profits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-sm text-zinc-900">Choose Products</h4>
              <p className="text-xs text-zinc-500">
                Browse our real-time inventory at discounted wholesale base rates.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-sm text-zinc-900">Set Retail Price</h4>
              <p className="text-xs text-zinc-500">
                Enter your customer's delivery details and your custom selling price.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-sm text-zinc-900">Confirm Advance Fee</h4>
              <p className="text-xs text-zinc-500">
                Confirm order with advance delivery fee (1-click from wallet or bKash).
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">4</span>
              <h4 className="font-bold text-sm text-zinc-900">Get Paid Profits</h4>
              <p className="text-xs text-zinc-500">
                Berber delivers COD. Net profit is instantly credited to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Dialog Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg w-[94vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-amber-600" />
              <span>Partner & Reseller Application</span>
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Application Approved!</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Your partner account is ready. You can now access your affiliate links and reseller dropship desk from your account portal.
              </p>
              <Link href="/account">
                <Button className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl">
                  Open Partner Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Partner Type Selection */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">I Want To Join As *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartnerType("BOTH")}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      partnerType === "BOTH"
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    Both (Affiliate & Reseller)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerType("RESELLER")}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      partnerType === "RESELLER"
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    Reseller / Dropship
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerType("AFFILIATE")}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      partnerType === "AFFILIATE"
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    Affiliate / Link
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Your Name *</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full Name"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Contact Phone *</label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="017XXXXXXXX"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Account Email *</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Shop / Page Name (For Resellers)</label>
                <Input
                  value={form.shopName}
                  onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  placeholder="e.g. Trendy Outfit BD"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Facebook Page / Instagram Profile</label>
                <Input
                  value={form.facebookPage}
                  onChange={(e) => setForm((f) => ({ ...f, facebookPage: e.target.value }))}
                  placeholder="https://facebook.com/your-shop"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              {/* Payout Information */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <label className="font-bold uppercase tracking-wider text-zinc-700 text-[10px]">Withdrawal Payout Details</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.payoutMethod}
                    onChange={(e) => setForm((f) => ({ ...f, payoutMethod: e.target.value }))}
                    className="h-9 px-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-800"
                  >
                    <option value="BKASH">bKash (Personal)</option>
                    <option value="NAGAD">Nagad (Personal)</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK">Bank Account</option>
                  </select>
                  <Input
                    value={form.payoutNumber}
                    onChange={(e) => setForm((f) => ({ ...f, payoutNumber: e.target.value }))}
                    placeholder="bKash / Nagad Number"
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Partner Application"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
