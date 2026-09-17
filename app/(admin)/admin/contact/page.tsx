import prisma from "@/lib/prisma"
import ContactInbox from "./ContactInbox"

export default async function ContactInboxPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const unread = messages.filter((m) => !m.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Contact Inbox</h1>
        {unread > 0 && (
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {unread} unread
          </span>
        )}
      </div>
      <ContactInbox messages={messages as any} />
    </div>
  )
}
