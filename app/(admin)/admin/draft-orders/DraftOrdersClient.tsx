"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Draft {
  id: string
  userId: string | null
  guestEmail: string | null
  subtotal: number
  discount: number
  total: number
  status: string
  note: string | null
  expiresAt: string | null
  createdAt: string
}

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
}

export default function DraftOrdersClient({ drafts }: { drafts: Draft[] }) {
  const router = useRouter()
  const [items, setItems] = useState(drafts)

  const cancel = async (id: string) => {
    await fetch(`/api/admin/draft-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    setItems((prev) => prev.map((d) => d.id === id ? { ...d, status: "CANCELLED" } : d))
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/draft/${id}`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Draft Orders</h1>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{d.id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{d.guestEmail ?? d.userId ?? "—"}</td>
                <td className="px-4 py-2 font-medium">৳{d.total.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[d.status] ?? ""}`}>{d.status}</span>
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => copyLink(d.id)} className="text-xs text-blue-600 hover:underline">Copy Link</button>
                  {d.status === "OPEN" && (
                    <button onClick={() => cancel(d.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No draft orders yet.</p>}
      </div>
    </div>
  )
}
