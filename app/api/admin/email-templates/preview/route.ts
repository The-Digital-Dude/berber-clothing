import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { renderTemplatePreview, EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/email"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const key = req.nextUrl.searchParams.get("template") as EmailTemplateKey | null
  if (!key || !EMAIL_TEMPLATE_KEYS.includes(key)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 })
  }

  const { subject, html } = await renderTemplatePreview(key)
  return NextResponse.json({ subject, html })
}
