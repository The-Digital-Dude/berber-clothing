import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { AppointmentStatus } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    if (status && status !== "ALL") {
      where.status = status as AppointmentStatus
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ]
    }

    const appointments = await prisma.bespokeAppointment.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
      include: {
        bespokeOrder: {
          select: {
            id: true,
            orderNumber: true,
            garmentType: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_APPOINTMENTS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, assignedTailorName, notes } = body

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    const data: any = {}
    if (status) data.status = status as AppointmentStatus
    if (assignedTailorName !== undefined) data.assignedTailorName = assignedTailorName
    if (notes !== undefined) data.notes = notes

    const updated = await prisma.bespokeAppointment.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, appointment: updated })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_APPOINTMENTS_PATCH]", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}
