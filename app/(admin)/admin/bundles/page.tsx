import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import BundlesClient from "./BundlesClient"
import { Layers, PackagePlus, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BundlesPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const [bundles, products] = await Promise.all([
    prisma.bundle.findMany({
      include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, images: { take: 1, select: { url: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Layers className="w-3.5 h-3.5" />
              Combo Kits & Bundling
            </span>
            <span className="text-xs text-zinc-600 font-medium">Fixed & Pick-N curated combo sets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Product Bundles & Combos</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Group products into fixed or custom choice bundles with bundle savings to drive higher cart volume.
          </p>
        </div>
      </div>

      <BundlesClient
        data={JSON.parse(JSON.stringify(bundles))}
        products={JSON.parse(JSON.stringify(products))}
      />
    </div>
  )
}
