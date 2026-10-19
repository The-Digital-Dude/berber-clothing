import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getCustomerRisk } from "@/lib/customerRisk"
import { checkFraudNetwork, getFraudApiConfig, normalizeBdPhone } from "@/lib/fraudChecker"

export const dynamic = "force-dynamic"

// Unified fraud check: store history + Steadfast + multi-courier screening API.
// GET /api/admin/fraud-check?phone=017...&fresh=1
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const phone = normalizeBdPhone(searchParams.get("phone") || "")
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid 11-digit Bangladeshi mobile number" }, { status: 400 })
  }

  try {
    const [risk, config] = await Promise.all([
      getCustomerRisk(phone, searchParams.get("fresh") === "1"),
      getFraudApiConfig(),
    ])
    return NextResponse.json({ success: true, risk, networkConfigured: Boolean(config.apiKey) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fraud check failed" }, { status: 500 })
  }
}

// POST { apiKey?, baseUrl?, domain? } verifies the saved (or supplied) fraud API credentials.
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const override = {
    ...(body.apiKey ? { apiKey: String(body.apiKey).trim() } : {}),
    ...(body.baseUrl ? { baseUrl: String(body.baseUrl).trim().replace(/\/+$/, "") } : {}),
    ...(body.domain !== undefined ? { domain: String(body.domain).trim() } : {}),
  }
  const config = { ...(await getFraudApiConfig()), ...override }
  if (!config.apiKey) {
    return NextResponse.json({ success: false, message: "No API key saved yet." }, { status: 400 })
  }

  const report = await checkFraudNetwork("01700000000", true, override)
  return report
    ? NextResponse.json({ success: true, message: "Fraud API key verified." })
    : NextResponse.json(
        { success: false, message: "The fraud API rejected the request. Check the key, base URL and domain lock." },
        { status: 502 }
      )
}
