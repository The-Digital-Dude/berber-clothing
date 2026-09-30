import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getCustomerRisk } from "@/lib/customerRisk"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const risk = await getCustomerRisk(phone, true)
    return NextResponse.json({ success: true, risk })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to check fraud score" },
      { status: 500 }
    )
  }
}
