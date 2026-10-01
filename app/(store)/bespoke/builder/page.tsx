import { Metadata } from "next"
import { Suspense } from "react"
import prisma from "@/lib/prisma"
import SuitBuilderClient from "./SuitBuilderClient"
import { DEFAULT_BESPOKE_FABRICS } from "@/app/api/bespoke/fabrics/route"

export const metadata: Metadata = {
  title: "Online Bespoke Suit Studio | Berber Made-to-Measure",
  description:
    "Design your custom bespoke suit online. Select from premium Italian and British mill fabrics, customize silhouette, lapels, lining, and monogram with live price calculation.",
}

export const dynamic = "force-dynamic"

export default async function BespokeBuilderPage() {
  let fabrics: any[] = []
  try {
    fabrics = await prisma.bespokeFabric.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    fabrics = DEFAULT_BESPOKE_FABRICS
  }

  if (fabrics.length === 0) {
    fabrics = DEFAULT_BESPOKE_FABRICS
  }

  // Serialize decimals for client component
  const serialized = fabrics.map((f) => ({
    ...f,
    pricePerMeter: Number(f.pricePerMeter),
    createdAt: f.createdAt ? f.createdAt.toISOString?.() || f.createdAt : null,
    updatedAt: f.updatedAt ? f.updatedAt.toISOString?.() || f.updatedAt : null,
  }))

  return (
    <div className="w-full min-h-screen bg-berber-bg text-berber-text">
      <Suspense fallback={<div className="p-12 text-center text-xs text-berber-text-muted">Loading Bespoke Studio...</div>}>
        <SuitBuilderClient initialFabrics={serialized} />
      </Suspense>
    </div>
  )
}
