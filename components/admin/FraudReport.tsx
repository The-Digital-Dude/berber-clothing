"use client"

import { AlertTriangle, CheckCircle2, ShieldAlert, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CustomerRisk } from "@/lib/customerRisk"

const LEVEL_STYLE: Record<string, { box: string; label: string; icon: typeof CheckCircle2 }> = {
  LOW: { box: "bg-emerald-50 border-emerald-200 text-emerald-800", label: "Safe to dispatch", icon: CheckCircle2 },
  MEDIUM: { box: "bg-amber-50 border-amber-200 text-amber-800", label: "Confirm by phone first", icon: AlertTriangle },
  HIGH: { box: "bg-rose-50 border-rose-200 text-rose-800", label: "Take advance payment", icon: ShieldAlert },
  NEW: { box: "bg-zinc-50 border-zinc-200 text-zinc-700", label: "No delivery history", icon: Info },
}

const COURIER_LABEL: Record<string, string> = {
  steadfast: "Steadfast", pathao: "Pathao", redx: "RedX", carrybee: "CarryBee", paperfly: "Paperfly",
}

/** Unified verdict: store history + Steadfast + multi-courier network. */
export default function FraudReport({
  risk,
  networkConfigured = true,
}: {
  risk: CustomerRisk
  networkConfigured?: boolean
}) {
  const style = LEVEL_STYLE[risk.riskLevel] || LEVEL_STYLE.NEW
  const Icon = style.icon
  const net = risk.network
  const sf = risk.steadfast

  return (
    <div className="space-y-3 text-xs">
      <div className={cn("flex items-start gap-3 rounded-xl border p-3.5", style.box)}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold">
            {risk.riskLevel === "NEW" ? "New / unknown" : `${risk.riskLevel} risk`} · {style.label}
          </p>
          {risk.fraudWarning && <p className="font-medium">{risk.fraudWarning}</p>}
          <p className="font-mono text-[11px] opacity-80">{risk.phone}</p>
        </div>
      </div>

      {net ? (
        <div className="rounded-xl border border-zinc-200 p-3.5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Courier network</span>
            <span className="text-zinc-500">
              {net.status || "—"}
              {net.score !== null && <> · <strong className="text-zinc-900">{net.score}%</strong> delivered</>}
            </span>
          </div>
          <p className="mb-2 text-zinc-600">
            <strong>{net.totalParcel}</strong> parcels ·{" "}
            <span className="font-semibold text-emerald-700">{net.successParcel} delivered</span> ·{" "}
            <span className="font-semibold text-rose-700">{net.cancelParcel} cancelled/returned</span>
            {net.unresolvedReports > 0 && (
              <> · <span className="font-semibold text-rose-700">{net.unresolvedReports} fraud report(s)</span></>
            )}
          </p>
          {net.couriers.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-100">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-2 py-1.5">Courier</th>
                    <th className="px-2 py-1.5">Total</th>
                    <th className="px-2 py-1.5">Delivered</th>
                    <th className="px-2 py-1.5">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {net.couriers.map((c) => (
                    <tr key={c.courier} className="border-t border-zinc-100">
                      <td className="px-2 py-1.5 font-medium">{COURIER_LABEL[c.courier] || c.courier}</td>
                      <td className="px-2 py-1.5">{c.total}</td>
                      <td className="px-2 py-1.5 text-emerald-700">{c.success} ({c.deliveredPercentage}%)</td>
                      <td className="px-2 py-1.5 text-rose-700">{c.cancel} ({c.returnPercentage}%)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-3 text-zinc-500">
          {networkConfigured
            ? "The courier network lookup returned no data for this number."
            : "Multi-courier screening is off. Add the fraud API key in Settings → Courier to include Pathao, RedX, CarryBee and Paperfly history."}
        </p>
      )}

      {sf && (
        <div className="rounded-xl border border-zinc-200 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Steadfast network</span>
          <p className="mt-1 text-zinc-600">
            {sf.deliveryRatio !== null ? (
              <><strong>{sf.deliveryRatio}%</strong> delivered · {sf.cancellationRatio ?? 0}% cancelled · {sf.returnRatio ?? 0}% returned</>
            ) : (
              "Not enough history yet"
            )}
            {sf.totalReports > 0 && (
              <span className="font-semibold text-rose-700">
                {" "}· {sf.totalReports} fraud report(s){sf.fraudCategories.length ? ` (${sf.fraudCategories.join(", ")})` : ""}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 p-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Our store</span>
        <p className="mt-1 text-zinc-600">
          {risk.totalOrders > 0 ? (
            <>
              <strong>{risk.delivered}</strong> delivered of <strong>{risk.totalOrders}</strong> orders
              {risk.returnedOrCancelled > 0 && <> · {risk.returnedOrCancelled} cancelled/returned</>}
            </>
          ) : (
            "No previous orders from this number."
          )}
        </p>
      </div>
    </div>
  )
}
