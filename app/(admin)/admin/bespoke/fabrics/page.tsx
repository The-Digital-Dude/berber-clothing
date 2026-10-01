import prisma from "@/lib/prisma"
import BespokeFabricsAdminClient from "./BespokeFabricsAdminClient"
import { DEFAULT_BESPOKE_FABRICS } from "@/app/api/bespoke/fabrics/route"

export const dynamic = "force-dynamic"

export default async function AdminBespokeFabricsPage() {
  let fabrics = await prisma.bespokeFabric.findMany({
    orderBy: { createdAt: "desc" },
  })

  // Seed defaults if empty
  if (fabrics.length === 0) {
    await prisma.bespokeFabric.createMany({
      data: DEFAULT_BESPOKE_FABRICS.map((f) => ({
        ...f,
        stockMeters: 50,
        isAvailable: true,
      })),
      skipDuplicates: true,
    })
    fabrics = await prisma.bespokeFabric.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  const serialized = fabrics.map((f) => ({
    ...f,
    pricePerMeter: Number(f.pricePerMeter),
    stockMeters: Number(f.stockMeters),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BespokeFabricsAdminClient initialFabrics={serialized as any} />
    </div>
  )
}
