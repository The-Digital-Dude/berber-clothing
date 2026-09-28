import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ContactInboxClient from "./ContactInboxClient"

export const dynamic = "force-dynamic"

export default async function AdminContactPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contact Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read and respond to inquiries submitted through the store contact form.
        </p>
      </div>

      <ContactInboxClient initialMessages={JSON.parse(JSON.stringify(messages))} initialUnreadCount={unreadCount} />
    </div>
  )
}
