"use client"
import { useState } from "react"
import { Mail, UserX, Download } from "lucide-react"
import { toast } from "sonner"

export default function SubscribersClient({ data }: { data: any[] }) {
  const [subscribers, setSubscribers] = useState(data)
  const [search, setSearch] = useState("")

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const active = subscribers.filter((s) => !s.unsubscribedAt)
  const unsub = subscribers.filter((s) => !!s.unsubscribedAt)

  const unsubscribe = async (email: string) => {
    if (!confirm(`Unsubscribe ${email}?`)) return
    const res = await fetch("/api/admin/subscribers/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setSubscribers((prev) => prev.map((s) => s.email === email ? { ...s, unsubscribedAt: new Date().toISOString() } : s))
      toast.success("Unsubscribed")
    } else {
      toast.error("Failed")
    }
  }

  const exportCSV = () => {
    const rows = [["Email", "Name", "Provider", "Subscribed", "Unsubscribed"]]
    filtered.forEach((s) => rows.push([s.email, s.name || "", s.provider || "brevo", s.createdAt?.slice(0,10) || "", s.unsubscribedAt?.slice(0,10) || ""]))
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "subscribers.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total</p>
          <p className="text-2xl font-bold mt-1">{subscribers.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{active.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Unsubscribed</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{unsub.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or name…"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Provider</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subscribed</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No subscribers found.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {s.email}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {s.provider || "brevo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-BD") : "—"}
                </td>
                <td className="px-4 py-3">
                  {s.unsubscribedAt ? (
                    <span className="text-xs text-red-600 font-medium">Unsubscribed</span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.unsubscribedAt && (
                    <button onClick={() => unsubscribe(s.email)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Unsubscribe">
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
