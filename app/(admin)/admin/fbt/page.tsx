import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import FBTClient from "./FBTClient"

export const dynamic = "force-dynamic"

export default async function FBTPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, images: { take: 1 } },
    orderBy: { name: "asc" },
    take: 500,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frequently Bought Together</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure product pairings shown on product pages to boost average order value.</p>
      </div>
      <FBTClient products={JSON.parse(JSON.stringify(products))} />
    </div>
  )
}
