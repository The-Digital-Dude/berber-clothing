import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getTrackingTimeline } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const invoice = req.nextUrl.searchParams.get("invoice")
    if (!invoice) {
      return NextResponse.json({ error: "invoice is required" }, { status: 400 })
    }

    const timeline = await getTrackingTimeline(invoice.trim())
    return NextResponse.json({ invoice, timeline })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch tracking timeline" }, { status: 500 })
  }
}
