"use client"

import { useState } from "react"
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Scissors,
  Filter,
  Search,
  Building,
  UserCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { buildWaLink } from "@/lib/whatsapp"

type Appointment = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  scheduledDate: string
  timeSlot: string
  purpose: string
  status: "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
  notes: string | null
  assignedTailorName: string | null
  createdAt: string
  bespokeOrder?: {
    id: string
    orderNumber: string
    garmentType: string
    status: string
  } | null
}

const PURPOSE_FORMAT: Record<string, string> = {
  INITIAL_CONSULTATION_AND_MEASUREMENT: "Initial Fitting & Measurement",
  BASTE_TRIAL_FITTING: "Baste / Muslin Trial Fitting",
  FINAL_FITTING_AND_PICKUP: "Final Fitting & Suit Pickup",
  GENERAL_STYLING: "Styling & Fabric Swatch Consultation",
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  CONFIRMED: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", label: "Confirmed" },
  CHECKED_IN: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "Checked In" },
  COMPLETED: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Completed" },
  CANCELLED: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", label: "Cancelled" },
  RESCHEDULED: { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400", label: "Rescheduled" },
}

export default function BespokeAppointmentsAdminClient({
  initialAppointments,
}: {
  initialAppointments: Appointment[]
}) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const reloadData = async () => {
    try {
      const url = new URL("/api/admin/bespoke/appointments", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
      if (search) url.searchParams.set("search", search)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.appointments) {
        setAppointments(data.appointments)
      }
    } catch {
      toast.error("Failed to refresh appointments")
    }
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    setIsUpdating(id)
    try {
      const res = await fetch("/api/admin/bespoke/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) throw new Error("Failed to update")

      toast.success("Appointment updated")
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    } catch {
      toast.error("Could not update appointment")
    } finally {
      setIsUpdating(null)
    }
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter
    const matchSearch =
      search === "" ||
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerPhone.includes(search)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-500" />
            Flagship Atelier Fitting Appointments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage VIP customer showroom fittings, tailor assignments, and WhatsApp communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Bookings</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-blue-500 uppercase">Confirmed Upcoming</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {appointments.filter((a) => a.status === "CONFIRMED").length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase">Checked-In / In Atelier</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {appointments.filter((a) => a.status === "CHECKED_IN").length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 uppercase">Fittings Completed</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {appointments.filter((a) => a.status === "COMPLETED").length}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Appointments List Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No bespoke appointments found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Consultation Type</th>
                  <th className="py-3.5 px-4">Assigned Tailor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filtered.map((item) => {
                  const dateFormatted = new Date(item.scheduledDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  const statusMeta = STATUS_BADGES[item.status] || STATUS_BADGES.CONFIRMED

                  const waReminder = `Hi ${item.customerName}, this is Berber Bespoke Atelier reminding you of your fitting session on ${dateFormatted} at ${item.timeSlot}. Address: House 12, Road 11, Banani. See you soon!`
                  const waLink = buildWaLink(item.customerPhone, waReminder)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-950/50 transition">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          {dateFormatted}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {item.timeSlot}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{item.customerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {item.customerPhone}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded mt-1 max-w-xs truncate">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-xs font-medium text-gray-900 dark:text-neutral-200 block">
                          {PURPOSE_FORMAT[item.purpose] || item.purpose}
                        </span>
                        {item.bespokeOrder && (
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            Order #{item.bespokeOrder.orderNumber} ({item.bespokeOrder.garmentType})
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <input
                          type="text"
                          defaultValue={item.assignedTailorName || ""}
                          placeholder="Assign Master Tailor..."
                          onBlur={(e) => {
                            if (e.target.value !== (item.assignedTailorName || "")) {
                              updateAppointment(item.id, { assignedTailorName: e.target.value })
                            }
                          }}
                          className="text-xs bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-gray-900 dark:text-white w-36"
                        />
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          disabled={isUpdating === item.id}
                          onChange={(e) => updateAppointment(item.id, { status: e.target.value as any })}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-none ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="CHECKED_IN">Checked In</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="RESCHEDULED">Rescheduled</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 text-xs font-medium transition"
                            title="Chat / Send reminder via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
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
    </div>
  )
}
