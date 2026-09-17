"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function UnsubscribeClient() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""
  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => { setEmail(emailParam) }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    const res = await fetch("/api/store/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) { setStatus("done"); setMessage(data.message ?? "You've been unsubscribed.") }
    else { setStatus("error"); setMessage(data.error ?? "Something went wrong.") }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-2">Unsubscribe</h1>
      <p className="text-gray-500 text-sm mb-8">We're sad to see you go. Enter your email below to stop receiving marketing emails from us.</p>

      {status === "done" ? (
        <p className="text-green-700 font-medium">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border rounded-lg px-4 py-2.5 text-sm"
          />
          {status === "error" && <p className="text-red-600 text-sm">{message}</p>}
          <button type="submit" disabled={status === "loading"} className="w-full py-2.5 bg-black text-white rounded-lg text-sm disabled:opacity-50">
            {status === "loading" ? "Processing…" : "Unsubscribe"}
          </button>
        </form>
      )}
    </div>
  )
}
