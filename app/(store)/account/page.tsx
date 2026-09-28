"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession, signOut } from "@/hooks/useSession"
import { useRouter } from "next/navigation"
import { 
  User, 
  Package, 
  MapPin, 
  Gift, 
  LogOut, 
  Wallet, 
  Link2, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Crown, 
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Save
} from "lucide-react"
import { toast } from "sonner"
import AddressList from "@/components/store/account/AddressList"
import { useCartStore } from "@/store/useCartStore"
import { cn } from "@/lib/utils"

const STATUS_STEPS = [
  { key: "PENDING", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
]

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const addItemToCart = useCartStore((s) => s.addItem)

  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [storeCreditBalance, setStoreCreditBalance] = useState(0)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [referralData, setReferralData] = useState<{ referralCode: string; referralCount: number; logs: any[] } | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [calcPoints, setCalcPoints] = useState<number>(0)
  const [copiedReferral, setCopiedReferral] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account")
    }
  }, [status, router])

  // Fetch orders
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || [])
        setOrdersLoading(false)
      })
      .catch(() => setOrdersLoading(false))
  }, [status])

  // Fetch loyalty, credit, affiliate, referral
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/loyalty")
      .then((r) => r.json())
      .then((d) => {
        const bal = d.balance || 0
        setLoyaltyBalance(bal)
        setCalcPoints(bal)
      })
      .catch(() => {})
    fetch("/api/account/store-credit")
      .then((r) => r.json())
      .then((d) => setStoreCreditBalance(d.balance || 0))
      .catch(() => {})
    fetch("/api/account/affiliate")
      .then((r) => r.json())
      .then((d) => setAffiliate(d.affiliate || null))
      .catch(() => {})
    fetch("/api/account/referral")
      .then((r) => r.json())
      .then((d) => setReferralData(d))
      .catch(() => {})
  }, [status])

  const totalSpentLifetime = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0)
  }, [orders])

  const vipTier = useMemo(() => {
    if (totalSpentLifetime >= 15000) {
      return { name: "Gold VIP", next: null, target: 15000, progress: 100, perk: "10% Bonus Points + Free Shipping" }
    }
    if (totalSpentLifetime >= 5000) {
      const remaining = 15000 - totalSpentLifetime
      const progress = Math.min(100, Math.round(((totalSpentLifetime - 5000) / 10000) * 100))
      return { name: "Silver Member", next: "Gold VIP", remaining, target: 15000, progress, perk: "5% Bonus Points on All Orders" }
    }
    const remaining = 5000 - totalSpentLifetime
    const progress = Math.min(100, Math.round((totalSpentLifetime / 5000) * 100))
    return { name: "Bronze Member", next: "Silver Member", remaining, target: 5000, progress, perk: "Standard 1pt per ৳10 spent" }
  }, [totalSpentLifetime])

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" })
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileError("")
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim()

    if (!name) {
      setProfileError("Full Name is required.")
      return
    }

    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success("Profile updated successfully")
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to update profile")
      }
    } catch {
      toast.error("Error updating profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleReorder = (order: any) => {
    let count = 0
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        if (item.productId) {
          addItemToCart({
            id: `${item.productId}-${item.size || "std"}-${item.color || "std"}`,
            variantId: item.variantId || item.id,
            productId: item.productId,
            productSlug: item.product?.slug || item.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: item.productName,
            price: Number(item.price),
            size: item.size || "Standard",
            color: item.color || "Standard",
            image: item.product?.images?.[0]?.url || "/placeholder.png",
            quantity: item.quantity || 1,
          })
          count++
        }
      })
      toast.success(`Added ${count} item${count > 1 ? "s" : ""} from Order #${order.orderNumber} to cart!`)
      router.push("/cart")
    }
  }

  const getStepIndex = (currentStatus: string) => {
    if (currentStatus === "CANCELLED" || currentStatus === "RETURNED") return -1
    const idx = STATUS_STEPS.findIndex((s) => s.key === currentStatus)
    return idx !== -1 ? idx : 0
  }

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Loading Account Portal…</p>
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const firstName = user?.name?.split(" ")[0] || "Shopper"

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl animate-in fade-in duration-300">
      {/* Luxury Customer Header Ribbon */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center font-serif font-bold text-xl text-amber-400 shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : "B"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{user?.name || "My Account"}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-amber-400" />
                  {vipTier.name}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Orders</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">{orders.length}</span>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Berber Points</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">{loyaltyBalance} pt</span>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Store Credit</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">৳{storeCreditBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        {vipTier.next && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80 relative z-10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-medium">
              <span>Tier Progress: <strong>{vipTier.name}</strong></span>
              <span>Spend <strong>৳{vipTier.remaining?.toLocaleString()}</strong> more for <strong>{vipTier.next}</strong></span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${vipTier.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 bg-white border border-zinc-200/90 rounded-2xl p-2.5 space-y-1 shadow-2xs">
          {[
            { key: "orders", label: "My Orders & Tracking", icon: Package, badge: orders.length },
            { key: "loyalty", label: "Berber Club VIP", icon: Crown, highlight: `${loyaltyBalance} pt` },
            { key: "credit", label: "Store Credit Wallet", icon: Wallet, highlight: storeCreditBalance > 0 ? `৳${storeCreditBalance}` : null },
            { key: "referral", label: "Refer Friends (10% Off)", icon: Gift, promo: "৳100 Free" },
            { key: "addresses", label: "Saved Delivery Addresses", icon: MapPin },
            { key: "profile", label: "Profile & Security", icon: User },
          ].map((item) => {
            const Icon = item.icon
            const isSelected = activeTab === item.key

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                      isSelected ? "bg-white text-zinc-900" : "bg-amber-100 text-amber-900"
                    )}
                  >
                    {item.highlight}
                  </span>
                )}
                {item.promo && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {item.promo}
                  </span>
                )}
              </button>
            )
          })}

          {affiliate && (
            <button
              onClick={() => setActiveTab("affiliate")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                activeTab === "affiliate"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              )}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              <span>Affiliate Partner Hub</span>
            </button>
          )}

          <div className="pt-3 mt-3 border-t border-zinc-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full min-w-0">
          {/* 1. ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Purchase History & Live Tracking</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Track your orders from warehouse dispatch to doorstep delivery</p>
                </div>
                <Link
                  href="/shop"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
                </Link>
              </div>

              {ordersLoading ? (
                <div className="py-16 text-center text-xs text-zinc-400">
                  <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading your purchase records…
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 rounded-3xl border border-dashed border-zinc-200 bg-white text-center space-y-3">
                  <Package className="w-10 h-10 mx-auto text-zinc-300" />
                  <p className="font-bold text-zinc-900 text-sm">No orders yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Explore our latest seasonal collections and premium apparel drops.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
                  >
                    Explore Collections
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => {
                    const isExpanded = expandedOrder === order.id
                    const stepIdx = getStepIndex(order.status)
                    const isCancelled = order.status === "CANCELLED"
                    const isReturned = order.status === "RETURNED"

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden transition-all"
                      >
                        {/* Order Header Summary */}
                        <div className="p-4 sm:p-5 bg-zinc-50/50 border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                              #
                            </div>
                            <div>
                              <p className="font-mono font-bold text-zinc-900 text-sm">{order.orderNumber}</p>
                              <p className="text-zinc-500 text-[11px] mt-0.5">
                                Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total</span>
                              <span className="font-mono font-bold text-zinc-900 text-sm">৳{Number(order.total).toLocaleString()}</span>
                            </div>

                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                order.status === "DELIVERED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : isReturned
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {order.status}
                            </span>

                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Live Delivery Progress Tracker Bar */}
                        {!isCancelled && !isReturned && (
                          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-zinc-900" /> Live Fulfillment Journey
                              </span>
                              {order.trackingCode && (
                                <span className="text-xs font-mono font-semibold text-zinc-600">
                                  Tracking Code: <strong>{order.trackingCode}</strong>
                                </span>
                              )}
                            </div>

                            {/* Milestone Steps */}
                            <div className="relative pt-2 pb-1">
                              <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-200 -z-0" />
                              <div className="flex items-center justify-between relative z-10">
                                {STATUS_STEPS.map((step, idx) => {
                                  const isDone = idx <= stepIdx
                                  const isCurrent = idx === stepIdx

                                  return (
                                    <div key={step.key} className="flex flex-col items-center">
                                      <div
                                        className={cn(
                                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                                          isDone
                                            ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                            : "bg-white text-zinc-400 border-zinc-300",
                                          isCurrent && "ring-4 ring-zinc-900/20"
                                        )}
                                      >
                                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                                      </div>
                                      <span
                                        className={cn(
                                          "text-[10px] mt-1 font-semibold whitespace-nowrap",
                                          isCurrent ? "text-zinc-900 font-bold" : isDone ? "text-zinc-700" : "text-zinc-400"
                                        )}
                                      >
                                        {step.label}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Items List */}
                        <div className="p-4 sm:p-5 divide-y divide-zinc-100">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative w-14 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                                  {item.product?.images?.[0]?.url ? (
                                    <Image
                                      src={item.product.images[0].url}
                                      alt={item.productName}
                                      fill
                                      sizes="60px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-zinc-900 truncate">{item.productName}</h4>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                    <span>Size: <strong className="text-zinc-700">{item.size || "Standard"}</strong></span>
                                    <span>•</span>
                                    <span>Color: <strong className="text-zinc-700">{item.color || "Standard"}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-zinc-900 block">
                                  ৳{Number(item.price).toLocaleString()} × {item.quantity}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-500">
                                  = ৳{(Number(item.price) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Toolbar */}
                        <div className="p-3.5 bg-zinc-50/70 border-t border-zinc-200/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] text-zinc-500">
                            Shipping to: <strong className="text-zinc-800">{order.shippingAddress || "Registered Address"}</strong>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReorder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition"
                            >
                              <RotateCcw className="w-3 h-3" /> Reorder Items
                            </button>
                            {order.status === "DELIVERED" && (
                              <Link
                                href={`/contact?subject=Return Request for Order #${order.orderNumber}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-xl shadow-2xs transition"
                              >
                                Request Return
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. BERBER CLUB LOYALTY TAB */}
          {activeTab === "loyalty" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5" /> Berber Club VIP Rewards
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    You have <span className="font-mono text-amber-400">{loyaltyBalance} Points</span>
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                    Earn 1 point for every ৳10 spent on luxury clothing. Points can be redeemed for instant cash discounts at checkout.
                  </p>
                </div>
              </div>

              {/* Interactive Points Discount Calculator */}
              <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Instant Points Value Calculator
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ৳{Math.round(calcPoints * 0.1).toLocaleString()} Checkout Value
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Selected: <strong>{calcPoints} points</strong></span>
                    <span>Max: <strong>{loyaltyBalance} points</strong></span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(100, loyaltyBalance)}
                    value={calcPoints}
                    onChange={(e) => setCalcPoints(Number(e.target.value))}
                    className="w-full accent-zinc-900 h-2 bg-zinc-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* VIP Tiers Table */}
              <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
                <h4 className="font-bold text-sm text-zinc-900">VIP Membership Tiers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-1.5">
                    <span className="font-bold text-zinc-900 block">Bronze Member</span>
                    <span className="text-[11px] text-zinc-500 block">Under ৳5,000 Spend</span>
                    <p className="text-zinc-700 font-medium">Standard 1pt / ৳10 earning rate</p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-1.5">
                    <span className="font-bold text-amber-950 block">Silver Member</span>
                    <span className="text-[11px] text-amber-800 block">৳5,000 – ৳15,000 Spend</span>
                    <p className="text-amber-900 font-medium">+5% bonus points on all drops</p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-400 bg-amber-100/50 space-y-1.5">
                    <span className="font-bold text-amber-950 block">Gold VIP</span>
                    <span className="text-[11px] text-amber-900 block">৳15,000+ Spend</span>
                    <p className="text-amber-950 font-medium">+10% bonus points + free priority shipping</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. STORE CREDIT WALLET TAB */}
          {activeTab === "credit" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-8 relative overflow-hidden border border-zinc-800 shadow-2xl">
                <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
                    Digital Wallet Balance
                  </span>
                  <h3 className="text-5xl font-mono font-bold text-white">
                    ৳{storeCreditBalance.toLocaleString()}
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-sm">
                    Store credit never expires and automatically deducts from your next purchase at checkout step 3.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-2">
                <h4 className="font-bold text-sm text-zinc-900">How Store Credit Works</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Store credit is issued from authorized returns, referral rewards, or customer service adjustments. It applies alongside promotional coupons for maximum savings.
                </p>
              </div>
            </div>
          )}

          {/* 4. REFER & EARN TAB */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
                    <Gift className="w-3.5 h-3.5" /> Dual Referral Bonus
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    Give 10% Off, Get ৳100 Store Credit
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                    Share your personal link. When a friend places their first order, they enjoy 10% off and you receive ৳100 store credit automatically once delivered!
                  </p>

                  <div className="pt-2 max-w-md space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Your Unique Referral Link:
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={
                          typeof window !== "undefined" && referralData?.referralCode
                            ? `${window.location.origin}?ref=${referralData.referralCode}`
                            : ""
                        }
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none"
                      />
                      <button
                        onClick={() => {
                          if (referralData?.referralCode) {
                            navigator.clipboard.writeText(`${window.location.origin}?ref=${referralData.referralCode}`)
                            setCopiedReferral(true)
                            toast.success("Referral link copied!")
                            setTimeout(() => setCopiedReferral(false), 2000)
                          }
                        }}
                        className="px-4 py-2 bg-white text-zinc-900 font-bold rounded-xl text-xs hover:bg-zinc-100 transition shadow-2xs flex items-center gap-1"
                      >
                        {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedReferral ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    {/* WhatsApp Quick Share */}
                    {referralData?.referralCode && (
                      <div className="pt-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Get 10% off your first luxury order at Berber Clothing with my link: ${window.location.origin}?ref=${referralData.referralCode}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Share directly on WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Referral Activity History */}
              <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h4 className="font-bold text-sm text-zinc-900">Referral Ledger</h4>
                  <span className="text-xs text-zinc-500">
                    Total Friends Referred: <strong>{referralData?.referralCount || 0}</strong>
                  </span>
                </div>

                {referralData?.logs && referralData.logs.length > 0 ? (
                  <div className="divide-y divide-zinc-100 text-xs">
                    {referralData.logs.map((log: any) => (
                      <div key={log.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-zinc-900">{log.referee?.name || "Friend"}</p>
                          <p className="text-zinc-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          +৳{log.creditAmount || 100} Credit Awarded
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    No completed referrals yet. Share your link to start earning rewards!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. SAVED ADDRESSES TAB */}
          {activeTab === "addresses" && <AddressList />}

          {/* 6. PROFILE & SECURITY TAB */}
          {activeTab === "profile" && (
            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Profile Details & Security</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Manage your personal identification and login credentials</p>
              </div>

              <form onSubmit={handleSaveProfile} className="max-w-md space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
                  <input
                    name="name"
                    defaultValue={user?.name || ""}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none transition",
                      profileError
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-zinc-200 bg-zinc-50/60 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    )}
                  />
                  {profileError && <p className="text-xs text-rose-600 font-medium mt-1">{profileError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address</label>
                  <input
                    defaultValue={user?.email || ""}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 text-xs font-medium opacity-70 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Primary email cannot be modified once verified.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingProfile ? "Saving Changes…" : "Update Profile"}
                </button>
              </form>
            </div>
          )}

          {/* 7. AFFILIATE TAB */}
          {activeTab === "affiliate" && affiliate && (
            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Affiliate Partner Hub</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Track your partner link clicks, customer conversions, and earned commissions</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="text-xs font-bold text-zinc-700">Your Partner Tracking Link:</span>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}?ref=${affiliate.code}`}
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-900 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliate.code}`)
                      toast.success("Affiliate link copied!")
                    }}
                    className="px-4 py-2 bg-zinc-900 text-white font-bold rounded-xl text-xs hover:bg-zinc-800 transition"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-xs text-zinc-500 font-semibold block">Total Clicks</span>
                  <span className="text-2xl font-bold font-mono text-zinc-900 mt-1 block">
                    {affiliate.totalClicks || 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-xs text-zinc-500 font-semibold block">Conversions</span>
                  <span className="text-2xl font-bold font-mono text-zinc-900 mt-1 block">
                    {affiliate._count?.conversions || 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-800 font-semibold block">Earned Commission</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                    ৳{Number(affiliate.totalEarned || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
