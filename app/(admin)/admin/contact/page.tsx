import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import ContactInboxClient from "./ContactInboxClient"
import { Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string; page?: string; limit?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const filter = (params.filter || "all").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(filter === "unread"
      ? { isRead: false }
      : filter === "replied"
      ? { isReplied: true }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [messages, totalFiltered, totalCount, unreadCount, repliedCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count({ where: { isReplied: true } }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit) || 1

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
        key={`contact-${page}-${limit}-${search}-${filter}`}
        initialMessages={JSON.parse(JSON.stringify(messages))}
        stats={{
          total: totalCount,
          unread: unreadCount,
          replied: repliedCount,
          rate: totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 0,
        }}
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  )
}
