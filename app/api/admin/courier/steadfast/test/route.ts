import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { testSteadfastConnection } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const { apiKey, secretKey, baseUrl } = body

    const result = await testSteadfastConnection({
      apiKey,
      secretKey,
      baseUrl,
    })

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to test connection" },
      { status: 500 }
    )
  }
}
