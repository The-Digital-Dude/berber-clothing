import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendContactReply } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  // The admin UI (ContactInboxClient.tsx) sends {id, replyText, ...} -- this
  // used to destructure {messageId, replyMessage}, which never matched
  // anything the client actually sent, so every reply 400'd.
  const { id, replyText } = body

  if (!id || !replyText?.trim()) {
    return NextResponse.json({ error: "id and replyText are required" }, { status: 400 })
  }

  const contactMsg = await prisma.contactMessage.findUnique({
    where: { id },
  })

  if (!contactMsg) {
    return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
  }

  // Update DB: mark read and replied
  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true, isReplied: true },
  })

  // Send branded email reply to customer -- using the DB's own record of the
  // name/email/subject/original message rather than trusting client-supplied
  // copies of the same fields.
  await sendContactReply({
    to: contactMsg.email,
    customerName: contactMsg.name,
    subject: contactMsg.subject,
    replyMessage: replyText.trim(),
    originalMessage: contactMsg.message,
  })

  return NextResponse.json({ success: true, message: updated })
}
