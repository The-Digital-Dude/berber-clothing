import prisma from "@/lib/prisma"
import { SupplierClient } from "./SupplierClient"

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchaseOrders: true } } },
  })

  const formatted = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    note: s.note,
    purchaseOrderCount: s._count.purchaseOrders,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Suppliers & Manufacturers</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {suppliers.length} vendors
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage garment manufacturers, fabric suppliers, contact channels, and purchase order histories
          </p>
        </div>
      </div>
      <SupplierClient data={formatted} />
    </div>
  )
}
