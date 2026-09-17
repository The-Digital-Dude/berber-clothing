import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import InventoryBulkClient from "./InventoryBulkClient"
import { serialize } from "@/lib/utils"

export default async function InventoryPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { product: { name: "asc" } },
  })

  return <InventoryBulkClient variants={serialize(variants)} />
}
