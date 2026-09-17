import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubscriptionsClient from "./SubscriptionsClient"

export const dynamic = "force-dynamic"

export default async function SubscriptionsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const subscriptions = await prisma.subscription.findMany({
    include: {
      plan: { include: { product: { select: { name: true, slug: true } } } },
    },
    orderBy: { nextOrderAt: "asc" },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Recurring subscription orders across all customers.</p>
      </div>
      <SubscriptionsClient data={JSON.parse(JSON.stringify(subscriptions))} />
    </div>
  )
}
