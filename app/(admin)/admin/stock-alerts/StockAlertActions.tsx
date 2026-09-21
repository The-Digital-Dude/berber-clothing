"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Send, Trash2 } from "lucide-react"

export default function StockAlertActions({
  alertId, email, inStock,
}: {
  alertId: string
  email: string
  inStock: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<"notify" | "delete" | null>(null)

  async function handleNotify() {
    setLoading("notify")
    try {
      const res = await fetch(`/api/admin/stock-alerts/${alertId}/notify`, { method: "POST" })
      if (res.ok) {
        toast.success(`Notification sent to ${email}`)
        router.refresh()
      } else {
        toast.error("Failed to send notification")
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    setLoading("delete")
    try {
      const res = await fetch(`/api/admin/stock-alerts/${alertId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Alert removed")
        router.refresh()
      } else {
        toast.error("Failed to remove alert")
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {inStock && (
        <button
          onClick={handleNotify}
          disabled={!!loading}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {loading === "notify" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Notify
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={!!loading}
        className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
      >
        {loading === "delete" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </div>
  )
}
