import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAdminContactMessageAlert, sendContactConfirmation } from "@/lib/email"
import { createAdminNotification } from "@/lib/adminNotifications"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, subject, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    const contactMsg = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || null,
        message: message.trim(),
        isRead: false,
        isReplied: false,
      },
    })

    // Notify admin (email + notification center bell)
    sendAdminContactMessageAlert({
      name: contactMsg.name,
      email: contactMsg.email,
      subject: contactMsg.subject,
      message: contactMsg.message,
    }).catch((err) => {
      console.error("[sendAdminContactMessageAlert] error:", err)
    })

    createAdminNotification({
      type: "new_contact_message",
      title: `New message from ${contactMsg.name}`,
      message: contactMsg.subject || contactMsg.message.slice(0, 100),
      link: "/admin/contact",
      entityId: contactMsg.id,
    })

    // Let the customer know their message actually went through
    sendContactConfirmation({
      to: contactMsg.email,
      customerName: contactMsg.name,
      subject: contactMsg.subject,
      message: contactMsg.message,
    }).catch((err) => {
      console.error("[sendContactConfirmation] error:", err)
    })

    return NextResponse.json({ success: true, messageId: contactMsg.id })
  } catch (err: any) {
    console.error("[Contact API error]:", err)
    return NextResponse.json({ error: err.message || "Failed to submit message" }, { status: 500 })
  }
}
