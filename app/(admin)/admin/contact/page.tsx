import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import ContactInboxClient from "./ContactInboxClient"
import { Mail, MessageSquare, Clock, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminContactPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.contactMessage.count({
      where: { isRead: false },
    }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Mail className="w-3.5 h-3.5" />
              Direct Customer Support
            </span>
            <span className="text-xs text-zinc-600 font-medium">Inbound support inquiries & email replies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Support & Contact Inbox</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Read, manage, and dispatch official email replies to customer inquiries submitted through the storefront.
          </p>
        </div>
      </div>

      <ContactInboxClient
        initialMessages={JSON.parse(JSON.stringify(messages))}
        initialUnreadCount={unreadCount}
      />
    </div>
  )
}
