import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import SubscribersClient from "./SubscribersClient"
import { Mail, Send, Users, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SubscribersPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const subscribers = await prisma.marketingSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Mail className="w-3.5 h-3.5" />
              Audience & Growth
            </span>
            <span className="text-xs text-zinc-600 font-medium">Brevo newsletter & marketing list sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Marketing Subscribers</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Manage your opted-in newsletter subscribers, monitor list retention, and export clean CSVs for email campaigns.
          </p>
        </div>
      </div>

      <SubscribersClient data={JSON.parse(JSON.stringify(subscribers))} />
    </div>
  )
}
