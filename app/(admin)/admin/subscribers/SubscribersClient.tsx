"use client"

import { useState, useMemo } from "react"
import { 
  Mail, 
  UserX, 
  Download, 
  Search, 
  Users, 
  UserCheck, 
  TrendingDown, 
  Send,
  CheckCircle2,
  Filter
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SubscribersClient({ data }: { data: any[] }) {
  const [subscribers, setSubscribers] = useState(data)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "UNSUB">("ALL")

  const stats = useMemo(() => {
    const total = subscribers.length
    const active = subscribers.filter((s) => !s.unsubscribedAt).length
    const unsub = subscribers.filter((s) => !!s.unsubscribedAt).length
    const retentionRate = total > 0 ? Math.round((active / total) * 100) : 0
    return { total, active, unsub, retentionRate }
  }, [subscribers])

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      if (statusFilter === "ACTIVE" && s.unsubscribedAt) return false
      if (statusFilter === "UNSUB" && !s.unsubscribedAt) return false

      if (search) {
        const q = search.toLowerCase()
        const matchEmail = s.email.toLowerCase().includes(q)
        const matchName = (s.name || "").toLowerCase().includes(q)
        if (!matchEmail && !matchName) return false
      }
      return true
    })
  }, [subscribers, statusFilter, search])

  const unsubscribe = async (email: string) => {
    if (!confirm(`Are you sure you want to unsubscribe ${email}?`)) return
    try {
      const res = await fetch("/api/admin/subscribers/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubscribers((prev) =>
          prev.map((s) => (s.email === email ? { ...s, unsubscribedAt: new Date().toISOString() } : s))
        )
        toast.success("Subscriber marked as unsubscribed")
      } else {
        toast.error("Failed to unsubscribe contact")
      }
    } catch {
      toast.error("Error unsubscribing contact")
    }
  }

  const exportCSV = () => {
    const rows = [["Email", "Name", "Provider", "SubscribedAt", "UnsubscribedAt"]]
    filtered.forEach((s) =>
      rows.push([
        s.email,
        s.name || "",
        s.provider || "brevo",
        s.createdAt?.slice(0, 10) || "",
        s.unsubscribedAt?.slice(0, 10) || "",
      ])
    )
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Audience</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Registered subscribers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Subscribers</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.active}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Receiving marketing emails</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Unsubscribed</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">{stats.unsub}</h3>
            <span className="text-xs text-rose-700/80 font-medium mt-1 block">Opted out of newsletters</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">List Retention Rate</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.retentionRate}%</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Active audience health</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search email address or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "ACTIVE", "UNSUB"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all text-xs whitespace-nowrap",
                statusFilter === t
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {t === "ALL" ? `All (${subscribers.length})` : t === "ACTIVE" ? `Active (${stats.active})` : `Unsubscribed (${stats.unsub})`}
            </button>
          ))}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-4 py-3.5">Subscriber Name</th>
                <th className="px-4 py-3.5">Provider Source</th>
                <th className="px-4 py-3.5">Date Subscribed</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No subscribers found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{s.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-700">
                      {s.name || <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {s.provider || "brevo"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 text-[11px]">
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="px-4 py-3.5">
                      {s.unsubscribedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Unsubscribed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {!s.unsubscribedAt && (
                        <button
                          onClick={() => unsubscribe(s.email)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Unsubscribe contact"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{subscribers.length}</strong> total subscribers
          </span>
        </div>
      </div>
    </div>
  )
}
