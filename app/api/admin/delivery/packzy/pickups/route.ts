import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { createPickupRequest } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const { pickup_address, note, phone } = body

    if (!pickup_address) {
      return NextResponse.json({ error: "pickup_address is required" }, { status: 400 })
    }

    const result = await createPickupRequest({
      pickup_address,
      note,
      phone,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message, data: result.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to schedule pickup" }, { status: 500 })
  }
}
