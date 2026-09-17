import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import FBTClient from "./FBTClient"

export const dynamic = "force-dynamic"

export default async function FBTPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const [products, allPairs] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, images: { take: 1 } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.frequentlyBoughtTogether.findMany({
      include: { secondary: { select: { id: true, name: true, images: { take: 1 } } } },
      orderBy: { score: "desc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frequently Bought Together</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up product pairings shown on each product page. Every product can have multiple suggestions.
        </p>
      </div>
      <FBTClient products={JSON.parse(JSON.stringify(products))} initialPairs={JSON.parse(JSON.stringify(allPairs))} />
    </div>
  )
}
