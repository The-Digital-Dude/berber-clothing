import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import OrderDetailsClient from "@/components/admin/OrderDetailsClient"
import { getCustomerRisk } from "@/lib/customerRisk"
import OrderMessages from "@/components/store/OrderMessages"

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

  const risk = await getCustomerRisk(order.shippingPhone).catch(() => null)

  return (
    <div className="mx-auto max-w-6xl w-full space-y-8">
      <OrderDetailsClient initialOrder={serialize(order)} customerRisk={risk} />
      <div>
        <h2 className="text-lg font-semibold mb-3">Order Messages</h2>
        <OrderMessages orderId={order.id} isAdmin />
      </div>
    </div>
  )
}
