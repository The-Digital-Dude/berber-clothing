import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { AppointmentPurpose, AppointmentStatus } from "@prisma/client"
import { buildAppointmentWhatsAppMessage, buildWaLink, sendWhatsAppMessage } from "@/lib/whatsapp"

const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  INITIAL_CONSULTATION_AND_MEASUREMENT: "Initial Bespoke Fitting & Measurement",
  BASTE_TRIAL_FITTING: "Baste / Muslin Trial Suit Fitting",
  FINAL_FITTING_AND_PICKUP: "Final Fitting & Suit Pickup",
  GENERAL_STYLING: "Fabric Swatch & VIP Styling Consultation",
}

const ALL_TIME_SLOTS = [
  "11:00 AM - 11:45 AM",
  "12:00 PM - 12:45 PM",
  "02:00 PM - 02:45 PM",
  "03:00 PM - 03:45 PM",
  "04:00 PM - 04:45 PM",
  "05:00 PM - 05:45 PM",
  "06:00 PM - 06:45 PM",
  "07:00 PM - 07:45 PM",
  "08:00 PM - 08:45 PM",
]

// GET: Fetch booked slots for a given date (YYYY-MM-DD)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")

    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter is required (YYYY-MM-DD)" }, { status: 400 })
    }

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

    const bookedAppointments = await prisma.bespokeAppointment.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      select: {
        timeSlot: true,
      },
    })

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot)

    // Capacity: allow up to 2 concurrent VIP consultations per slot in flagship atelier
    const slotCounts: Record<string, number> = {}
    for (const slot of bookedSlots) {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1
    }

    const availableSlots = ALL_TIME_SLOTS.map((slot) => ({
      slot,
      available: (slotCounts[slot] || 0) < 2,
      remainingCapacity: Math.max(0, 2 - (slotCounts[slot] || 0)),
    }))

    return NextResponse.json({
      date: dateStr,
      slots: availableSlots,
    })
  } catch (error) {
    console.error("[BESPOKE_APPOINTMENTS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}

// POST: Create a new bespoke appointment
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      scheduledDate,
      timeSlot,
      purpose = "INITIAL_CONSULTATION_AND_MEASUREMENT",
      notes,
      userId,
    } = body

    if (!customerName || !customerPhone || !scheduledDate || !timeSlot) {
      return NextResponse.json(
        { error: "Name, phone number, date, and time slot are required." },
        { status: 400 }
      )
    }

    const dateObj = new Date(scheduledDate)
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0)
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59)

    // Check slot capacity
    const existingSlotCount = await prisma.bespokeAppointment.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        timeSlot,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
    })

    if (existingSlotCount >= 2) {
      return NextResponse.json(
        { error: "Selected time slot is fully booked. Please select another slot." },
        { status: 409 }
      )
    }

    const validPurpose = (
      Object.keys(PURPOSE_LABELS).includes(purpose)
        ? purpose
        : "INITIAL_CONSULTATION_AND_MEASUREMENT"
    ) as AppointmentPurpose

    const appointment = await prisma.bespokeAppointment.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim() : null,
        scheduledDate: dateObj,
        timeSlot,
        purpose: validPurpose,
        notes: notes ? notes.trim() : null,
        userId: userId || null,
        status: AppointmentStatus.CONFIRMED,
      },
    })

    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const purposeLabel = PURPOSE_LABELS[validPurpose]

    const whatsappMessage = buildAppointmentWhatsAppMessage({
      customerName: appointment.customerName,
      purposeLabel,
      dateString: formattedDate,
      timeSlot: appointment.timeSlot,
      outletAddress: "Berber Flagship Atelier, House 12, Road 11, Block D, Banani, Dhaka",
      outletPhone: "+880 1700-000000",
    })

    const waLink = buildWaLink(appointment.customerPhone, whatsappMessage)

    // Attempt direct Meta WhatsApp Cloud API send if configured
    try {
      await sendWhatsAppMessage(appointment.customerPhone, whatsappMessage)
    } catch {
      // Ignored if cloud API not setup, waLink is provided as fallback
    }

    return NextResponse.json({
      success: true,
      appointment,
      formattedDate,
      purposeLabel,
      waLink,
      whatsappMessage,
    })
  } catch (error) {
    console.error("[BESPOKE_APPOINTMENT_POST]", error)
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 })
  }
}
