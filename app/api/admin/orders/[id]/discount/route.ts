import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"
import { sendOrderConfirmation } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    const {
      action, // "APPLY_COUPON" | "APPLY_MANUAL" | "REMOVE_DISCOUNT" | "PREVIEW"
      couponCode,
      discountType, // "FLAT" | "PERCENTAGE"
      discountValue,
      reason,
      sendConfirmationEmail,
    } = body

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        items: { include: { product: { include: { images: true } } } },
        payment: true,
        delivery: true,
        coupon: true,
        statusLogs: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (["CANCELLED"].includes(order.status) && action !== "PREVIEW") {
      return NextResponse.json(
        { error: "Cannot modify discount on a cancelled order" },
        { status: 400 }
      )
    }

    const subtotal = Number(order.subtotal)
    const shippingCharge = Number(order.shippingCharge)
    const giftWrapCharge = Number(order.giftWrapCharge || 0)

    // 1. PREVIEW OR APPLY COUPON
    if (action === "APPLY_COUPON" || (action === "PREVIEW" && couponCode)) {
      if (!couponCode?.trim()) {
        return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
      }

      const normalizedCode = couponCode.toUpperCase().trim()
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
        include: { rule: true },
      })

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 })
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This coupon code has expired" }, { status: 400 })
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return NextResponse.json(
          { error: `Minimum order amount of ৳${Number(coupon.minOrderAmount).toLocaleString()} required for this coupon` },
          { status: 400 }
        )
      }

      let calculatedDiscount = 0
      let discountDetails = ""
      const rule = coupon.rule

      if (rule?.ruleType === "BOGO") {
        const buyQty = rule.buyQty ?? 1
        const getQty = rule.getQty ?? 1
        const units: number[] = []
        for (const item of order.items) {
          for (let i = 0; i < item.quantity; i++) {
            units.push(Number(item.price))
          }
        }
        units.sort((a, b) => a - b)
        const freeGroups = Math.floor(units.length / (buyQty + getQty))
        const freeCount = freeGroups * getQty
        calculatedDiscount = units.slice(0, freeCount).reduce((s, p) => s + p, 0)
        discountDetails = `BOGO (${freeCount} free items)`
      } else if (coupon.type === "PERCENTAGE") {
        calculatedDiscount = Math.round((subtotal * Number(coupon.value)) / 100)
        if (rule?.maxDiscount) {
          calculatedDiscount = Math.min(calculatedDiscount, Number(rule.maxDiscount))
        }
        discountDetails = `${coupon.value}% discount (max ৳${calculatedDiscount.toLocaleString()})`
      } else if (coupon.type === "FLAT") {
        calculatedDiscount = Math.min(Number(coupon.value), subtotal)
        discountDetails = `৳${Number(coupon.value).toLocaleString()} flat discount`
      }

      const calculatedTotal = Math.max(0, subtotal + shippingCharge + giftWrapCharge - calculatedDiscount)

      if (action === "PREVIEW") {
        return NextResponse.json({
          valid: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          discount: calculatedDiscount,
          newTotal: calculatedTotal,
          details: discountDetails,
        })
      }

      // Perform DB update in transaction
      const updated = await prisma.$transaction(async (tx) => {
        // Increment coupon usage
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        })

        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            discount: calculatedDiscount,
            couponId: coupon.id,
            total: calculatedTotal,
          },
          include: {
            user: true,
            address: true,
            items: { include: { product: { include: { images: true } } } },
            payment: true,
            delivery: true,
            coupon: true,
            statusLogs: { orderBy: { createdAt: "desc" } },
          },
        })

        await tx.orderStatusLog.create({
          data: {
            orderId: id,
            status: order.status,
            note: `Admin applied coupon code "${coupon.code}" (-৳${calculatedDiscount.toLocaleString()}). Revised grand total: ৳${calculatedTotal.toLocaleString()}`,
          },
        })

        return updatedOrder
      })

      await logAudit({
        actorId: session!.user.id,
        actorEmail: session!.user.email,
        actorRole: session!.user.role,
        action: "order.coupon_applied",
        entityType: "Order",
        entityId: id,
        before: { discount: order.discount, total: order.total, couponId: order.couponId },
        after: { discount: updated.discount, total: updated.total, couponId: updated.couponId },
      })

      // Optionally send email
      const customerEmail = updated.user?.email || updated.guestEmail
      if (sendConfirmationEmail && customerEmail) {
        sendOrderConfirmation({
          to: customerEmail,
          orderNumber: updated.orderNumber,
          customerName: updated.shippingName,
          items: updated.items.map((item: any) => ({
            productName: item.productName,
            size: item.size || "Default",
            color: item.color || "Default",
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: Number(updated.subtotal),
          shippingCharge: Number(updated.shippingCharge),
          discount: Number(updated.discount),
          giftWrapCharge: Number(updated.giftWrapCharge || 0),
          total: Number(updated.total),
          paymentMethod: updated.paymentMethod,
          shippingName: updated.shippingName,
          shippingPhone: updated.shippingPhone,
          shippingAddress: updated.shippingAddress,
          shippingArea: updated.shippingArea,
          shippingDistrict: updated.shippingDistrict,
          shippingDivision: updated.shippingDivision,
          note: updated.note || null,
          giftWrap: updated.giftWrap || false,
          giftMessage: updated.giftMessage || null,
        }).catch((e) => console.error("Email send error:", e))
      }

      return NextResponse.json({ order: updated, message: `Coupon ${coupon.code} applied successfully!` })
    }

    // 2. APPLY MANUAL DISCOUNT
    if (action === "APPLY_MANUAL") {
      const val = Number(discountValue)
      if (isNaN(val) || val <= 0) {
        return NextResponse.json({ error: "Please enter a valid positive discount amount" }, { status: 400 })
      }

      let manualDiscount = 0
      if (discountType === "PERCENTAGE") {
        if (val > 100) {
          return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 })
        }
        manualDiscount = Math.round((subtotal * val) / 100)
      } else {
        manualDiscount = Math.min(val, subtotal)
      }

      const calculatedTotal = Math.max(0, subtotal + shippingCharge + giftWrapCharge - manualDiscount)
      const reasonText = reason?.trim() ? ` (Reason: ${reason.trim()})` : ""

      const updated = await prisma.order.update({
        where: { id },
        data: {
          discount: manualDiscount,
          total: calculatedTotal,
          couponId: null, // custom manual discount overrides couponId
        },
        include: {
          user: true,
          address: true,
          items: { include: { product: { include: { images: true } } } },
          payment: true,
          delivery: true,
          coupon: true,
          statusLogs: { orderBy: { createdAt: "desc" } },
        },
      })

      await prisma.orderStatusLog.create({
        data: {
          orderId: id,
          status: order.status,
          note: `Admin applied manual discount of ৳${manualDiscount.toLocaleString()}${discountType === "PERCENTAGE" ? ` (${val}%)` : ""}${reasonText}. Revised grand total: ৳${calculatedTotal.toLocaleString()}`,
        },
      })

      await logAudit({
        actorId: session!.user.id,
        actorEmail: session!.user.email,
        actorRole: session!.user.role,
        action: "order.manual_discount_applied",
        entityType: "Order",
        entityId: id,
        before: { discount: order.discount, total: order.total },
        after: { discount: updated.discount, total: updated.total },
      })

      // Optionally send email
      const customerEmail = updated.user?.email || updated.guestEmail
      if (sendConfirmationEmail && customerEmail) {
        sendOrderConfirmation({
          to: customerEmail,
          orderNumber: updated.orderNumber,
          customerName: updated.shippingName,
          items: updated.items.map((item: any) => ({
            productName: item.productName,
            size: item.size || "Default",
            color: item.color || "Default",
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: Number(updated.subtotal),
          shippingCharge: Number(updated.shippingCharge),
          discount: Number(updated.discount),
          giftWrapCharge: Number(updated.giftWrapCharge || 0),
          total: Number(updated.total),
          paymentMethod: updated.paymentMethod,
          shippingName: updated.shippingName,
          shippingPhone: updated.shippingPhone,
          shippingAddress: updated.shippingAddress,
          shippingArea: updated.shippingArea,
          shippingDistrict: updated.shippingDistrict,
          shippingDivision: updated.shippingDivision,
          note: updated.note || null,
          giftWrap: updated.giftWrap || false,
          giftMessage: updated.giftMessage || null,
        }).catch((e) => console.error("Email send error:", e))
      }

      return NextResponse.json({ order: updated, message: "Manual discount applied successfully!" })
    }

    // 3. REMOVE DISCOUNT
    if (action === "REMOVE_DISCOUNT") {
      const calculatedTotal = subtotal + shippingCharge + giftWrapCharge

      const updated = await prisma.order.update({
        where: { id },
        data: {
          discount: 0,
          total: calculatedTotal,
          couponId: null,
        },
        include: {
          user: true,
          address: true,
          items: { include: { product: { include: { images: true } } } },
          payment: true,
          delivery: true,
          coupon: true,
          statusLogs: { orderBy: { createdAt: "desc" } },
        },
      })

      await prisma.orderStatusLog.create({
        data: {
          orderId: id,
          status: order.status,
          note: `Admin removed order discount/coupon. Restored grand total: ৳${calculatedTotal.toLocaleString()}`,
        },
      })

      await logAudit({
        actorId: session!.user.id,
        actorEmail: session!.user.email,
        actorRole: session!.user.role,
        action: "order.discount_removed",
        entityType: "Order",
        entityId: id,
        before: { discount: order.discount, total: order.total },
        after: { discount: 0, total: updated.total },
      })

      return NextResponse.json({ order: updated, message: "Discount removed successfully" })
    }

    return NextResponse.json({ error: "Invalid discount action" }, { status: 400 })
  } catch (err: any) {
    console.error("Order discount error:", err)
    return NextResponse.json({ error: err.message || "Failed to update discount" }, { status: 500 })
  }
}
