"use client"

import { useState } from "react"
import {
  Scissors,
  Printer,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  FileText,
  Building,
  RefreshCw,
  Eye,
  CreditCard,
  Ruler,
  X,
  Layers,
  Save,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const STAGES = [
  { id: "ALL", label: "All Commissions" },
  { id: "FABRIC_SOURCING", label: "Cloth Reserved" },
  { id: "PATTERN_CUTTING", label: "Pattern Cutting" },
  { id: "BASTE_FITTING_SCHEDULED", label: "Baste Trial Ready" },
  { id: "FINAL_TAILORING", label: "Handcrafting" },
  { id: "QUALITY_CONTROL", label: "QA Audit" },
  { id: "READY_FOR_PICKUP_OR_DELIVERY", label: "Ready for Pickup" },
  { id: "COMPLETED", label: "Completed" },
]

const STAGE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  FABRIC_SOURCING: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", label: "Cloth Reserved" },
  PATTERN_CUTTING: { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400", label: "Pattern Cutting" },
  BASTE_FITTING_SCHEDULED: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "Baste Trial Ready" },
  FINAL_TAILORING: { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-400", label: "Handcrafting" },
  QUALITY_CONTROL: { bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400", label: "QA Audit" },
  READY_FOR_PICKUP_OR_DELIVERY: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Ready for Pickup" },
  COMPLETED: { bg: "bg-neutral-500/10 border-neutral-500/30", text: "text-neutral-400", label: "Completed" },
}

interface MeasurementFormState {
  unit: "inch" | "cm"
  // Upper Body
  neck: string | number
  chest: string | number
  stomach: string | number
  hips: string | number
  shoulderWidth: string | number
  sleeveLength: string | number
  bicep: string | number
  wrist: string | number
  jacketLength: string | number
  jacketFrontLength: string | number
  jacketBackLength: string | number
  vestChest: string | number
  vestWaist: string | number
  vestLength: string | number

  // Lower Body
  trouserWaist: string | number
  trouserHips: string | number
  crotchDepth: string | number
  inseam: string | number
  outseam: string | number
  thigh: string | number
  knee: string | number
  ankleOpening: string | number

  // Posture & Balance
  shoulderType: "NORMAL" | "SQUARE" | "SLOPING"
  leftShoulderDrop: string | number
  rightShoulderDrop: string | number
  postureType: "REGULAR" | "ERECT" | "STOOPED"
  chestBalance: "STANDARD" | "PROMINENT" | "FLAT"
  seatPitch: "BALANCED" | "PROMINENT_SEAT" | "FLAT_SEAT"
  fitPreference: "SLIM" | "REGULAR" | "RELAXED"
  heightCm: string | number
  weightKg: string | number

  // Workshop Notes
  tailorNotes: string
}

const DEFAULT_MEASUREMENTS: MeasurementFormState = {
  unit: "inch",
  neck: "",
  chest: "",
  stomach: "",
  hips: "",
  shoulderWidth: "",
  sleeveLength: "",
  bicep: "",
  wrist: "",
  jacketLength: "",
  jacketFrontLength: "",
  jacketBackLength: "",
  vestChest: "",
  vestWaist: "",
  vestLength: "",

  trouserWaist: "",
  trouserHips: "",
  crotchDepth: "",
  inseam: "",
  outseam: "",
  thigh: "",
  knee: "",
  ankleOpening: "",

  shoulderType: "NORMAL",
  leftShoulderDrop: "0",
  rightShoulderDrop: "0",
  postureType: "REGULAR",
  chestBalance: "STANDARD",
  seatPitch: "BALANCED",
  fitPreference: "SLIM",
  heightCm: "",
  weightKg: "",

  tailorNotes: "",
}

export default function BespokeOrdersAdminClient({ initialOrders = [] }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [selectedStage, setSelectedStage] = useState("ALL")
  const [search, setSearch] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [activeWaModal, setActiveWaModal] = useState<{ waLink: string; waMessage: string } | null>(null)

  // Measurement Modal State
  const [measurementModalOrder, setMeasurementModalOrder] = useState<any | null>(null)
  const [measurementTab, setMeasurementTab] = useState<"upper" | "lower" | "posture" | "workshop">("upper")
  const [measurementForm, setMeasurementForm] = useState<MeasurementFormState>(DEFAULT_MEASUREMENTS)
  const [isSavingMeasurements, setIsSavingMeasurements] = useState(false)

  const reloadData = async () => {
    try {
      const url = new URL("/api/admin/bespoke/orders", window.location.origin)
      if (selectedStage !== "ALL") url.searchParams.set("status", selectedStage)
      if (search) url.searchParams.set("search", search)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch {
      toast.error("Failed to refresh orders")
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(id)
    try {
      const res = await fetch("/api/admin/bespoke/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")

      toast.success("Production stage advanced")
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      )

      if (data.waLink && (newStatus === "BASTE_FITTING_SCHEDULED" || newStatus === "READY_FOR_PICKUP_OR_DELIVERY")) {
        setActiveWaModal({ waLink: data.waLink, waMessage: data.waMessage })
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleToggleDeposit = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/bespoke/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, depositPaid: !currentVal }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(!currentVal ? "Deposit marked as Paid" : "Deposit marked as Unpaid")
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, depositPaid: !currentVal } : o))
      )
    } catch {
      toast.error("Failed to toggle deposit")
    }
  }

  const openMeasurementModal = (order: any) => {
    setMeasurementModalOrder(order)
    setMeasurementTab("upper")

    // Parse existing measurements if present
    let existing: any = {}
    if (order.customMeasurements) {
      try {
        existing = typeof order.customMeasurements === "string" ? JSON.parse(order.customMeasurements) : order.customMeasurements
      } catch (e) {
        existing = {}
      }
    } else if (order.measurementProfile) {
      existing = order.measurementProfile
    }

    setMeasurementForm({
      unit: existing.unit || "inch",
      neck: existing.neck ?? "",
      chest: existing.chest ?? "",
      stomach: existing.stomach ?? "",
      hips: existing.hips ?? "",
      shoulderWidth: existing.shoulderWidth ?? "",
      sleeveLength: existing.sleeveLength ?? "",
      bicep: existing.bicep ?? "",
      wrist: existing.wrist ?? "",
      jacketLength: existing.jacketLength ?? "",
      jacketFrontLength: existing.jacketFrontLength ?? "",
      jacketBackLength: existing.jacketBackLength ?? "",
      vestChest: existing.vestChest ?? "",
      vestWaist: existing.vestWaist ?? "",
      vestLength: existing.vestLength ?? "",

      trouserWaist: existing.trouserWaist ?? "",
      trouserHips: existing.trouserHips ?? "",
      crotchDepth: existing.crotchDepth ?? "",
      inseam: existing.inseam ?? "",
      outseam: existing.outseam ?? "",
      thigh: existing.thigh ?? "",
      knee: existing.knee ?? "",
      ankleOpening: existing.ankleOpening ?? "",

      shoulderType: existing.shoulderType || "NORMAL",
      leftShoulderDrop: existing.leftShoulderDrop ?? "0",
      rightShoulderDrop: existing.rightShoulderDrop ?? "0",
      postureType: existing.postureType || "REGULAR",
      chestBalance: existing.chestBalance || "STANDARD",
      seatPitch: existing.seatPitch || "BALANCED",
      fitPreference: existing.fitPreference || "SLIM",
      heightCm: existing.heightCm ?? "",
      weightKg: existing.weightKg ?? "",

      tailorNotes: existing.tailorNotes || "",
    })
  }

  const handleSaveMeasurements = async (advanceStage: boolean = false) => {
    if (!measurementModalOrder) return
    setIsSavingMeasurements(true)

    try {
      const res = await fetch("/api/admin/bespoke/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: measurementModalOrder.id,
          measurements: measurementForm,
          advanceToPatternCutting: advanceStage,
          updateCustomerProfile: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save measurements")

      toast.success(
        advanceStage
          ? "Measurements saved & Commission advanced to Pattern Cutting!"
          : "Anatomical measurements saved successfully!"
      )

      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? { ...o, ...data.order } : o))
        )
      }

      setMeasurementModalOrder(null)

      if (advanceStage && data.waLink) {
        setActiveWaModal({ waLink: data.waLink, waMessage: data.waMessage })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save measurements")
    } finally {
      setIsSavingMeasurements(false)
    }
  }

  const handleUnitToggle = () => {
    const nextUnit = measurementForm.unit === "inch" ? "cm" : "inch"
    setMeasurementForm((prev) => ({
      ...prev,
      unit: nextUnit,
    }))
  }

  const countFilledMeasurements = (order: any) => {
    let source: any = null
    if (order.customMeasurements) {
      try {
        source = typeof order.customMeasurements === "string" ? JSON.parse(order.customMeasurements) : order.customMeasurements
      } catch {}
    } else if (order.measurementProfile) {
      source = order.measurementProfile
    }

    if (!source) return 0
    const keys = ["neck", "chest", "stomach", "hips", "shoulderWidth", "sleeveLength", "trouserWaist", "inseam", "outseam", "jacketLength"]
    return keys.filter((k) => source[k] && Number(source[k]) > 0).length
  }

  const filtered = orders.filter((o) => {
    const matchStage = selectedStage === "ALL" || o.status === selectedStage
    const matchSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.phone?.includes(search)
    return matchStage && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-500" />
            Master Tailor Workshop Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Record in-person fitting measurements, draft cutting blueprints, and manage atelier production stages.
          </p>
        </div>

        <button
          onClick={reloadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition shadow-sm bg-white dark:bg-neutral-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stage Pills Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStage(st.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              selectedStage === st.id
                ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-800 hover:border-gray-300"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, client name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-gray-500">Showing {filtered.length} bespoke commissions</span>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No bespoke commissions found in this stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Commission #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Garment & Cloth</th>
                  <th className="py-3.5 px-4">Fitting Profile</th>
                  <th className="py-3.5 px-4">Deposit Status</th>
                  <th className="py-3.5 px-4">Workshop Stage</th>
                  <th className="py-3.5 px-4 text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filtered.map((item) => {
                  const specs =
                    typeof item.designSpecs === "string"
                      ? JSON.parse(item.designSpecs)
                      : item.designSpecs || {}
                  const statusMeta = STAGE_BADGES[item.status] || STAGE_BADGES.FABRIC_SOURCING
                  const filledCount = countFilledMeasurements(item)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-950/50 transition">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                          {item.orderNumber}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.user?.name || "Client"}</div>
                        <div className="text-xs text-gray-500">{item.user?.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-neutral-200">
                          {item.garmentType.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 truncate max-w-xs">
                          {specs.fabric?.name || "Wool"} ({specs.silhouette || "Slim"})
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => openMeasurementModal(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            filledCount >= 5
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>{filledCount >= 5 ? `Fitted (${filledCount} pts)` : "Pending Fitting"}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleDeposit(item.id, item.depositPaid)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                            item.depositPaid
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          {item.depositPaid ? "Deposit Paid (৳" + Number(item.depositAmount || 0).toLocaleString() + ")" : "Mark Deposit Paid"}
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          disabled={isUpdating === item.id}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <option value="FABRIC_SOURCING">1. Cloth Reserved</option>
                          <option value="PATTERN_CUTTING">2. Pattern Cutting</option>
                          <option value="BASTE_FITTING_SCHEDULED">3. Baste Trial Ready</option>
                          <option value="FINAL_TAILORING">4. Handcrafting</option>
                          <option value="QUALITY_CONTROL">5. QA Audit</option>
                          <option value="READY_FOR_PICKUP_OR_DELIVERY">6. Ready for Pickup</option>
                          <option value="COMPLETED">7. Completed</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openMeasurementModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm"
                            title="Record in-atelier fitting measurements"
                          >
                            <Ruler className="w-3.5 h-3.5" />
                            <span>Fit Sheet</span>
                          </button>

                          <Link
                            href={`/admin/bespoke/orders/${item.id}/cut-sheet`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold transition shadow-sm border border-neutral-700"
                            title="Print Master Cut Blueprint"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cut Sheet</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MASTER TAILOR IN-ATELIER MEASUREMENT RECORDER MODAL */}
      {measurementModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-neutral-950 border-b border-neutral-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Master Atelier Fitting Blueprint
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      #{measurementModalOrder.orderNumber}
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Client: <strong className="text-white">{measurementModalOrder.user?.name || "Bespoke Client"}</strong> •{" "}
                    {measurementModalOrder.garmentType.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Unit Switcher */}
                <button
                  type="button"
                  onClick={handleUnitToggle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition"
                  title="Switch measurement unit"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unit: <strong className="text-amber-400 uppercase">{measurementForm.unit}</strong></span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeasurementModalOrder(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="bg-neutral-950/60 border-b border-neutral-800 px-6 flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMeasurementTab("upper")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  measurementTab === "upper"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <span>1. Upper Body (Jacket & Vest)</span>
              </button>

              <button
                type="button"
                onClick={() => setMeasurementTab("lower")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  measurementTab === "lower"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <span>2. Lower Body (Trousers)</span>
              </button>

              <button
                type="button"
                onClick={() => setMeasurementTab("posture")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  measurementTab === "posture"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <span>3. Posture & Anatomical Balance</span>
              </button>

              <button
                type="button"
                onClick={() => setMeasurementTab("workshop")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  measurementTab === "workshop"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <span>4. Workshop & Cutter Instructions</span>
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-neutral-900">
              {/* TAB 1: UPPER BODY */}
              {measurementTab === "upper" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Jacket & Torso Anatomical Dimensions</h3>
                      <p className="text-xs text-neutral-400">Master tailor measurements taken directly against the client's body ({measurementForm.unit}).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Neck Circumference</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="16.0"
                          value={measurementForm.neck}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, neck: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Chest (Fullest Point)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="40.0"
                          value={measurementForm.chest}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Stomach / Waist</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="35.0"
                          value={measurementForm.stomach}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, stomach: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Seat / Jacket Hips</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="41.0"
                          value={measurementForm.hips}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, hips: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Shoulder Width (Bone-to-Bone)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="18.5"
                          value={measurementForm.shoulderWidth}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, shoulderWidth: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Sleeve Length (Shoulder to Cuff)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="25.0"
                          value={measurementForm.sleeveLength}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, sleeveLength: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Bicep Circumference</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="14.5"
                          value={measurementForm.bicep}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, bicep: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Wrist / Cuff Width</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="6.5"
                          value={measurementForm.wrist}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, wrist: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Finished Jacket Length</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="29.5"
                          value={measurementForm.jacketLength}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, jacketLength: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Jacket Front Length</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="30.0"
                          value={measurementForm.jacketFrontLength}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, jacketFrontLength: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Centre Back Length</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="29.0"
                          value={measurementForm.jacketBackLength}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, jacketBackLength: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Vest / Waistcoat Length</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="23.5"
                          value={measurementForm.vestLength}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, vestLength: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LOWER BODY */}
              {measurementTab === "lower" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Trouser & Lower Body Master Cut Dimensions</h3>
                      <p className="text-xs text-neutral-400">Precise waistband, inseam, rise, and leg tapering specifications ({measurementForm.unit}).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Trouser Waist</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="34.0"
                          value={measurementForm.trouserWaist}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, trouserWaist: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Trouser Hips / Full Seat</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="41.5"
                          value={measurementForm.trouserHips}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, trouserHips: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Crotch Depth / Total Rise</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="10.5"
                          value={measurementForm.crotchDepth}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, crotchDepth: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Inseam (Crotch to Hem)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="31.0"
                          value={measurementForm.inseam}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, inseam: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Outseam (Waist to Bottom)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="41.0"
                          value={measurementForm.outseam}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, outseam: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Thigh Circumference</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="24.0"
                          value={measurementForm.thigh}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, thigh: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Knee Circumference</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="18.0"
                          value={measurementForm.knee}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, knee: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase text-neutral-400 block mb-1">Ankle / Bottom Opening</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="14.5"
                          value={measurementForm.ankleOpening}
                          onChange={(e) => setMeasurementForm({ ...measurementForm, ankleOpening: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm font-mono focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs text-neutral-500">{measurementForm.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: POSTURE & BALANCE */}
              {measurementTab === "posture" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Posture & Asymmetrical Drop Adjustments</h3>
                      <p className="text-xs text-neutral-400">Master cutter balances for natural spine curvature and shoulder slope.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Shoulder Slope */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wide block">Shoulder Slope</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["SQUARE", "NORMAL", "SLOPING"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMeasurementForm({ ...measurementForm, shoulderType: s })}
                            className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center ${
                              measurementForm.shoulderType === s
                                ? "bg-amber-500 text-black border-amber-500"
                                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 grid grid-cols-2 gap-3 border-t border-neutral-800">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Left Drop</label>
                          <input
                            type="text"
                            placeholder="0"
                            value={measurementForm.leftShoulderDrop}
                            onChange={(e) => setMeasurementForm({ ...measurementForm, leftShoulderDrop: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-1">Right Drop</label>
                          <input
                            type="text"
                            placeholder="-0.5 in"
                            value={measurementForm.rightShoulderDrop}
                            onChange={(e) => setMeasurementForm({ ...measurementForm, rightShoulderDrop: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Spine / Posture Tilt */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wide block">Spine & Posture</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["ERECT", "REGULAR", "STOOPED"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setMeasurementForm({ ...measurementForm, postureType: p })}
                            className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center ${
                              measurementForm.postureType === p
                                ? "bg-amber-500 text-black border-amber-500"
                                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 space-y-2 border-t border-neutral-800">
                        <label className="text-[10px] text-neutral-400 block">Chest Prominence</label>
                        <select
                          value={measurementForm.chestBalance}
                          onChange={(e: any) => setMeasurementForm({ ...measurementForm, chestBalance: e.target.value })}
                          className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-semibold"
                        >
                          <option value="STANDARD">Standard Balance (+0.0")</option>
                          <option value="PROMINENT">Athletic / Prominent (+0.5" Front Chest)</option>
                          <option value="FLAT">Flat / Concave (-0.5" Front Chest)</option>
                        </select>
                      </div>
                    </div>

                    {/* Trouser Seat & Fit Drape */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wide block">Trouser Seat & Drape</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["SLIM", "REGULAR", "RELAXED"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setMeasurementForm({ ...measurementForm, fitPreference: f })}
                            className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition text-center ${
                              measurementForm.fitPreference === f
                                ? "bg-amber-500 text-black border-amber-500"
                                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 space-y-2 border-t border-neutral-800">
                        <label className="text-[10px] text-neutral-400 block">Seat Pitch / Incline</label>
                        <select
                          value={measurementForm.seatPitch}
                          onChange={(e: any) => setMeasurementForm({ ...measurementForm, seatPitch: e.target.value })}
                          className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-semibold"
                        >
                          <option value="BALANCED">Balanced Seat (Standard Rise)</option>
                          <option value="PROMINENT_SEAT">Prominent Seat (+0.75" Back Rise)</option>
                          <option value="FLAT_SEAT">Flat Seat (-0.5" Back Incline)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WORKSHOP & CUTTER INSTRUCTIONS */}
              {measurementTab === "workshop" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Workshop Chalk Notes & Cutter Blueprint</h3>
                      <p className="text-xs text-neutral-400">Specific instructions printed directly on the Master Cut Sheet for the cutting room.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-300 block mb-1">
                        Master Cutter & Atelier Chalk Instructions
                      </label>
                      <textarea
                        rows={6}
                        placeholder="e.g. Lower right armhole by 0.5 inches for low right shoulder. Cut high gorge lapel with 3.75-inch width. Leave 2.0-inch inlay along trouser outseam for baste fitting adjustments."
                        value={measurementForm.tailorNotes}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, tailorNotes: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:border-amber-500 focus:outline-none placeholder:text-neutral-600 font-sans"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Dual-Sync Blueprint Enabled</strong>
                        Saving these measurements will update the client's reusable fitting profile and lock an immutable blueprint snapshot for Commission #{measurementModalOrder.orderNumber}.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-neutral-950 border-t border-neutral-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-neutral-500">
                {countFilledMeasurements({ customMeasurements: measurementForm })} measurement points drafted.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setMeasurementModalOrder(null)}
                  disabled={isSavingMeasurements}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMeasurements(false)}
                  disabled={isSavingMeasurements}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{isSavingMeasurements ? "Saving..." : "Save Blueprint"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMeasurements(true)}
                  disabled={isSavingMeasurements}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{isSavingMeasurements ? "Saving..." : "Save & Advance to Pattern Cutting ✂️"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Notification Modal */}
      {activeWaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-base">Stage Advanced — Notify Customer</h3>
            </div>
            <p className="text-xs text-neutral-300">
              A pre-formatted WhatsApp message has been prepared for the client.
            </p>
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 text-xs font-mono text-neutral-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {activeWaModal.waMessage}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveWaModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Dismiss
              </button>
              <a
                href={activeWaModal.waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveWaModal(null)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
              >
                <MessageSquare className="w-4 h-4" />
                Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
