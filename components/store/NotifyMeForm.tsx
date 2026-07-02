"use client"

import { useState } from "react"
import { Bell } from "lucide-react"

export default function NotifyMeForm({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/store/stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, variantId }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("success")
        setMessage("We'll notify you when this is back in stock!")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to subscribe")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong")
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 p-3 bg-berber-success/10 border border-berber-success/20 rounded-xl text-sm text-berber-success font-medium">
        <Bell className="w-4 h-4 shrink-0" />
        {message}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-berber-text-muted flex items-center gap-2">
        <Bell className="w-4 h-4 text-berber-gold" />
        Out of stock — notify me when available
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2.5 bg-berber-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-berber-gold transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Notify Me"}
        </button>
      </form>
      {status === "error" && <p className="text-xs text-berber-error">{message}</p>}
    </div>
  )
}
