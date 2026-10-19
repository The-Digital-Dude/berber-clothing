"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import FraudReport from "@/components/admin/FraudReport"
import { fetchFraud } from "@/components/admin/FraudCheckButton"
import type { CustomerRisk } from "@/lib/customerRisk"

export default function FraudCheckerClient() {
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ risk: CustomerRisk; networkConfigured: boolean } | null>(null)

  async function check(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      setResult(await fetchFraud(phone, true))
    } catch (err: any) {
      setResult(null)
      toast.error(err.message || "Fraud check failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <form onSubmit={check} className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
          inputMode="tel"
          autoFocus
          className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Checking…" : "Check"}
        </button>
      </form>
      {result && <FraudReport risk={result.risk} networkConfigured={result.networkConfigured} />}
    </div>
  )
}
