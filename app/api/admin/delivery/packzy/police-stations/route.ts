import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getPoliceStations } from "@/lib/steadfast"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const districts = await getPoliceStations()
    return NextResponse.json({ districts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch police stations" }, { status: 500 })
  }
}
