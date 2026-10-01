import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import OrderDetailsClient from "@/components/admin/OrderDetailsClient"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: {
        include: {
          product: { include: { images: true } }
        }
      },
      payment: true,
      delivery: true,
      statusLogs: { orderBy: { createdAt: "desc" } }
    }
  }).catch(() => null)

  if (!order) {
    notFound()
  }

  // No automatic Steadfast check on page load -- it's a real network-fraud
  // API call, so it only ever runs when the admin clicks "Fraud Check" /
  // "Re-check Fraud Score" in OrderDetailsClient.
  return (
    <div className="mx-auto max-w-7xl w-full">
      <OrderDetailsClient initialOrder={serialize(order)} />
    </div>
  )
}
