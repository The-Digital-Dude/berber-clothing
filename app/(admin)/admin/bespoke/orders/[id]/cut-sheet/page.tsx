import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import MasterCutSheetClient from "./MasterCutSheetClient"

export const dynamic = "force-dynamic"

export default async function AdminCutSheetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await prisma.bespokeOrder.findUnique({
    where: { id },
    include: {
      user: true,
      measurementProfile: true,
    },
  })

  if (!order) {
    notFound()
  }

  const serialized = {
    ...order,
    basePrice: Number(order.basePrice),
    customizationsPrice: Number(order.customizationsPrice),
    totalPrice: Number(order.totalPrice),
    depositAmount: order.depositAmount ? Number(order.depositAmount) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    targetDeliveryDate: order.targetDeliveryDate?.toISOString?.() || null,
    trialFittingDate: order.trialFittingDate?.toISOString?.() || null,
  }

  return <MasterCutSheetClient order={serialized} />
}
