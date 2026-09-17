import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { Resend } from "resend"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()

  if (body.action === "send") {
    // Fetch all active subscribers
    const subscribers = await prisma.marketingSubscriber.findMany({
      where: { status: "subscribed" },
      select: { email: true },
    })

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    // Send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@berber.clothing"
      // Batch send (Resend allows up to 100 per request)
      const batchSize = 50
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map((s) =>
            resend.emails.send({ from: fromEmail, to: s.email, subject: campaign.subject, html: campaign.body })
          )
        )
      }
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), recipientCount: subscribers.length },
    })
    return NextResponse.json({ campaign: updated })
  }

  // Regular update (edit draft)
  const { name, subject, body: htmlBody, scheduledAt, status } = body
  const updated = await prisma.emailCampaign.update({
    where: { id },
    data: { name, subject, body: htmlBody, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, status },
  })
  return NextResponse.json({ campaign: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.emailCampaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
