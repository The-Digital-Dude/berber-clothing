import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { brevoUnsubscribe } from "@/lib/brevo"

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  await brevoUnsubscribe(email)
  return NextResponse.json({ ok: true })
}
