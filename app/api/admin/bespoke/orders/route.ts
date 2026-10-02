import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { BespokeOrderStatus } from "@prisma/client"
import { buildWaLink, sendWhatsAppMessage } from "@/lib/whatsapp"

// GET: Fetch bespoke orders with filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    if (status && status !== "ALL") {
      where.status = status as BespokeOrderStatus
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search } } },
      ]
    }

    const orders = await prisma.bespokeOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        measurementProfile: true,
        timelineLogs: {
          orderBy: { createdAt: "desc" },
        },
        appointments: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_ORDERS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch bespoke orders" }, { status: 500 })
  }
}

// PATCH: Update order status, assigned tailor, deposit, or record atelier measurements
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      status,
      assignedTailorId,
      depositPaid,
      isFullyPaid,
      timelineNote,
      photoUrl,
      measurements,
      updateCustomerProfile = true,
      advanceToPatternCutting = false,
    } = body

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const currentOrder = await prisma.bespokeOrder.findUnique({
      where: { id },
      include: { user: true, measurementProfile: true },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status as BespokeOrderStatus
    if (advanceToPatternCutting) updateData.status = BespokeOrderStatus.PATTERN_CUTTING
    if (assignedTailorId !== undefined) updateData.assignedTailorId = assignedTailorId
    if (depositPaid !== undefined) updateData.depositPaid = depositPaid
    if (isFullyPaid !== undefined) updateData.isFullyPaid = isFullyPaid

    // Handle measurements payload
    if (measurements && typeof measurements === "object") {
      updateData.customMeasurements = JSON.stringify(measurements)

      if (updateCustomerProfile && currentOrder.userId) {
        // Find existing profile or create a new one
        let profileId = currentOrder.measurementProfileId

        const profileData = {
          profileName: `${currentOrder.user.name || "Client"}'s Bespoke Cut (${measurements.unit || "inch"})`,
          unit: measurements.unit || "inch",
          heightCm: measurements.heightCm ? Number(measurements.heightCm) : undefined,
          weightKg: measurements.weightKg ? Number(measurements.weightKg) : undefined,
          fitPreference: measurements.fitPreference || "SLIM",
          shoulderType: measurements.shoulderType || "NORMAL",
          postureType: measurements.postureType || "REGULAR",
          neck: measurements.neck ? Number(measurements.neck) : undefined,
          chest: measurements.chest ? Number(measurements.chest) : undefined,
          stomach: measurements.stomach ? Number(measurements.stomach) : undefined,
          hips: measurements.hips ? Number(measurements.hips) : undefined,
          shoulderWidth: measurements.shoulderWidth ? Number(measurements.shoulderWidth) : undefined,
          sleeveLength: measurements.sleeveLength ? Number(measurements.sleeveLength) : undefined,
          bicep: measurements.bicep ? Number(measurements.bicep) : undefined,
          wrist: measurements.wrist ? Number(measurements.wrist) : undefined,
          jacketLength: measurements.jacketLength ? Number(measurements.jacketLength) : undefined,
          trouserWaist: measurements.trouserWaist ? Number(measurements.trouserWaist) : undefined,
          trouserHips: measurements.trouserHips ? Number(measurements.trouserHips) : undefined,
          crotchDepth: measurements.crotchDepth ? Number(measurements.crotchDepth) : undefined,
          inseam: measurements.inseam ? Number(measurements.inseam) : undefined,
          outseam: measurements.outseam ? Number(measurements.outseam) : undefined,
          thigh: measurements.thigh ? Number(measurements.thigh) : undefined,
          knee: measurements.knee ? Number(measurements.knee) : undefined,
          ankleOpening: measurements.ankleOpening ? Number(measurements.ankleOpening) : undefined,
          tailorNotes: measurements.tailorNotes || undefined,
        }

        if (profileId) {
          await prisma.measurementProfile.update({
            where: { id: profileId },
            data: profileData,
          })
        } else {
          const newProfile = await prisma.measurementProfile.create({
            data: {
              ...profileData,
              userId: currentOrder.userId,
              isDefault: true,
            },
          })
          updateData.measurementProfileId = newProfile.id
        }
      }
    }

    const effectiveNewStatus = updateData.status || currentOrder.status

    const updatedOrder = await prisma.bespokeOrder.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        measurementProfile: true,
        timelineLogs: { orderBy: { createdAt: "desc" } },
      },
    })

    // If status changed or note provided, log timeline
    if (effectiveNewStatus !== currentOrder.status || timelineNote || (measurements && advanceToPatternCutting)) {
      const statusTitleMap: Record<string, string> = {
        FABRIC_SOURCING: "Cloth Reserved & Pre-Shrunk",
        PATTERN_CUTTING: "Pattern Drafting & Hand Shearing",
        BASTE_FITTING_SCHEDULED: "Baste / Muslin Trial Suit Ready",
        BASTE_FITTING_COMPLETED: "Baste Trial Adjustments Recorded",
        FINAL_TAILORING: "Master Hand-Canvassing & Finishing",
        QUALITY_CONTROL: "Sartorial Quality Audit Passed",
        READY_FOR_PICKUP_OR_DELIVERY: "Garment Ready for Atelier Pickup",
        DELIVERED: "Garment Collected / Delivered",
        COMPLETED: "Commission Completed",
      }

      await prisma.bespokeTimelineLog.create({
        data: {
          bespokeOrderId: id,
          status: effectiveNewStatus as BespokeOrderStatus,
          title: statusTitleMap[effectiveNewStatus] || `Stage updated to ${effectiveNewStatus}`,
          description: timelineNote || (measurements ? "Atelier anatomical measurements recorded and blueprint drafted." : null),
          photoUrl: photoUrl || null,
          updatedByRole: "TAILOR",
        },
      })
    }

    // Generate WhatsApp notification helper message
    const customerPhone = currentOrder.user.phone || ""
    const customerName = currentOrder.user.name || "Valued Client"
    let waMessage = ""

    if (effectiveNewStatus === "PATTERN_CUTTING" && measurements) {
      waMessage = `📐 *Berber Bespoke Blueprint Finalized*\n\nDear ${customerName},\n\nYour anatomical measurements for bespoke commission *#${currentOrder.orderNumber}* have been recorded by our Master Tailor and your custom pattern is now being drafted in the cutting room.\n\n✂️ *Next Milestone:* Baste / Muslin trial fitting preparation.\n\nThank you for choosing Berber Sartorial House.\n_Banani Flagship Atelier, Dhaka_`
    } else if (effectiveNewStatus === "BASTE_FITTING_SCHEDULED") {
      waMessage = `✨ *Berber Bespoke Atelier Update*\n\nDear ${customerName},\n\nYour bespoke suit *#${currentOrder.orderNumber}* has completed pattern cutting and is now ready for your *Baste / Trial Muslin Fitting* at our Banani Flagship Atelier!\n\n📅 Please book your fitting session: https://www.berber.clothing/bespoke/book-appointment\n\nOur Master Tailor will fine-tune the shoulder slope and chest drape.\n\n_Berber Flagship Atelier, Banani_`
    } else if (effectiveNewStatus === "READY_FOR_PICKUP_OR_DELIVERY") {
      waMessage = `🎉 *Your Bespoke Suit is Ready for Collection*\n\nDear ${customerName},\n\nHandcrafting for commission *#${currentOrder.orderNumber}* is complete! Your suit has passed master quality audit and is prepared in our signature luxury garment bag with cedar hanger.\n\n📍 Collection Location: Berber Flagship Atelier, House 12, Road 11, Banani, Dhaka\n⏰ Opening Hours: 10:00 AM - 9:00 PM Daily\n\nWe look forward to hosting your final fitting!`
    } else if (status) {
      waMessage = `✨ *Berber Bespoke Order #${currentOrder.orderNumber} Update*\n\nDear ${customerName},\n\nYour suit status is now: *${effectiveNewStatus.replace(/_/g, " ")}*.\n\nThank you for choosing Berber Sartorial House.`
    }

    const waLink = customerPhone ? buildWaLink(customerPhone, waMessage) : ""

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      waMessage,
      waLink,
    })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_ORDERS_PATCH]", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
