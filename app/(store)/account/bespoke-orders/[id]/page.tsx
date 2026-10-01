import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import CustomerBespokeTimelineClient from "./CustomerBespokeTimelineClient"

export const dynamic = "force-dynamic"

export default async function CustomerBespokeOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const order = await prisma.bespokeOrder.findUnique({
    where: { id },
    include: {
      user: true,
      measurementProfile: true,
      timelineLogs: {
        orderBy: { createdAt: "desc" },
      },
      appointments: true,
    },
  })

  if (!order) {
    notFound()
  }

  // Ensure security: only order owner or admin can view
  if (session?.user?.id && order.userId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/account")
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
    timelineLogs: order.timelineLogs.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">
      <CustomerBespokeTimelineClient order={serialized} />
    </div>
  )
}
