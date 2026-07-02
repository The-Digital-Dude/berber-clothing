import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCustomerRisk } from "@/lib/customerRisk"
import { getBestAutoDiscount } from "@/lib/autoDiscount"
import { resolveShippingCharge } from "@/lib/shippingZone"
import { logAudit } from "@/lib/auditLog"
import { refreshCustomerSegments } from "@/lib/customerSegments"
import { cookies } from "next/headers"
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email"
import { mailchimpAddTags } from "@/lib/mailchimp"
import { klaviyoOrderPlaced } from "@/lib/klaviyo"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, address, paymentMethod, subtotal, shippingCharge, total, userId,
      note, giftWrap, giftMessage, giftWrapCharge, isGuest, guestEmail,
      loyaltyPointsRedeemed, loyaltyDiscount, storeCreditRedeemed, customFields,
      couponId, couponDiscount: clientCouponDiscount, deliveryDate } = body

    if (!items?.length || !address || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine if a COD deposit is required: either store-wide policy, or
    // this phone number has a poor delivery track record on our own orders.
    let depositAmount = 0
    if (paymentMethod === "COD") {
      const [depositSetting, amountSetting, risk] = await Promise.all([
        prisma.setting.findUnique({ where: { key: "cod_deposit_enabled" } }),
        prisma.setting.findUnique({ where: { key: "cod_deposit_amount" } }),
        getCustomerRisk(address.phone),
      ])
      const globallyEnabled = depositSetting?.value === "true"
      const isHighRisk = risk.riskLevel === "HIGH"
      if (globallyEnabled || isHighRisk) {
        depositAmount = Math.min(Number(amountSetting?.value || 100), total)
      }
    }

    // Re-validate prices and stock from DB — never trust client-sent prices
    const variantIds = items.map((i: any) => i.variantId)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { price: true, isActive: true } } },
    })

    const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]))

    for (const item of items) {
      const variant = variantMap[item.variantId]
      if (!variant || !variant.product.isActive) {
        return NextResponse.json({ error: `Product "${item.name}" is no longer available` }, { status: 400 })
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json({
          error: `Only ${variant.stock} unit(s) of "${item.name}" (${item.size}) left in stock`,
        }, { status: 400 })
      }
    }

    // Compute server-side totals from DB prices + fetch tax settings
    const serverSubtotal = items.reduce((sum: number, item: any) => {
      const variant = variantMap[item.variantId]
      return sum + Number(variant.product.price) * item.quantity
    }, 0)

    const [taxEnabledSetting, taxRateSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "tax_enabled" } }),
      prisma.setting.findUnique({ where: { key: "tax_rate" } }),
    ])

    const serverShippingCharge = await resolveShippingCharge(address.district, serverSubtotal)
    const taxEnabled = taxEnabledSetting?.value === "true"
    const taxRate = Number(taxRateSetting?.value || 0)
    const serverTaxAmount = taxEnabled ? Math.round((serverSubtotal * taxRate) / 100) : 0

    // Gift wrap — validate charge from DB setting
    const giftWrapSetting = giftWrap ? await prisma.setting.findUnique({ where: { key: "gift_wrap_charge" } }) : null
    const serverGiftWrapCharge = giftWrap ? Number(giftWrapSetting?.value || giftWrapCharge || 50) : 0

    // Validate coupon server-side
    let serverCouponDiscount = 0
    let validatedCouponId: string | null = null
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        include: { rule: true },
      })
      if (coupon && coupon.isActive &&
        !(coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) &&
        !(coupon.maxUses && coupon.usedCount >= coupon.maxUses)) {
        const rule = coupon.rule
        if (rule?.ruleType === "BOGO") {
          const buyQty = rule.buyQty ?? 1
          const getQty = rule.getQty ?? 1
          const units: number[] = []
          for (const item of items) {
            for (let i = 0; i < (item.quantity || 1); i++) {
              units.push(Number(variantMap[item.variantId].product.price))
            }
          }
          units.sort((a: number, b: number) => a - b)
          const freeGroups = Math.floor(units.length / (buyQty + getQty))
          const freeCount = freeGroups * getQty
          serverCouponDiscount = units.slice(0, freeCount).reduce((s: number, p: number) => s + p, 0)
        } else if (coupon.type === "PERCENTAGE") {
          serverCouponDiscount = Math.round((serverSubtotal * Number(coupon.value)) / 100)
          if (rule?.maxDiscount) serverCouponDiscount = Math.min(serverCouponDiscount, Number(rule.maxDiscount))
        } else if (coupon.type === "FLAT") {
          serverCouponDiscount = Math.min(Number(coupon.value), serverSubtotal)
        }
        // Cap at what the client claimed (prevents double-discount exploitation)
        serverCouponDiscount = Math.min(serverCouponDiscount, clientCouponDiscount || 0)
        validatedCouponId = coupon.id
      }
    }

    // Auto discount (bulk/tiered) — server-side validation, never trust client
    const cartItems = items.map((item: any) => ({
      variantId: item.variantId,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(variantMap[item.variantId].product.price),
    }))
    const autoDiscount = await getBestAutoDiscount(cartItems, serverSubtotal).catch(() => null)
    const autoDiscountAmount = autoDiscount?.savingAmount || 0

    // Validate loyalty points redemption
    let serverLoyaltyDiscount = 0
    if (userId && loyaltyPointsRedeemed > 0) {
      const loyaltyAgg = await prisma.loyaltyPoint.aggregate({ where: { userId }, _sum: { points: true } })
      const balance = loyaltyAgg._sum.points ?? 0
      const redemptionRate = Number((await prisma.setting.findUnique({ where: { key: "loyalty_redemption_rate" } }))?.value || 100)
      const maxDiscount = Math.floor(balance / redemptionRate)
      serverLoyaltyDiscount = Math.min(loyaltyDiscount || 0, maxDiscount)
    }

    // Validate store credit redemption
    let serverCreditDiscount = 0
    if (userId && storeCreditRedeemed > 0) {
      const credit = await prisma.storeCredit.findUnique({ where: { userId } })
      serverCreditDiscount = Math.min(storeCreditRedeemed, Number(credit?.balance ?? 0))
    }

    const serverTotal = Math.max(0, serverSubtotal + serverShippingCharge + serverTaxAmount + serverGiftWrapCharge - autoDiscountAmount - serverLoyaltyDiscount - serverCreditDiscount - serverCouponDiscount)

    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction to prevent race conditions
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for item: ${item.name} (${item.size})`)
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      const orderCount = await tx.order.count()
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

      return tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          isGuest: isGuest || false,
          guestEmail: isGuest ? (guestEmail || null) : null,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod,
          depositAmount,
          total: serverTotal,
          subtotal: serverSubtotal,
          shippingCharge: serverShippingCharge,
          discount: Math.max(0, autoDiscountAmount + serverCouponDiscount),
          couponId: validatedCouponId || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          note: note || null,
          giftWrap: giftWrap || false,
          giftMessage: giftWrap ? (giftMessage || null) : null,
          giftWrapCharge: serverGiftWrapCharge,
          customFields: customFields || undefined,
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingAddress: address.fullAddress,
          shippingArea: address.area,
          shippingDistrict: address.district,
          shippingDivision: address.division,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(variantMap[item.variantId].product.price),
              size: item.size || "Default",
              color: item.color || "Default",
            })),
          },
        },
      })
    })

    await logAudit({ action: "order.created", entityType: "Order", entityId: order.id, after: { orderNumber: order.orderNumber, total: serverTotal, paymentMethod } })

    // Increment coupon usage count
    if (validatedCouponId) {
      prisma.coupon.update({ where: { id: validatedCouponId }, data: { usedCount: { increment: 1 } } }).catch(() => {})
    }

    // Deduct loyalty points used
    if (userId && serverLoyaltyDiscount > 0) {
      const redemptionRate = Number((await prisma.setting.findUnique({ where: { key: "loyalty_redemption_rate" } }))?.value || 100)
      const pointsUsed = serverLoyaltyDiscount * redemptionRate
      prisma.loyaltyPoint.create({
        data: { userId, points: -pointsUsed, type: "REDEEMED", description: `Redeemed for order ${order.orderNumber}`, orderId: order.id },
      }).catch(() => {})
    }

    // Deduct store credit used
    if (userId && serverCreditDiscount > 0) {
      prisma.$transaction(async (tx) => {
        const credit = await tx.storeCredit.findUnique({ where: { userId: userId! } })
        if (!credit) return
        await tx.storeCredit.update({ where: { userId: userId! }, data: { balance: { decrement: serverCreditDiscount } } })
        await tx.storeCreditTransaction.create({
          data: { userId: userId!, storeCreditId: credit.id, amount: serverCreditDiscount, type: "DEBIT", reason: `Applied to order ${order.orderNumber}`, orderId: order.id },
        })
      }).catch(() => {})
    }

    // Refresh customer segments after new order (fire-and-forget)
    if (userId) {
      refreshCustomerSegments(userId).catch(() => {})
    }

    // Record affiliate conversion if referral cookie present
    const cookieStore = await cookies()
    const refCode = cookieStore.get("berber_ref")?.value
    if (refCode) {
      try {
        const affiliate = await prisma.affiliate.findUnique({ where: { code: refCode, isActive: true } })
        if (affiliate) {
          const commission = affiliate.commissionType === "PERCENTAGE"
            ? Math.round((serverTotal * Number(affiliate.commissionValue)) / 100)
            : Number(affiliate.commissionValue)
          await prisma.$transaction([
            prisma.affiliateConversion.create({
              data: { affiliateId: affiliate.id, orderId: order.id, orderTotal: serverTotal, commission },
            }),
            prisma.affiliate.update({
              where: { id: affiliate.id },
              data: { totalEarned: { increment: commission } },
            }),
          ])
        }
      } catch {
        // non-critical
      }
    }

    // Send order confirmation email (fire-and-forget)
    const toEmail = isGuest ? guestEmail : (await prisma.user.findUnique({ where: { id: userId || "" }, select: { email: true } }))?.email
    if (toEmail) {
      sendOrderConfirmation({
        to: toEmail,
        orderNumber: order.orderNumber,
        customerName: address.name,
        items: items.map((item: any) => ({
          productName: item.name,
          size: item.size || "Default",
          color: item.color || "Default",
          quantity: item.quantity,
          price: Number(variantMap[item.variantId].product.price),
        })),
        subtotal: serverSubtotal,
        shippingCharge: serverShippingCharge,
        discount: autoDiscountAmount,
        giftWrapCharge: serverGiftWrapCharge,
        total: serverTotal,
        paymentMethod,
        shippingName: address.name,
        shippingPhone: address.phone,
        shippingAddress: address.fullAddress,
        shippingArea: address.area,
        shippingDistrict: address.district,
        shippingDivision: address.division,
        note: note || null,
        giftWrap: giftWrap || false,
        giftMessage: giftMessage || null,
      }).catch(() => {})
    }

    // Send admin new-order notification (fire-and-forget)
    sendAdminNewOrder({
      orderNumber: order.orderNumber,
      customerName: address.name,
      customerEmail: isGuest ? (guestEmail || "") : (toEmail || ""),
      customerPhone: address.phone,
      items: items.map((item: any) => ({
        productName: item.name,
        size: item.size || "Default",
        color: item.color || "Default",
        quantity: item.quantity,
        price: Number(variantMap[item.variantId].product.price),
      })),
      subtotal: serverSubtotal,
      shippingCharge: serverShippingCharge,
      discount: autoDiscountAmount + serverCouponDiscount,
      total: serverTotal,
      paymentMethod,
      shippingAddress: address.fullAddress,
      shippingArea: address.area,
      shippingDistrict: address.district,
      shippingDivision: address.division,
    }).catch(() => {})

    // Wire Klaviyo + Mailchimp (fire-and-forget)
    if (toEmail) {
      klaviyoOrderPlaced(toEmail, {
        orderNumber: order.orderNumber,
        total: serverTotal,
        items: items.map((item: any) => ({
          productName: item.name,
          quantity: item.quantity,
          price: Number(variantMap[item.variantId].product.price),
        })),
      }).catch(() => {})
      if (!isGuest) {
        mailchimpAddTags(toEmail, ["has_ordered"]).catch(() => {})
      }
    }

    return NextResponse.json({ orderId: order.id, depositAmount })
  } catch (error: any) {
    console.error("Checkout error", error)
    const isStockError = error.message?.includes("stock") || error.message?.includes("available")
    return NextResponse.json({ error: error.message }, { status: isStockError ? 400 : 500 })
  }
}
