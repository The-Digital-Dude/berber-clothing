import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { pingPackzy, testSteadfastConnection } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const [pingRes, connRes] = await Promise.all([
      pingPackzy(),
      testSteadfastConnection(),
    ])

    return NextResponse.json({
      ping: pingRes,
      authConnection: connRes,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Ping test failed" }, { status: 500 })
  }
}
