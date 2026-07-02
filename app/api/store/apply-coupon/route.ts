import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { code, items } = await req.json()
    if (!code) return NextResponse.json({ error: "Coupon code required" }, { status: 400 })

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { rule: true },
    })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or inactive coupon" }, { status: 400 })
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 })
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
    }

    const subtotal = (items || []).reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { error: `Minimum order ৳${coupon.minOrderAmount} required for this coupon` },
        { status: 400 }
      )
    }

    let discount = 0
    let message = ""
    const rule = coupon.rule

    if (rule?.ruleType === "BOGO") {
      const buyQty = rule.buyQty ?? 1
      const getQty = rule.getQty ?? 1
      // Flatten all cart units, sort ascending by price (cheapest first)
      const units: number[] = []
      for (const item of (items || [])) {
        for (let i = 0; i < (item.quantity || 1); i++) {
          units.push(Number(item.price))
        }
      }
      units.sort((a, b) => a - b)
      const freeGroups = Math.floor(units.length / (buyQty + getQty))
      const freeCount = freeGroups * getQty
      discount = units.slice(0, freeCount).reduce((s, p) => s + p, 0)
      message = freeCount > 0
        ? `BOGO: ${freeCount} item${freeCount > 1 ? "s" : ""} free — saving ৳${discount}`
        : `Add ${buyQty + getQty} items to activate BOGO`
    } else if (rule?.ruleType === "FREE_SHIPPING") {
      discount = 0
      message = "Free shipping will be applied at checkout"
    } else if (coupon.type === "PERCENTAGE") {
      discount = Math.round((subtotal * Number(coupon.value)) / 100)
      if (rule?.maxDiscount) discount = Math.min(discount, Number(rule.maxDiscount))
      message = `${coupon.value}% off applied`
    } else if (coupon.type === "FLAT") {
      discount = Math.min(Number(coupon.value), subtotal)
      message = `৳${coupon.value} discount applied`
    }

    return NextResponse.json({ discount, couponId: coupon.id, couponCode: coupon.code, message })
  } catch {
    return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 })
  }
}
