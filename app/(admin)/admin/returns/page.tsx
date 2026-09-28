import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import ReturnsClient from "./ReturnsClient"
import { Undo2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReturnsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const returns = await prisma.returnRequest.findMany({
    include: {
      order: { select: { orderNumber: true, shippingName: true, shippingPhone: true } },
      items: { include: { orderItem: { select: { productName: true, size: true, color: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              <Undo2 className="w-3.5 h-3.5" />
              Reverse Logistics & RMA
            </span>
            <span className="text-xs text-zinc-600 font-medium">Customer exchange, return & refund workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Returns & RMA Management</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Review customer return requests, issue partial or full refunds, track inbound packages, and update RMA states.
          </p>
        </div>
      </div>

      <ReturnsClient data={JSON.parse(JSON.stringify(returns))} />
    </div>
  )
}
