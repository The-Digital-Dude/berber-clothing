import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import DraftOrderClient from "./DraftOrderClient"
import { serialize } from "@/lib/utils"

export default async function DraftOrderPage({ params }: { params: { id: string } }) {
  const draft = await prisma.draftOrder.findUnique({ where: { id: params.id } })
  if (!draft || draft.status === "CANCELLED") notFound()

  return <DraftOrderClient draft={JSON.parse(JSON.stringify({ ...draft, items: JSON.parse(draft.items) }))} />
}
