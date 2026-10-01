import prisma from "@/lib/prisma"
import BespokeAppointmentsAdminClient from "./BespokeAppointmentsAdminClient"

export const dynamic = "force-dynamic"

export default async function AdminBespokeAppointmentsPage() {
  const appointments = await prisma.bespokeAppointment.findMany({
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

  // Serialize dates for Client component
  const serialized = appointments.map((a) => ({
    ...a,
    scheduledDate: a.scheduledDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BespokeAppointmentsAdminClient initialAppointments={serialized as any} />
    </div>
  )
}
