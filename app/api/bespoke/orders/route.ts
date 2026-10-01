import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { BespokeGarmentType, BespokeOrderStatus } from "@prisma/client"
import { buildWaLink, sendWhatsAppMessage } from "@/lib/whatsapp"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      garmentType = "TWO_PIECE_SUIT",
      designSpecs,
      fabricId,
      measurementProfileId,
      customMeasurements,
      basePrice = 18000,
      customizationsPrice = 0,
      totalPrice = 18000,
      depositAmount = null,
      fulfillmentType = "OUTLET_PICKUP",
      customerName,
      customerPhone,
      customerEmail,
      userId,
      notes,
    } = body

    if (!customerName || !customerPhone || !designSpecs) {
      return NextResponse.json(
        { error: "Customer details and design specifications are required." },
        { status: 400 }
      )
    }

    const orderNumber = `BSP-${Date.now().toString().slice(-6)}`

    // Create user if not existing or get guest user
    let actualUserId = userId

    if (!actualUserId) {
      // Find or create user by phone/email
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            customerEmail ? { email: customerEmail } : undefined,
            customerPhone ? { phone: customerPhone } : undefined,
          ].filter(Boolean) as any,
        },
      })

      if (existingUser) {
        actualUserId = existingUser.id
      } else {
        const guestId = `guest_${Date.now()}`
        const newUser = await prisma.user.create({
          data: {
            id: guestId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || `bespoke_${orderNumber.toLowerCase()}@berber.clothing`,
            role: "CUSTOMER",
          },
        })
        actualUserId = newUser.id
      }
    }

    const bespokeOrder = await prisma.bespokeOrder.create({
      data: {
        orderNumber,
        userId: actualUserId,
        garmentType: garmentType as BespokeGarmentType,
        status: BespokeOrderStatus.FABRIC_SOURCING,
        designSpecs: typeof designSpecs === "string" ? designSpecs : JSON.stringify(designSpecs),
        fabricId: fabricId || null,
        measurementProfileId: measurementProfileId || null,
        customMeasurements: customMeasurements
          ? typeof customMeasurements === "string"
            ? customMeasurements
            : JSON.stringify(customMeasurements)
          : null,
        basePrice,
        customizationsPrice,
        totalPrice,
        depositAmount: depositAmount || totalPrice * 0.5,
        depositPaid: false,
        isFullyPaid: false,
        fulfillmentType: fulfillmentType || "OUTLET_PICKUP",
        alterationNotes: notes || null,
      },
    })

    // Log initial production timeline stage
    await prisma.bespokeTimelineLog.create({
      data: {
        bespokeOrderId: bespokeOrder.id,
        status: BespokeOrderStatus.FABRIC_SOURCING,
        title: "Bespoke Commission Received & Cloth Reserved",
        description: `Order #${orderNumber} registered. Master cloth cutting pattern scheduled.`,
        updatedByRole: "SYSTEM",
      },
    })

    const parsedSpecs = typeof designSpecs === "string" ? JSON.parse(designSpecs) : designSpecs
    const fabricName = parsedSpecs?.fabric?.name || "Premium Wool"

    const waMsg = `✨ *Berber Bespoke Commission Confirmed*\n\nDear ${customerName},\n\nYour bespoke commission *#${orderNumber}* has been registered!\n\n👔 *Garment:* ${garmentType.replace(/_/g, " ")}\n🧵 *Cloth:* ${fabricName}\n💰 *Total:* ৳${Number(totalPrice).toLocaleString()}\n\nOur Master Tailor atelier will review your measurements and begin fabric reservation.\n\n_Berber Flagship Atelier, Banani, Dhaka_`

    const waLink = buildWaLink(customerPhone, waMsg)

    try {
      await sendWhatsAppMessage(customerPhone, waMsg)
    } catch {}

    return NextResponse.json({
      success: true,
      order: bespokeOrder,
      orderNumber,
      waLink,
    })
  } catch (error) {
    console.error("[BESPOKE_ORDER_POST]", error)
    return NextResponse.json({ error: "Failed to place bespoke commission" }, { status: 500 })
  }
}
