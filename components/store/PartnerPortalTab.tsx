"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Wallet,
  Share2,
  Copy,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Layers,
  ArrowRight,
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

export default function PartnerPortalTab() {
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "reseller_desk" | "orders" | "payouts">("overview")

  // Payout Request Modal
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("BKASH")
  const [payoutAccount, setPayoutAccount] = useState("")
  const [payoutLoading, setPayoutLoading] = useState(false)

  // Reseller Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [orderQty, setOrderQty] = useState(1)
  const [customerUnitPrice, setCustomerUnitPrice] = useState<number>(0)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerArea, setCustomerArea] = useState("Inside Dhaka")
  const [senderShopName, setSenderShopName] = useState("")
  const [advanceMethod, setAdvanceMethod] = useState<"WALLET" | "MANUAL">("WALLET")
  const [advanceTrxId, setAdvanceTrxId] = useState("")
  const [orderSubmitting, setOrderSubmitting] = useState(false)

  // Load Partner profile
  const fetchPartner = () => {
    fetch("/api/partner/me")
      .then((r) => r.json())
      .then((d) => {
        setPartner(d.partner || null)
        if (d.partner?.shopName) setSenderShopName(d.partner.shopName)
        if (d.partner?.payoutNumber) setPayoutAccount(d.partner.payoutNumber)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPartner()
  }, [])

  // Load Reseller products when opening desk
  const fetchResellerProducts = () => {
    fetch("/api/reseller/products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || [])
        if (d.products?.length > 0 && !selectedProductId) {
          setSelectedProductId(d.products[0].id)
          setCustomerUnitPrice(d.products[0].retailPrice)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (activeSubTab === "reseller_desk" || orderModalOpen) {
      fetchResellerProducts()
    }
  }, [activeSubTab, orderModalOpen])

  // Selected product details for dropship calculation
  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const selectedVariant = selectedProduct?.variants?.find((v: any) => v.id === selectedVariantId) || selectedProduct?.variants?.[0]
  const baseCost = selectedVariant?.wholesalePrice || selectedProduct?.wholesaleBasePrice || 0
  const totalBaseCost = baseCost * orderQty
  const totalCustomerRetail = (customerUnitPrice || selectedProduct?.retailPrice || 0) * orderQty
  const shippingCharge = customerArea.includes("Inside") ? 120 : 150
  const estimatedProfit = totalCustomerRetail - totalBaseCost

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault()
    setPayoutLoading(true)
    try {
      const res = await fetch("/api/partner/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          method: payoutMethod,
          accountDetails: payoutAccount,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(
          payoutMethod === "STORE_CREDIT"
            ? `Successfully converted ৳${payoutAmount} to Store Credit (+5% bonus)!`
            : "Payout request submitted successfully!"
        )
        setPayoutOpen(false)
        setPayoutAmount("")
        fetchPartner()
      } else {
        toast.error(d.error || "Failed to submit payout request")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setPayoutLoading(false)
    }
  }

  async function handleCreateDropshipOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProductId) {
      toast.error("Please select a product")
      return
    }
    setOrderSubmitting(true)
    try {
      const res = await fetch("/api/reseller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerArea,
          senderShopName,
          advancePaymentMethod: advanceMethod,
          advanceTrxId: advanceMethod === "MANUAL" ? advanceTrxId : undefined,
          items: [
            {
              productId: selectedProductId,
              variantId: selectedVariant?.id,
              size: selectedVariant?.size,
              color: selectedVariant?.color,
              quantity: orderQty,
              customerUnitPrice: customerUnitPrice || selectedProduct?.retailPrice,
            },
          ],
        }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(
          d.isAdvancePaid
            ? "Dropship order placed and confirmed via Advance Delivery Fee!"
            : "Dropship order created! Awaiting advance delivery charge."
        )
        setOrderModalOpen(false)
        // Reset form
        setCustomerName("")
        setCustomerPhone("")
        setCustomerAddress("")
        setAdvanceTrxId("")
        fetchPartner()
        setActiveSubTab("orders")
      } else {
        toast.error(d.error || "Failed to place dropship order")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setOrderSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <p className="text-xs">Loading Partner Dashboard…</p>
      </div>
    )
  }

  // If user doesn't have an affiliate/partner account yet
  if (!partner) {
    return (
      <div className="p-8 md:p-10 rounded-3xl border border-zinc-200 bg-white shadow-2xs space-y-6 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 font-heading">Join Berber Partner & Reseller Program</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Earn 10% affiliate commissions on every referral or start your zero-stock clothing business with 15%+ wholesale discounts and automated COD profit payouts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/partner">
            <Button className="w-full sm:w-auto h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl px-6">
              Learn More & Apply
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const walletBalance = Number(partner.walletBalance || 0)
  const totalEarned = Number(partner.totalEarned || 0)
  const totalPaid = Number(partner.totalPaid || 0)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const referralUrl = `${origin}?ref=${partner.code}`

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl border border-zinc-200/90 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
              {partner.partnerType} Partner
            </span>
            <span className="text-xs text-zinc-400 font-mono">Code: {partner.code}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white">
            {partner.shopName || partner.name}&apos;s Partner Desk
          </h2>
          <p className="text-xs text-zinc-400">
            Wholesale Discount: <strong>{Number(partner.resellerDiscountPct || 15)}%</strong> · Affiliate Rate: <strong>{Number(partner.commissionValue || 10)}%</strong>
          </p>
        </div>

        {/* Wallet Balance & Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 text-left">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Available Wallet Balance</span>
            <span className="text-2xl font-mono font-extrabold text-white block mt-0.5">
              ৳{walletBalance.toLocaleString()}
            </span>
          </div>
          <Button
            onClick={() => setPayoutOpen(true)}
            className="h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-2xl shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" /> Withdraw / Credit
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === "overview"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Partner Overview & Links
        </button>
        <button
          onClick={() => setActiveSubTab("reseller_desk")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "reseller_desk"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Dropship Desk
        </button>
        <button
          onClick={() => setActiveSubTab("orders")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "orders"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Dropship Orders ({partner.resellerOrders?.length || 0})
        </button>
        <button
          onClick={() => setActiveSubTab("payouts")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "payouts"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Payout History
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & LINKS */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Referral Link & Coupon Card */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-600" /> Referral Tracking URL
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">30-Day Cookie</span>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralUrl}
                  className="h-9 text-xs font-mono bg-zinc-50 rounded-xl"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(referralUrl)
                    toast.success("Referral link copied!")
                  }}
                  className="h-9 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Share this link on your WhatsApp, Instagram Bio, or YouTube. Earn 10% on every order!
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs space-y-3">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Linked Influencer Coupon
              </span>
              {partner.coupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div>
                    <span className="font-mono font-extrabold text-amber-900 text-sm">{partner.coupon.code}</span>
                    <p className="text-[10px] text-amber-700">
                      Gives customer {partner.coupon.type === "PERCENTAGE" ? `${partner.coupon.value}% off` : `৳${partner.coupon.value} off`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(partner.coupon.code)
                      toast.success(`Coupon code ${partner.coupon.code} copied!`)
                    }}
                    className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                  >
                    Copy Code
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500">
                  No exclusive coupon attached yet. Share your referral link above!
                </div>
              )}
            </div>
          </div>

          {/* Metric Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs text-center">
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Link Clicks</span>
              <span className="text-2xl font-bold font-mono text-zinc-900 mt-1 block">
                {partner._count?.clicks || 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs text-center">
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Conversions</span>
              <span className="text-2xl font-bold font-mono text-zinc-900 mt-1 block">
                {partner._count?.conversions || 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs text-center">
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Dropship Orders</span>
              <span className="text-2xl font-bold font-mono text-indigo-700 mt-1 block">
                {partner._count?.resellerOrders || 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs text-center">
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">Total Lifetime Earnings</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                ৳{totalEarned.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RESELLER DROPSHIP DESK */}
      {activeSubTab === "reseller_desk" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-200/80">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-indigo-950">Reseller Order Desk</h3>
              <p className="text-xs text-indigo-700">
                You receive <strong>{Number(partner.resellerDiscountPct || 15)}% wholesale discount</strong>. Place an order for your customer; we ship directly with your shop name as the sender.
              </p>
            </div>
            <Button
              onClick={() => setOrderModalOpen(true)}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Dropship Order
            </Button>
          </div>

          {/* Wholesale Catalog Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Available Wholesale Catalog</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 relative">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{p.category}</span>
                      <h5 className="font-bold text-xs text-zinc-900 line-clamp-1">{p.name}</h5>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block line-through">Retail: ৳{p.retailPrice}</span>
                      <span className="text-xs font-bold font-mono text-emerald-700 block">Wholesale: ৳{p.wholesaleBasePrice}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProductId(p.id)
                        setCustomerUnitPrice(p.retailPrice)
                        setOrderModalOpen(true)
                      }}
                      className="h-8 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Sell This Piece
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DROPSHIP ORDERS */}
      {activeSubTab === "orders" && (
        <div className="p-6 rounded-3xl border border-zinc-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Your Dropship Orders</h3>
              <p className="text-xs text-zinc-500">Track shipment status, advance fee confirmations, and earned COD profits</p>
            </div>
            <Button
              onClick={() => setOrderModalOpen(true)}
              size="sm"
              className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> New Order
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-zinc-600 font-bold">
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Products</th>
                  <th className="p-3">Advance Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Your Profit</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {partner.resellerOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      No dropship orders placed yet. Click &quot;New Order&quot; to start.
                    </td>
                  </tr>
                ) : (
                  partner.resellerOrders?.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-zinc-900">{ord.orderNumber}</td>
                      <td className="p-3">
                        <span className="font-bold text-zinc-800 block">{ord.shippingName}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{ord.shippingPhone}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-zinc-700">{ord.items?.[0]?.productName || "Product"}</span>
                        {ord.items?.length > 1 && <span className="text-zinc-400"> +{ord.items.length - 1} more</span>}
                      </td>
                      <td className="p-3">
                        {ord.advancePaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> ৳{ord.advanceCharge} Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> ৳{ord.advanceCharge} Due
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-zinc-100 text-zinc-700">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        ৳{Number(ord.resellerProfit || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-zinc-400 font-mono text-[11px]">
                        {new Date(ord.createdAt).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PAYOUTS */}
      {activeSubTab === "payouts" && (
        <div className="p-6 rounded-3xl border border-zinc-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Withdrawal & Payout History</h3>
              <p className="text-xs text-zinc-500">Track all cashout requests and store credit conversions</p>
            </div>
            <Button
              onClick={() => setPayoutOpen(true)}
              size="sm"
              className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" /> Request Payout
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-zinc-600 font-bold">
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Account / Recipient</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3 text-right">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {partner.payoutRequests?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400">
                      No payout requests yet.
                    </td>
                  </tr>
                ) : (
                  partner.payoutRequests?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-zinc-900">৳{Number(p.amount).toLocaleString()}</td>
                      <td className="p-3 font-bold text-zinc-700">{p.method}</td>
                      <td className="p-3 text-zinc-600 font-mono text-[11px]">{p.accountDetails}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-500 text-[11px]">{p.transactionId || "-"}</td>
                      <td className="p-3 text-right text-zinc-400 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md w-[94vw] p-0 rounded-3xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>Withdraw Partner Earnings</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRequestPayout} className="p-6 space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <span className="text-xs text-amber-900 font-medium">Available Balance:</span>
              <span className="font-mono font-extrabold text-amber-950 text-base">৳{walletBalance.toLocaleString()}</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Withdrawal Method *</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800"
              >
                <option value="BKASH">bKash (Personal)</option>
                <option value="NAGAD">Nagad (Personal)</option>
                <option value="ROCKET">Rocket</option>
                <option value="BANK">Bank Account</option>
                <option value="STORE_CREDIT">Convert to Store Credit (+5% Bonus! 🎁)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Amount to Withdraw (৳) *</label>
              <Input
                type="number"
                required
                min={100}
                max={walletBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Min ৳100"
                className="h-9 text-xs rounded-xl font-mono font-bold"
              />
            </div>

            {payoutMethod !== "STORE_CREDIT" && (
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Recipient Phone / Account Details *</label>
                <Input
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX or Bank details"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={payoutLoading || walletBalance < 100}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payout Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE DROPSHIP ORDER MODAL */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="sm:max-w-xl w-[94vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Place Dropship Order for Customer</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateDropshipOrder} className="p-6 space-y-4 text-xs">
            {/* 1. Product Selection */}
            <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <label className="font-bold uppercase tracking-wider text-zinc-700 text-[10px]">1. Select Product & Variant</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  const prod = products.find((p) => p.id === e.target.value)
                  if (prod) setCustomerUnitPrice(prod.retailPrice)
                }}
                className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Wholesale Base: ৳{p.wholesaleBasePrice} (Retail: ৳{p.retailPrice})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold">Size & Color Variant</label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs"
                  >
                    {selectedProduct?.variants?.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.size} / {v.color} ({v.stock} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 text-xs rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Selling Price & Profit Calculation */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-emerald-900 text-[10px]">2. Your Selling Price & Margin</span>
                <span className="text-[10px] text-emerald-700 font-mono">Wholesale Base: ৳{totalBaseCost}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-emerald-800 font-medium">Customer Unit Price (৳):</label>
                  <Input
                    type="number"
                    min={baseCost}
                    value={customerUnitPrice}
                    onChange={(e) => setCustomerUnitPrice(Number(e.target.value) || 0)}
                    className="h-8 text-xs font-mono font-bold bg-white rounded-lg"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 block">Your Estimated Profit:</span>
                  <span className="text-base font-bold font-mono text-emerald-950 block">
                    ৳{estimatedProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Customer Shipping Information */}
            <div className="space-y-2">
              <label className="font-bold uppercase tracking-wider text-zinc-700 text-[10px]">3. Customer Delivery Details</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Full Name"
                  className="h-9 text-xs rounded-xl"
                />
                <Input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Customer Phone Number"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
              <Input
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Full Street / House / Road Address"
                className="h-9 text-xs rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={customerArea}
                  onChange={(e) => setCustomerArea(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium"
                >
                  <option value="Inside Dhaka">Inside Dhaka (৳120 Advance Delivery)</option>
                  <option value="Outside Dhaka">Outside Dhaka (৳150 Advance Delivery)</option>
                </select>
                <Input
                  value={senderShopName}
                  onChange={(e) => setSenderShopName(e.target.value)}
                  placeholder="Sender Shop Name (Your Brand)"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* 4. Advance Delivery Confirmation */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-zinc-700 text-[10px]">
                  4. Advance Delivery Fee (৳{shippingCharge})
                </span>
                <span className="text-[10px] text-zinc-400">Required to prevent fake RTO orders</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceMethod("WALLET")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    advanceMethod === "WALLET"
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-700"
                  }`}
                >
                  <span className="font-bold block text-[11px]">1-Click Wallet</span>
                  <span className="text-[10px] opacity-75 block">Balance: ৳{walletBalance}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdvanceMethod("MANUAL")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    advanceMethod === "MANUAL"
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-700"
                  }`}
                >
                  <span className="font-bold block text-[11px]">bKash / Nagad TrxID</span>
                  <span className="text-[10px] opacity-75 block">Manual Verification</span>
                </button>
              </div>

              {advanceMethod === "MANUAL" && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <p className="text-[10px] text-zinc-500">
                    Send ৳{shippingCharge} to <strong>017XXXXXXXX</strong> (bKash/Nagad Send Money) and enter Transaction ID:
                  </p>
                  <Input
                    required
                    value={advanceTrxId}
                    onChange={(e) => setAdvanceTrxId(e.target.value)}
                    placeholder="Enter TrxID (e.g. BL99XX2)"
                    className="h-8 text-xs font-mono rounded-lg"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={orderSubmitting || (advanceMethod === "WALLET" && walletBalance < shippingCharge)}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {orderSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place & Confirm Dropship Order"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
