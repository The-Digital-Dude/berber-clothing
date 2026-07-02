"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSession, signOut } from "@/hooks/useSession"
import { useRouter } from "next/navigation"
import { User, Package, MapPin, Gift, LogOut, Wallet, Link2 } from "lucide-react"
import { toast } from "sonner"
import AddressList from "@/components/store/account/AddressList"

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [storeCreditBalance, setStoreCreditBalance] = useState(0)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account")
    }
  }, [status, router])

  // Fetch orders
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setOrdersLoading(false) })
      .catch(() => setOrdersLoading(false))
  }, [status])

  // Fetch loyalty balance, store credit, affiliate
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/loyalty").then(r => r.json()).then(d => setLoyaltyBalance(d.balance || 0)).catch(() => {})
    fetch("/api/account/store-credit").then(r => r.json()).then(d => setStoreCreditBalance(d.balance || 0)).catch(() => {})
    fetch("/api/account/affiliate").then(r => r.json()).then(d => setAffiliate(d.affiliate || null)).catch(() => {})
  }, [status])

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" })
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim()
    if (!name) return
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
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-berber-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const firstName = user?.name?.split(" ")[0] || "there"

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl animate-in fade-in duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-heading font-bold text-berber-black mb-2">My Account</h1>
        <p className="text-berber-text-muted">Welcome back, {firstName}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { key: "orders", label: "My Orders", icon: Package },
            { key: "profile", label: "Profile Details", icon: User },
            { key: "addresses", label: "Saved Addresses", icon: MapPin },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? "bg-berber-black text-white" : "hover:bg-berber-muted text-berber-text-muted hover:text-berber-black"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "loyalty" ? "bg-berber-black text-white" : "hover:bg-berber-muted text-berber-text-muted hover:text-berber-black"
            }`}
          >
            <div className="flex items-center gap-3"><Gift className="w-4 h-4" /> Berber Club</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === "loyalty" ? "bg-white text-berber-black" : "bg-berber-gold text-white"}`}>
              {loyaltyBalance} pt
            </span>
          </button>
          {storeCreditBalance > 0 && (
            <button
              onClick={() => setActiveTab("credit")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "credit" ? "bg-berber-black text-white" : "hover:bg-berber-muted text-berber-text-muted hover:text-berber-black"
              }`}
            >
              <div className="flex items-center gap-3"><Wallet className="w-4 h-4" /> Store Credit</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === "credit" ? "bg-white text-berber-black" : "bg-green-100 text-green-800"}`}>
                ৳{storeCreditBalance}
              </span>
            </button>
          )}
          {affiliate && (
            <button
              onClick={() => setActiveTab("affiliate")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "affiliate" ? "bg-berber-black text-white" : "hover:bg-berber-muted text-berber-text-muted hover:text-berber-black"
              }`}
            >
              <Link2 className="w-4 h-4" /> Referral
            </button>
          )}
          <div className="pt-8 mt-8 border-t border-berber-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-berber-error hover:bg-berber-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold mb-6">Order History</h2>
              {ordersLoading ? (
                <div className="text-berber-text-muted text-sm">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Package className="w-12 h-12 mx-auto text-berber-border" />
                  <p className="text-berber-text-muted">No orders yet. Time to shop!</p>
                  <button
                    onClick={() => router.push("/shop")}
                    className="mt-2 px-6 py-3 bg-berber-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-berber-gold transition-colors text-xs"
                  >
                    Browse Shop
                  </button>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="border border-berber-border rounded-2xl overflow-hidden bg-white">
                    <div className="bg-berber-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-berber-border text-sm">
                      <div>
                        <p className="text-xs text-berber-text-muted uppercase tracking-widest font-bold">Order Placed</p>
                        <p className="font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-berber-text-muted uppercase tracking-widest font-bold">Total</p>
                        <p className="font-medium mt-0.5">৳{Number(order.total).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-berber-text-muted uppercase tracking-widest font-bold">Status</p>
                        <p className="font-medium text-berber-gold mt-0.5">{order.status}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-berber-text-muted uppercase tracking-widest font-bold">Order #</p>
                        <p className="font-mono mt-0.5">{order.orderNumber}</p>
                      </div>
                    </div>
                    {order.items?.slice(0, 1).map((item: any) => (
                      <div key={item.id} className="p-6 flex gap-4">
                        <div className="relative w-20 h-24 bg-berber-muted rounded-md shrink-0 overflow-hidden">
                          {item.product?.images?.[0]?.url && (
                            <Image src={item.product.images[0].url} alt={item.productName} fill sizes="80px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-berber-black">{item.productName}</h4>
                          <p className="text-sm text-berber-text-muted mt-1">Size: {item.size} | Color: {item.color}</p>
                          <p className="text-sm font-mono mt-1">৳{Number(item.price).toLocaleString()} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold mb-6">Profile Details</h2>
              <form className="max-w-md space-y-4" onSubmit={handleSaveProfile}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Full Name</label>
                  <input name="name" defaultValue={user?.name || ""} className="w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Email Address</label>
                  <input defaultValue={user?.email || ""} disabled className="w-full bg-berber-muted border border-transparent rounded-lg px-4 py-3 text-sm outline-none opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-berber-text-muted">Email cannot be changed.</p>
                </div>
                <div className="pt-4">
                  <button type="submit" className="px-6 py-3 bg-berber-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-berber-gold transition-colors text-xs">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "addresses" && (
            <AddressList />
          )}

          {activeTab === "credit" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Store Credit</h2>
              <div className="bg-berber-black text-white rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-2">Available Balance</p>
                  <h3 className="text-5xl font-mono font-bold text-green-400 mb-2">৳{storeCreditBalance.toLocaleString()}</h3>
                  <p className="text-sm text-gray-300">Automatically applied at checkout when you place your next order.</p>
                </div>
              </div>
              <p className="text-sm text-berber-text-muted">Store credit never expires and can be used toward any purchase. You'll see the option to apply it in step 3 of checkout.</p>
            </div>
          )}

          {activeTab === "affiliate" && affiliate && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Your Referral Dashboard</h2>
              <div className="bg-white border border-berber-border rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted mb-2">Your Referral Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}?ref=${affiliate.code}`}
                      className="flex-1 bg-berber-muted rounded-lg px-4 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliate.code}`); }}
                      className="px-4 py-2 bg-berber-black text-white rounded-lg text-xs font-bold hover:bg-berber-gold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-berber-border">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Clicks</p>
                    <p className="text-2xl font-mono font-bold mt-1">{affiliate.totalClicks || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Orders</p>
                    <p className="text-2xl font-mono font-bold mt-1">{affiliate._count?.conversions || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Earned</p>
                    <p className="text-2xl font-mono font-bold mt-1 text-berber-gold">৳{Number(affiliate.totalEarned || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-berber-border">
                  <p className="text-xs text-berber-text-muted">
                    Commission: {affiliate.commissionType === "PERCENTAGE" ? `${affiliate.commissionValue}%` : `৳${affiliate.commissionValue}`} per referred order.
                    Payouts are processed weekly to your registered bKash number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-heading font-bold">Berber Club Rewards</h2>
              <div className="bg-berber-black text-white rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-berber-gold/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-berber-text-muted uppercase tracking-widest text-xs font-bold mb-2">Available Points</p>
                  <h3 className="text-5xl font-mono font-bold text-berber-gold mb-6">{loyaltyBalance}</h3>
                  <p className="text-sm text-gray-300 max-w-sm">
                    {loyaltyBalance > 0
                      ? <>You have enough points to get <span className="text-white font-bold">৳{(loyaltyBalance * 0.1).toFixed(0)} off</span> your next purchase.</>
                      : "Start shopping to earn Berber Club points!"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: "1", title: "Shop", desc: "Earn 1 point for every ৳10 spent on our store." },
                    { step: "2", title: "Collect", desc: "Points are automatically added after delivery." },
                    { step: "3", title: "Redeem", desc: "Apply points at checkout for instant discounts." },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="p-6 border border-berber-border rounded-2xl bg-white">
                      <div className="w-10 h-10 bg-berber-gold/10 text-berber-gold rounded-full flex items-center justify-center mb-4 font-bold">{step}</div>
                      <h4 className="font-bold text-sm mb-2">{title}</h4>
                      <p className="text-xs text-berber-text-muted">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
