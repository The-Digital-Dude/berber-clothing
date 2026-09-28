import prisma from "@/lib/prisma"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Plus, ShoppingCart, Building, Calendar, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  PENDING: { badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending Delivery" },
  RECEIVED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold", label: "Stock Received" },
  CANCELLED: { badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" },
}

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, items: true },
  })

  const totalCost = purchaseOrders
    .filter((p) => p.status === "RECEIVED")
    .reduce((sum, p) => sum + Number(p.totalCost || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Purchase Orders & Restock</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {purchaseOrders.length} orders
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage manufacturer supply orders, track inbound garment stock, and receive inventory batches
          </p>
        </div>

        <Link href="/admin/purchase-orders/new">
          <Button className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> New Purchase Order
          </Button>
        </Link>
      </div>

      {/* PO Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">PO Number</TableHead>
              <TableHead className="text-zinc-700 font-bold">Supplier / Vendor</TableHead>
              <TableHead className="text-zinc-700 font-bold">Line Items</TableHead>
              <TableHead className="text-zinc-700 font-bold">Total Cost (৳)</TableHead>
              <TableHead className="text-zinc-700 font-bold">Inbound Status</TableHead>
              <TableHead className="text-zinc-700 font-bold">Created Date</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  No purchase orders created yet.
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => {
                const conf = STATUS_CONFIG[po.status] || { badge: "bg-zinc-100 text-zinc-600 border-zinc-200", label: po.status }

                return (
                  <TableRow key={po.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell className="pl-5 py-3.5 font-mono font-bold text-zinc-900">
                      {po.poNumber}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-zinc-900">{po.supplier.name}</div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono font-bold text-[11px]">
                        {po.items.length} items
                      </span>
                    </TableCell>

                    <TableCell className="font-mono font-black text-zinc-900">
                      ৳{Number(po.totalCost).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          conf.badge
                        )}
                      >
                        {conf.label}
                      </span>
                    </TableCell>

                    <TableCell className="text-zinc-500 font-mono text-[11px]">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right pr-5">
                      <Link href={`/admin/purchase-orders/${po.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
