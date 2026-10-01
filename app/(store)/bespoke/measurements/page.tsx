import { Metadata } from "next"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import MeasurementsClient from "./MeasurementsClient"

export const metadata: Metadata = {
  title: "Bespoke Measurement Profiles | Berber Sartorial House",
  description:
    "Save and manage your 14-point body measurement profiles for custom bespoke tailoring and made-to-measure suits.",
}

export const dynamic = "force-dynamic"

export default async function BespokeMeasurementsPage() {
  const session = await auth()
  let profiles: any[] = []

  if (session?.user?.id) {
    try {
      profiles = await prisma.measurementProfile.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    } catch {}
  }

  const serialized = profiles.map((p) => ({
    ...p,
    createdAt: p.createdAt?.toISOString?.() || p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
  }))

  return (
    <div className="w-full min-h-screen bg-berber-bg text-berber-text">
      <MeasurementsClient initialProfiles={serialized} />
    </div>
  )
}
