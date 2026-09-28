import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import InventoryBulkClient from "./InventoryBulkClient"

export const dynamic = "force-dynamic"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string; limit?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const status = (params.status || "all").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(search
      ? {
          OR: [
            { product: { name: { contains: search, mode: "insensitive" } } },
            { sku: { contains: search, mode: "insensitive" } },
            { color: { contains: search, mode: "insensitive" } },
            { size: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "out"
      ? { stock: 0 }
      : status === "low"
      ? { stock: { gt: 0, lt: 5 } }
      : status === "in"
      ? { stock: { gte: 5 } }
      : {}),
  }

  const [variants, totalFiltered, totalSKUs, outOfStockCount, lowStockCount, unitSum] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      include: { product: { select: { name: true, slug: true } } },
      orderBy: [{ product: { name: "asc" } }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.productVariant.count({ where }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { stock: 0 } }),
    prisma.productVariant.count({ where: { stock: { gt: 0, lt: 5 } } }),
    prisma.productVariant.aggregate({ _sum: { stock: true } }),
  ])

  const totalPages = Math.ceil(totalFiltered / limit) || 1
  const totalUnits = Number(unitSum._sum.stock || 0)

  return (
    <InventoryBulkClient
      key={`inventory-${page}-${limit}-${search}-${status}`}
      variants={JSON.parse(JSON.stringify(variants))}
      stats={{
        totalSKUs,
        totalUnits,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      }}
      pagination={{
        page,
        limit,
        total: totalFiltered,
        totalPages,
      }}
      currentSearch={search}
      currentStatus={status}
    />
  )
}
