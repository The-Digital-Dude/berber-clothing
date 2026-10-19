"use client"

import { useCallback, useState } from "react"
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import FraudReport from "@/components/admin/FraudReport"
import type { CustomerRisk } from "@/lib/customerRisk"
import { cn } from "@/lib/utils"

type Result = { risk: CustomerRisk; networkConfigured: boolean }

const DOT: Record<string, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
  NEW: "bg-zinc-400",
}

export async function fetchFraud(phone: string, fresh = false): Promise<Result> {
  const res = await fetch(`/api/admin/fraud-check?phone=${encodeURIComponent(phone)}${fresh ? "&fresh=1" : ""}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Fraud check failed")
  return { risk: data.risk, networkConfigured: data.networkConfigured }
}

/**
 * One-click fraud check for any phone number. Drop it next to a phone in the
 * admin: the button turns into a coloured risk dot once checked, and clicking
 * again re-opens the full report.
 */
export default function FraudCheckButton({
  phone,
  className,
  label,
}: {
  phone: string
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const run = useCallback(
    async (fresh: boolean) => {
      if (loading) return // ignore double clicks while a check is in flight
      setLoading(true)
      try {
        setResult(await fetchFraud(phone, fresh))
      } catch (err: any) {
        toast.error(err.message || "Fraud check failed")
        setOpen(false)
      } finally {
        setLoading(false)
      }
    },
    [phone, loading]
  )

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation() // don't trigger row click handlers
    setOpen(true)
    if (!result) void run(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title="Check fraud risk"
        aria-label={`Check fraud risk for ${phone}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60",
          className
        )}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : result ? (
          <span className={cn("h-2 w-2 rounded-full", DOT[result.risk.riskLevel] || DOT.NEW)} />
        ) : (
          <ShieldCheck className="h-3 w-3" />
        )}
        {label ?? (result ? result.risk.riskLevel : "Check")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Fraud & delivery check</DialogTitle>
            <DialogDescription className="font-mono">{phone}</DialogDescription>
          </DialogHeader>
          {result ? (
            <>
              <FraudReport risk={result.risk} networkConfigured={result.networkConfigured} />
              <button
                type="button"
                onClick={() => run(true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                {loading ? "Checking live…" : "Re-check live"}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking couriers…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
