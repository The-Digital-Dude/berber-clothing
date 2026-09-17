import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubscribersClient from "./SubscribersClient"

export const dynamic = "force-dynamic"

export default async function SubscribersPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const subscribers = await prisma.marketingSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Subscribers</h1>
        <p className="text-sm text-muted-foreground mt-1">Customers subscribed via newsletter signup or account registration. Synced to Brevo.</p>
      </div>
      <SubscribersClient data={JSON.parse(JSON.stringify(subscribers))} />
    </div>
  )
}
