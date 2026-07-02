import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import BundlesClient from "./BundlesClient"

export default async function BundlesPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

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
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Product Bundles</h1>
        <p className="text-sm text-muted-foreground mt-1">Group products into fixed or pick-N bundles with a special bundle price.</p>
      </div>
      <BundlesClient data={JSON.parse(JSON.stringify(bundles))} products={JSON.parse(JSON.stringify(products))} />
    </div>
  )
}
