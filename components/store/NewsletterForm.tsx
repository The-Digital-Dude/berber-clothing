"use client"

import { useState } from "react"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    try {
      const res = await fetch("/api/store/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return <p className="text-sm text-berber-gold font-medium">You're subscribed!</p>
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        className="flex-1 bg-berber-surface border border-berber-border px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-berber-gold"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-berber-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-berber-gold transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-500 self-center">Error, try again</span>
      )}
    </form>
  )
}
