import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getPackzyBalance, getPackzyPayouts } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10)
    const [balanceRes, payoutsRes] = await Promise.allSettled([
      getPackzyBalance(),
      getPackzyPayouts(page),
    ])

    const balance = balanceRes.status === "fulfilled" ? balanceRes.value.balance : 0
    const payments = payoutsRes.status === "fulfilled" ? payoutsRes.value.payments : []

    return NextResponse.json({
      balance,
      payments,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch payouts and balance" }, { status: 500 })
  }
}
