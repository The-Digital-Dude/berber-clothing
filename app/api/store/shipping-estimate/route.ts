import { NextResponse } from "next/server"
import { resolveShippingCharge } from "@/lib/shippingZone"

// Called by the checkout form whenever the customer's district changes, so
// the displayed shipping estimate reflects zone-based pricing instead of
// the static global default computed once at page load.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district") || ""
  const subtotal = Number(searchParams.get("subtotal") || 0)

  if (!district) return NextResponse.json({ error: "district is required" }, { status: 400 })

  const charge = await resolveShippingCharge(district, subtotal).catch(() => null)
  if (charge === null) return NextResponse.json({ error: "Failed to resolve shipping charge" }, { status: 500 })

  return NextResponse.json({ charge })
}
