import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { sendTemplatePreviewTo, EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { template, to } = await req.json()
  if (!template || !EMAIL_TEMPLATE_KEYS.includes(template)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 })
  }
  if (!to) {
    return NextResponse.json({ error: "Recipient email required" }, { status: 400 })
  }

  try {
    await sendTemplatePreviewTo(template as EmailTemplateKey, to)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Send failed" }, { status: 500 })
  }
}
