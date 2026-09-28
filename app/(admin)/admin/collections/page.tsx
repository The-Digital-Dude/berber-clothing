import prisma from "@/lib/prisma"
import CollectionsClient from "./CollectionsClient"
import { serialize } from "@/lib/utils"

export default async function SmartCollectionsPage() {
  const collections = await prisma.smartCollection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Smart Collections</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {collections.length} collections
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automated dynamic product groupings based on rule matching (tags, prices, categories, and attributes)
          </p>
        </div>
      </div>
      <CollectionsClient collections={serialize(collections) as any} />
    </div>
  )
}
