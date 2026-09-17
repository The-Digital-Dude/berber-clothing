import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import DraftOrdersClient from "./DraftOrdersClient"
import { serialize } from "@/lib/utils"

export default async function DraftOrdersPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const drafts = await prisma.draftOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return <DraftOrdersClient drafts={serialize(drafts)} />
}
