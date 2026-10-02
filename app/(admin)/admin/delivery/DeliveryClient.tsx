"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Search,
  Package,
  MessageSquare,
  Zap,
  DollarSign,
  Calendar,
  RotateCcw,
  MapPin,
  Clock,
  Plus,
  ShieldCheck,
  Building
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Delivery = {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  shippingPhone?: string | null
  courier: string
  consignmentId: string | null
  trackingCode: string | null
  status: string
  createdAt: string
}

export function DeliveryClient({
  data,
  stats,
}: {
  data: Delivery[]
  stats: { totalSent: number; inTransit: number; delivered: number; failed: number }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // Financials & Settlements State
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [payouts, setPayouts] = useState<any[]>([])
  const [isPayoutsOpen, setIsPayoutsOpen] = useState(false)

  // Pickup Request Modal State
  const [isPickupOpen, setIsPickupOpen] = useState(false)
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupNote, setPickupNote] = useState("")
  const [pickupPhone, setPickupPhone] = useState("")
  const [submittingPickup, setSubmittingPickup] = useState(false)

  // Return Requests Modal State
  const [isReturnsOpen, setIsReturnsOpen] = useState(false)
  const [returnRequests, setReturnRequests] = useState<any[]>([])
  const [loadingReturns, setLoadingReturns] = useState(false)
  const [newReturnConsignmentId, setNewReturnConsignmentId] = useState("")
  const [newReturnReason, setNewReturnReason] = useState("")
  const [submittingReturn, setSubmittingReturn] = useState(false)

  // Live Timeline State
  const [timelineOrder, setTimelineOrder] = useState<{ invoice: string; consignmentId?: string | null } | null>(null)
  const [timelineSteps, setTimelineSteps] = useState<any[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // Police Stations / Thanas Lookup Modal
  const [isStationsOpen, setIsStationsOpen] = useState(false)
  const [districts, setDistricts] = useState<any[]>([])
  const [stationSearch, setStationSearch] = useState("")
  const [loadingStations, setLoadingStations] = useState(false)

  // Fetch balance on load
  const fetchBalance = async () => {
    setLoadingBalance(true)
    try {
      const res = await fetch("/api/admin/delivery/packzy/payouts")
      const json = await res.json()
      if (res.ok) {
        setBalance(json.balance ?? 0)
        setPayouts(json.payments || [])
      }
    } catch {
      // silently fallback
    } finally {
      setLoadingBalance(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/delivery?${params.toString()}`, { scroll: false })
  }

  const handleRefreshStatus = async (consignmentId: string | null) => {
    if (!consignmentId) {
      toast.error("No consignment ID found for this parcel")
      return
    }
    setRefreshing(consignmentId)
    try {
      const res = await fetch(`/api/courier/steadfast?consignmentId=${encodeURIComponent(consignmentId)}`)
      const json = await res.json()
      if (res.ok) {
        toast.success(`Updated status: ${json.internalStatus || json.status}`)
        router.refresh()
      } else {
        toast.error(json.error || "Failed to refresh status from Packzy")
      }
    } catch (err: any) {
      toast.error(err.message || "Error refreshing courier status")
    } finally {
      setRefreshing(null)
    }
  }

  const openTimeline = async (delivery: Delivery) => {
    setTimelineOrder({ invoice: delivery.orderNumber, consignmentId: delivery.consignmentId })
    setTimelineSteps([])
    setLoadingTimeline(true)
    try {
      const res = await fetch(`/api/admin/delivery/packzy/timeline?invoice=${encodeURIComponent(delivery.orderNumber)}`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.timeline)) {
        setTimelineSteps(json.timeline)
      } else {
        setTimelineSteps([])
      }
    } catch {
      toast.error("Failed to load timeline")
    } finally {
      setLoadingTimeline(false)
    }
  }

  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupAddress.trim()) {
      toast.error("Pickup address is required")
      return
    }
    setSubmittingPickup(true)
    try {
      const res = await fetch("/api/admin/delivery/packzy/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address: pickupAddress.trim(),
          note: pickupNote.trim(),
          phone: pickupPhone.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || "Pickup request scheduled successfully!")
        setIsPickupOpen(false)
        setPickupAddress("")
        setPickupNote("")
      } else {
        toast.error(json.error || "Failed to schedule pickup")
      }
    } catch (err: any) {
      toast.error(err.message || "Network error")
    } finally {
      setSubmittingPickup(false)
    }
  }

  const openReturnsModal = async () => {
    setIsReturnsOpen(true)
    setLoadingReturns(true)
    try {
      const res = await fetch("/api/admin/delivery/packzy/returns")
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setReturnRequests(json.data)
      }
    } catch {
      toast.error("Failed to load return requests")
    } finally {
      setLoadingReturns(false)
    }
  }

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReturnConsignmentId.trim()) {
      toast.error("Consignment ID or Invoice is required")
      return
    }
    setSubmittingReturn(true)
    try {
      const res = await fetch("/api/admin/delivery/packzy/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consignment_id: newReturnConsignmentId.trim(),
          reason: newReturnReason.trim() || "Admin Initiated Return",
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || "Return request created!")
        setNewReturnConsignmentId("")
        setNewReturnReason("")
        openReturnsModal()
      } else {
        toast.error(json.error || "Failed to create return request")
      }
    } catch (err: any) {
      toast.error(err.message || "Network error")
    } finally {
      setSubmittingReturn(false)
    }
  }

  const openStationsModal = async () => {
    setIsStationsOpen(true)
    if (districts.length === 0) {
      setLoadingStations(true)
      try {
        const res = await fetch("/api/admin/delivery/packzy/police-stations")
        const json = await res.json()
        if (res.ok && Array.isArray(json.districts)) {
          setDistricts(json.districts)
        }
      } catch {
        toast.error("Failed to load police stations")
      } finally {
        setLoadingStations(false)
      }
    }
  }

  const filteredData = data.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.orderNumber.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      (d.consignmentId || "").toLowerCase().includes(q) ||
      (d.trackingCode || "").toLowerCase().includes(q) ||
      (d.shippingPhone || "").includes(q)
    )
  })

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    switch (s) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      case "IN_TRANSIT":
      case "PICKED_UP":
      case "IN_REVIEW":
        return "bg-blue-50 text-blue-700 border-blue-200/60"
      case "FAILED":
      case "RETURNED":
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200/60"
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/60"
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Packzy Status & Quick Actions */}
      <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 via-white to-blue-50/50 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">Packzy / Steadfast Gateway</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              Current Packzy Balance:{" "}
              <span className="font-bold text-zinc-900 font-mono">
                {balance !== null ? `৳${balance.toLocaleString()}` : "Loading…"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPayoutsOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Payout Settlements
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPickupOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Schedule Pickup
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={openReturnsModal}
            className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Return Requests
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={openStationsModal}
            className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50"
          >
            <Building className="w-3.5 h-3.5 text-zinc-600" />
            Delivery Zones
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Dispatched (Month)</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalSent}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Total shipments booked</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Transit</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.inTransit}</h3>
            <span className="text-xs text-blue-700/80 font-medium mt-1 block">En route with courier rider</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Delivered</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.delivered}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Successfully handed over</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Failed / Returned</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">{stats.failed}</h3>
            <span className="text-xs text-rose-700/80 font-medium mt-1 block">Customer canceled or returned</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search order #, customer, tracking…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={searchParams.get("status") || "all"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
          >
            <option value="all">All Statuses</option>
            <option value="in_review">In Review / Dispatched</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Courier</th>
                <th className="px-4 py-3.5">Consignment ID</th>
                <th className="px-4 py-3.5">Tracking Code</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No shipments found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((delivery) => {
                  const phoneClean = delivery.shippingPhone ? delivery.shippingPhone.replace(/[^0-9]/g, "") : null

                  return (
                    <tr key={delivery.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/orders/${delivery.orderId}`}
                          className="font-mono font-bold text-zinc-900 hover:text-amber-600 flex items-center gap-1"
                        >
                          #{delivery.orderNumber}
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900">{delivery.customerName}</div>
                        {delivery.shippingPhone && (
                          <div className="text-[11px] text-zinc-600 font-mono mt-0.5 flex items-center gap-1">
                            {delivery.shippingPhone}
                            {phoneClean && (
                              <a
                                href={`https://wa.me/${phoneClean}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 inline ml-0.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                          <Zap className="w-3 h-3 text-indigo-600" />
                          Packzy / SF
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-900">
                        {delivery.consignmentId || "—"}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-zinc-600">
                        {delivery.trackingCode ? (
                          <a
                            href={
                              delivery.trackingCode.startsWith("http")
                                ? delivery.trackingCode
                                : `https://steadfast.com.bd/t/${delivery.trackingCode}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {delivery.trackingCode}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                            getStatusBadge(delivery.status)
                          )}
                        >
                          {delivery.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap" suppressHydrationWarning>
                        {delivery.createdAt ? format(new Date(delivery.createdAt), "MMM d, yyyy") : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openTimeline(delivery)}
                            title="View parcel movement timeline"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition"
                          >
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>Timeline</span>
                          </button>

                          {delivery.consignmentId && (
                            <button
                              onClick={() => handleRefreshStatus(delivery.consignmentId)}
                              disabled={refreshing === delivery.consignmentId}
                              title="Sync status from Packzy"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              <RefreshCw
                                className={cn("w-3 h-3", refreshing === delivery.consignmentId && "animate-spin")}
                              />
                              <span>Sync</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payouts Modal */}
      <Dialog open={isPayoutsOpen} onOpenChange={setIsPayoutsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Packzy Payout Settlements
            </DialogTitle>
            <DialogDescription>
              View funds settled and transferred to your bank account from completed COD deliveries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase">Available COD Balance</p>
                <p className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                  ৳{(balance ?? 0).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={fetchBalance} disabled={loadingBalance} className="gap-1 text-xs">
                <RefreshCw className={cn("w-3 h-3", loadingBalance && "animate-spin")} />
                Refresh
              </Button>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase text-zinc-600">
                  <tr>
                    <th className="p-3">Payment ID</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Parcels</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-zinc-400">
                        No payout history records yet.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="p-3 font-mono font-bold text-zinc-900">{p.payment_id || p.id || "—"}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">৳{Number(p.amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-zinc-600">{p.parcels_count || p.parcels?.length || "—"}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">{p.status || "Settled"}</span></td>
                        <td className="p-3 text-zinc-500" suppressHydrationWarning>{p.created_at || p.date || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Pickup Modal */}
      <Dialog open={isPickupOpen} onOpenChange={setIsPickupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Schedule Rider Collection
            </DialogTitle>
            <DialogDescription>
              Submit a pickup request for a courier rider to collect parcels from your warehouse.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSchedulePickup} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                Warehouse / Pickup Address *
              </label>
              <textarea
                required
                rows={3}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                Contact Phone (Optional)
              </label>
              <Input
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                Note for Rider (Optional)
              </label>
              <Input
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="e.g. 10 clothing parcels ready for evening pickup"
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPickupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submittingPickup} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {submittingPickup ? "Scheduling…" : "Dispatch Pickup Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Requests Modal */}
      <Dialog open={isReturnsOpen} onOpenChange={setIsReturnsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Return Requests Management
            </DialogTitle>
            <DialogDescription>
              Create and monitor courier return requests for undelivered or returned items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <form onSubmit={handleCreateReturn} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase">Initiate New Return Request</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  required
                  placeholder="Consignment ID (e.g. 12345)"
                  value={newReturnConsignmentId}
                  onChange={(e) => setNewReturnConsignmentId(e.target.value)}
                  className="text-xs font-mono"
                />
                <Input
                  placeholder="Reason (e.g. Customer refused / damaged)"
                  value={newReturnReason}
                  onChange={(e) => setNewReturnReason(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={submittingReturn} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                  {submittingReturn ? "Submitting…" : "Submit Return"}
                </Button>
              </div>
            </form>

            <div className="rounded-xl border border-zinc-200 overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase text-zinc-600">
                  <tr>
                    <th className="p-3">ID / CID</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loadingReturns ? (
                    <tr><td colSpan={4} className="p-6 text-center text-zinc-400">Loading returns…</td></tr>
                  ) : returnRequests.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-zinc-400">No return requests recorded.</td></tr>
                  ) : (
                    returnRequests.map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="p-3 font-mono font-bold text-zinc-900">{r.consignment_id || r.id}</td>
                        <td className="p-3 text-zinc-600">{r.reason || "—"}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">{r.status || "Pending"}</span></td>
                        <td className="p-3 text-zinc-500" suppressHydrationWarning>{r.created_at || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Parcel Movement Timeline Modal */}
      <Dialog open={!!timelineOrder} onOpenChange={(open) => !open && setTimelineOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Parcel Movement History
            </DialogTitle>
            <DialogDescription>
              Step-by-step courier log for Invoice #{timelineOrder?.invoice}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-3 max-h-96 overflow-y-auto">
            {loadingTimeline ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                Fetching live courier log from Packzy…
              </div>
            ) : timelineSteps.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                <Clock className="w-6 h-6 mx-auto mb-2 text-zinc-300" />
                No movement steps recorded yet. Consignment may still be in review.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-zinc-900 capitalize">
                        {step.status ? String(step.status).replace(/_/g, " ") : "Update"}
                      </span>
                      {(step.updated_at || step.created_at || step.time) && (
                        <span className="text-[10.5px] text-zinc-400 font-mono" suppressHydrationWarning>
                          {new Date(step.updated_at || step.created_at || step.time).toLocaleString("en-BD", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    {step.message && <p className="text-zinc-600 mt-0.5">{step.message}</p>}
                    {step.hub && <p className="text-[11px] text-zinc-400 mt-0.5">Hub: {step.hub}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Police Stations / Thanas Modal */}
      <Dialog open={isStationsOpen} onOpenChange={setIsStationsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Delivery Zones & Police Stations Directory
            </DialogTitle>
            <DialogDescription>
              Browse all deliverable districts and thanas supported by the Packzy network.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2 space-y-3 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Filter by district or thana name…"
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              className="text-xs"
            />

            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {loadingStations ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading directory…</div>
              ) : (
                districts
                  .filter((d) => {
                    if (!stationSearch) return true
                    const q = stationSearch.toLowerCase()
                    const matchDistrict = d.name?.toLowerCase().includes(q)
                    const matchThana = d.policestations?.some((ps: any) => ps.name?.toLowerCase().includes(q))
                    return matchDistrict || matchThana
                  })
                  .map((d) => (
                    <div key={d.id} className="p-3.5 hover:bg-zinc-50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 text-xs">{d.name} District</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-mono">
                          {d.policestations?.length || 0} thanas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(d.policestations || []).map((ps: any) => (
                          <span
                            key={ps.id}
                            className="text-[11px] bg-white border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md"
                          >
                            {ps.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
