import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import AbandonedCartsClient from "./AbandonedCartsClient"

export const dynamic = "force-dynamic"

export default async function AbandonedCartsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const carts = await prisma.abandonedCart.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Serialize dates and decimals for client
  const serialized = carts.map((c) => ({
    ...c,
    subtotal: Number(c.subtotal || 0),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    emailSentAt: c.emailSentAt ? c.emailSentAt.toISOString() : null,
    email1SentAt: c.email1SentAt ? c.email1SentAt.toISOString() : null,
    email2SentAt: c.email2SentAt ? c.email2SentAt.toISOString() : null,
    email3SentAt: c.email3SentAt ? c.email3SentAt.toISOString() : null,
    recoveredAt: c.recoveredAt ? c.recoveredAt.toISOString() : null,
  }))

  return <AbandonedCartsClient initialCarts={serialized} />
}
