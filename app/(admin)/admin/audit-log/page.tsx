import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { 
  ShieldCheck, 
  Activity, 
  UserCheck, 
  Layers, 
  Clock, 
  Search,
  Filter,
  FileText
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; actor?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const { entity, actor } = await searchParams

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entityType: entity } : {}),
      ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const ACTION_BADGES: Record<string, string> = {
    "order.created": "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    "order.status_changed": "bg-blue-50 text-blue-700 border-blue-200/60",
    "order.items_modified": "bg-amber-50 text-amber-700 border-amber-200/60",
    "return.status_changed": "bg-rose-50 text-rose-700 border-rose-200/60",
    "product.updated": "bg-purple-50 text-purple-700 border-purple-200/60",
    "inventory.bulk_updated": "bg-cyan-50 text-cyan-800 border-cyan-200/60",
    "settings.updated": "bg-zinc-100 text-zinc-800 border-zinc-200",
  }

  const orderLogsCount = logs.filter((l) => l.action.startsWith("order.")).length
  const productLogsCount = logs.filter((l) => l.action.startsWith("product.") || l.action.startsWith("inventory.")).length
  const uniqueActors = new Set(logs.map((l) => l.actorEmail || "System")).size

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security & Compliance
            </span>
            <span className="text-xs text-zinc-600 font-medium">Immutable chronological activity ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Audit & Security Log</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Complete audit trail of system events, admin modifications, order state transitions, and inventory updates.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Recorded Actions</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{logs.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Last 200 system events</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Order Operations</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{orderLogsCount}</h3>
            <span className="text-xs text-blue-700/80 font-medium mt-1 block">Lifecycle & edit actions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Catalog & Stock</p>
            <h3 className="text-2xl font-bold text-purple-900 mt-1">{productLogsCount}</h3>
            <span className="text-xs text-purple-700/80 font-medium mt-1 block">SKU & price updates</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Actors</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{uniqueActors}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Distinct admin users & triggers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action Code</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Entity Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No audit events recorded</p>
                    <p className="text-xs text-zinc-600 mt-0.5">System operations will automatically appear here.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-600 font-medium whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                        <span>{log.actorEmail || "System Automation"}</span>
                        {log.actorRole && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {log.actorRole}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          ACTION_BADGES[log.action] || "bg-zinc-100 text-zinc-700 border-zinc-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-zinc-900 capitalize">
                      {log.entityType}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-600">
                      {log.entityId ? `${log.entityId.slice(0, 12)}…` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{logs.length}</strong> recorded audit events
          </span>
        </div>
      </div>
    </div>
  )
}
