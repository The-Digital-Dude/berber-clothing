import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `RS-${date}-${rand}`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const partner = await prisma.affiliate.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ userId: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
        isActive: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: "No active partner/reseller profile found" }, { status: 403 })
    }

    const body = await req.json()
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerArea = "Inside Dhaka",
      customerDistrict = "Dhaka",
      customerDivision = "Dhaka",
      senderShopName,
      senderPhone,
      items, // array of { productId, variantId, size, color, quantity, customerUnitPrice }
      resellerNote,
      advancePaymentMethod = "WALLET", // WALLET, MANUAL, GATEWAY
      advanceTrxId,
    } = body

    if (!customerName || !customerPhone || !customerAddress) {
      return NextResponse.json({ error: "Customer name, phone, and delivery address are required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Please add at least one product item" }, { status: 400 })
    }

    const discountPct = Number(partner.resellerDiscountPct || 15)
    const isInsideDhaka = customerArea.toLowerCase().includes("inside") || customerDistrict.toLowerCase() === "dhaka"
    const shippingCharge = isInsideDhaka ? 120 : 150
    const advanceCharge = shippingCharge // Advance delivery charge

    // Fetch products & validate stock
    let totalBaseCost = 0
    let totalCustomerPrice = 0
    const orderItemsData: any[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 })
      }

      const variant = product.variants.find((v) => v.id === item.variantId) || product.variants[0]
      const qty = parseInt(item.quantity) || 1
      const retailPrice = variant?.price ? Number(variant.price) : Number(product.price)
      const wholesaleBaseUnitPrice = Math.round(retailPrice * (1 - discountPct / 100))
      const customerUnitPrice = Number(item.customerUnitPrice) || retailPrice

      if (customerUnitPrice < wholesaleBaseUnitPrice) {
        return NextResponse.json({
          error: `Customer selling price for ${product.name} (৳${customerUnitPrice}) cannot be less than wholesale base cost (৳${wholesaleBaseUnitPrice})`,
        }, { status: 400 })
      }

      totalBaseCost += wholesaleBaseUnitPrice * qty
      totalCustomerPrice += customerUnitPrice * qty

      orderItemsData.push({
        productId: product.id,
        variantId: variant?.id || null,
        productName: product.name,
        size: item.size || variant?.size || "Regular",
        color: item.color || variant?.color || "Default",
        price: customerUnitPrice, // Price shown on customer invoice
        quantity: qty,
        subtotal: customerUnitPrice * qty,
      })
    }

    const netProfit = totalCustomerPrice - totalBaseCost
    const customerGrandTotal = totalCustomerPrice + shippingCharge

    // Check Advance Payment
    let isAdvancePaid = false
    let initialStatus = "AWAITING_ADVANCE"
    let currentWallet = Number(partner.walletBalance || 0)

    if (advancePaymentMethod === "WALLET") {
      if (currentWallet < advanceCharge) {
        return NextResponse.json({
          error: `Insufficient wallet balance (৳${currentWallet.toLocaleString()}). You need ৳${advanceCharge} for the advance delivery fee. You can pay via bKash/Nagad instead.`,
        }, { status: 400 })
      }

      // Deduct advance delivery charge from wallet balance
      await prisma.affiliate.update({
        where: { id: partner.id },
        data: {
          walletBalance: { decrement: advanceCharge },
        },
      })
      isAdvancePaid = true
      initialStatus = "CONFIRMED"
    } else if (advancePaymentMethod === "MANUAL" && advanceTrxId) {
      isAdvancePaid = true
      initialStatus = "CONFIRMED"
    }

    const orderNumber = generateOrderNumber()

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: initialStatus,
        paymentMethod: "COD",
        paymentStatus: isAdvancePaid ? "PARTIALLY_PAID" : "UNPAID",
        subtotal: totalCustomerPrice,
        shippingCharge,
        total: customerGrandTotal,
        note: resellerNote || `Reseller Dropship Order via ${senderShopName || partner.shopName || partner.name}`,
        
        // Reseller Dropship fields
        isResellerOrder: true,
        resellerId: partner.id,
        resellerShopName: senderShopName || partner.shopName || partner.name,
        resellerPhone: senderPhone || partner.phone || "",
        resellerBaseCost: totalBaseCost,
        resellerCustomerPrice: totalCustomerPrice,
        resellerProfit: netProfit,
        resellerProfitPaid: false,
        advanceCharge,
        advancePaid: isAdvancePaid,
        advanceTrxId: advanceTrxId || null,
        advanceMethod: advancePaymentMethod,

        // Customer Shipping Address
        shippingName: customerName.trim(),
        shippingPhone: customerPhone.trim(),
        shippingAddress: customerAddress.trim(),
        shippingArea: customerArea,
        shippingDistrict: customerDistrict,
        shippingDivision: customerDivision,

        items: {
          create: orderItemsData,
        },
        statusLogs: {
          create: {
            status: initialStatus,
            note: isAdvancePaid
              ? `Reseller dropship order created and advance delivery charge (৳${advanceCharge}) confirmed via ${advancePaymentMethod}.`
              : `Reseller dropship order created. Awaiting advance delivery charge payment of ৳${advanceCharge}.`,
          },
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      ok: true,
      order,
      advanceCharge,
      isAdvancePaid,
      netProfit,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create dropship order" }, { status: 500 })
  }
}
