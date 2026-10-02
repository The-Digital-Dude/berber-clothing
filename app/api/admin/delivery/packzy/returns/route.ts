import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getReturnRequests, createReturnRequest } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10)
    const result = await getReturnRequests(page)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch return requests" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const { consignment_id, invoice, reason } = body

    if (!consignment_id && !invoice) {
      return NextResponse.json({ error: "Either consignment_id or invoice is required" }, { status: 400 })
    }

    const result = await createReturnRequest({
      consignment_id,
      invoice,
      reason,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message, data: result.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create return request" }, { status: 500 })
  }
}
