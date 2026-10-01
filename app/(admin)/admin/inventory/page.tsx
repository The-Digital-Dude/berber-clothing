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

  // Timeframe date boundaries
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const d7 = new Date(now)
  d7.setDate(d7.getDate() - 6)
  d7.setHours(0, 0, 0, 0)

  const d30 = new Date(now)
  d30.setDate(d30.getDate() - 29)
  d30.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    variants,
    totalFiltered,
    totalSKUs,
    outOfStockCount,
    lowStockCount,
    allVariantsValuation,
    ordersWithItems,
  ] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      include: { product: { select: { name: true, slug: true, price: true } } },
      orderBy: [{ product: { name: "asc" } }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.productVariant.count({ where }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { stock: 0 } }),
    prisma.productVariant.count({ where: { stock: { gt: 0, lt: 5 } } }),
    prisma.productVariant.findMany({
      select: {
        stock: true,
        price: true,
        costPrice: true,
        product: { select: { price: true } },
      },
    }),
    prisma.order.findMany({
      // Cancelled and returned orders aren't real sales -- excluding both
      // keeps this consistent with the Reports page P&L, which uses the same
      // COGS/revenue methodology.
      where: { status: { notIn: ["CANCELLED", "RETURNED"] } },
      select: {
        id: true,
        createdAt: true,
        subtotal: true,
        discount: true,
        shippingCharge: true,
        total: true,
        items: {
          select: {
            quantity: true,
            price: true,
            variant: { select: { costPrice: true } },
          },
        },
      },
    }).catch(() => []),
  ])

  // 1. Calculate Warehouse Stock Valuation (Current Inventory)
  let totalStockUnits = 0
  let totalInventoryCost = 0
  let totalRetailValue = 0

  for (const v of allVariantsValuation) {
    const stock = Math.max(0, v.stock)
    const cost = Number(v.costPrice || 0)
    const retail = Number(v.price ?? v.product?.price ?? 0)
    totalStockUnits += stock
    totalInventoryCost += stock * cost
    totalRetailValue += stock * retail
  }

  const projectedGrossProfit = totalRetailValue - totalInventoryCost
  const projectedMargin = totalRetailValue > 0 ? (projectedGrossProfit / totalRetailValue) * 100 : 0

  // 2. Calculate Realized Sales Performance (Historical & Real-Time Orders)
  function computeMetrics(ordersList: typeof ordersWithItems) {
    let grossRevenue = 0
    let netRevenue = 0
    let cogs = 0
    let unitsSold = 0
    const ordersCount = ordersList.length

    for (const o of ordersList) {
      const orderSubtotal = Number(o.subtotal || 0)
      const orderDiscount = Number(o.discount || 0)
      grossRevenue += orderSubtotal
      netRevenue += Math.max(0, orderSubtotal - orderDiscount)

      for (const item of o.items) {
        const qty = Number(item.quantity || 0)
        const cost = Number(item.variant?.costPrice || 0)
        unitsSold += qty
        cogs += qty * cost
      }
    }

    const grossProfit = netRevenue - cogs
    const margin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

    return {
      grossRevenue,
      netRevenue,
      cogs,
      grossProfit,
      margin,
      unitsSold,
      ordersCount,
    }
  }

  const salesPerformance = {
    today: computeMetrics(ordersWithItems.filter((o) => new Date(o.createdAt) >= startOfToday)),
    d7: computeMetrics(ordersWithItems.filter((o) => new Date(o.createdAt) >= d7)),
    d30: computeMetrics(ordersWithItems.filter((o) => new Date(o.createdAt) >= d30)),
    thisMonth: computeMetrics(ordersWithItems.filter((o) => new Date(o.createdAt) >= startOfMonth)),
    allTime: computeMetrics(ordersWithItems),
  }

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <InventoryBulkClient
      key={`inventory-${page}-${limit}-${search}-${status}`}
      variants={JSON.parse(JSON.stringify(variants))}
      stats={{
        totalSKUs,
        totalUnits: totalStockUnits,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      }}
      valuation={{
        totalStockUnits,
        totalInventoryCost,
        totalRetailValue,
        projectedGrossProfit,
        projectedMargin,
      }}
      salesPerformance={salesPerformance}
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
