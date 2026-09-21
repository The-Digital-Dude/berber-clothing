import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, Package } from "lucide-react"
import StockAlertActions from "./StockAlertActions"

export const dynamic = "force-dynamic"

export default async function StockAlertsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  const alerts = await prisma.stockAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  }).catch(() => [])

  const pending = alerts.filter(a => !a.notified)
  const notified = alerts.filter(a => a.notified)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Back-in-Stock Alerts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Customers waiting to be notified when stock returns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{pending.length} pending</span>
          </div>
        </div>
      </div>

      {/* Pending alerts */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Waiting for Stock ({pending.length})</h2>
        </div>

        {pending.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No pending alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map(alert => (
              <div key={alert.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/products/${alert.variant?.product?.id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-amber-600 transition-colors truncate block"
                  >
                    {alert.variant?.product?.name ?? "Unknown product"}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {alert.variant?.size} / {alert.variant?.color}
                    {alert.variant?.sku ? ` · SKU: ${alert.variant.sku}` : ""}
                  </p>
                </div>
                <div className="text-sm text-gray-700 shrink-0">{alert.email}</div>
                <div className="text-xs text-gray-400 shrink-0">
                  {new Date(alert.createdAt).toLocaleDateString("en-BD")}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${
                    (alert.variant?.stock ?? 0) > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {(alert.variant?.stock ?? 0) > 0 ? `${alert.variant!.stock} in stock` : "Out of stock"}
                  </span>
                  <StockAlertActions alertId={alert.id} email={alert.email} inStock={(alert.variant?.stock ?? 0) > 0} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already notified */}
      {notified.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Already Notified ({notified.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {notified.slice(0, 50).map(alert => (
              <div key={alert.id} className="flex items-center gap-4 px-5 py-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {alert.variant?.product?.name ?? "Unknown"} — {alert.variant?.size}/{alert.variant?.color}
                  </p>
                </div>
                <div className="text-sm text-gray-500">{alert.email}</div>
                <div className="text-xs text-gray-400">
                  Notified
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 bg-gray-50 text-gray-500 border-gray-200">
                  Notified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
