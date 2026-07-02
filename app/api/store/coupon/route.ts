import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 })
    }

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        error: `Minimum order of ৳${Number(coupon.minOrderAmount).toLocaleString()} required for this coupon`,
      }, { status: 400 })
    }

    let discount = 0
    if (coupon.type === "PERCENTAGE") {
      discount = (subtotal * Number(coupon.value)) / 100
    } else {
      discount = Math.min(Number(coupon.value), subtotal)
    }

    return NextResponse.json({ discount: Math.floor(discount), code: coupon.code })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
