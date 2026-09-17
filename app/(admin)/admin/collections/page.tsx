import prisma from "@/lib/prisma"
import CollectionsClient from "./CollectionsClient"

export default async function SmartCollectionsPage() {
  const collections = await prisma.smartCollection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Smart Collections</h1>
      <CollectionsClient collections={collections as any} />
    </div>
  )
}
