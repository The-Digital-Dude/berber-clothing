import prisma from "@/lib/prisma"
import CampaignComposer from "./CampaignComposer"

export default async function CampaignsPage() {
  const [campaigns, subscriberCount] = await Promise.all([
    prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.marketingSubscriber.count({ where: { isActive: true } }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
      <CampaignComposer campaigns={campaigns as any} subscriberCount={subscriberCount} />
    </div>
  )
}
