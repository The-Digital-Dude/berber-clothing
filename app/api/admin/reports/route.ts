import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { subDays } from "date-fns"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "30" // 7, 30, today, all
    
    let fromDate = new Date(0)
    const now = new Date()

    if (range === "today") {
      fromDate = new Date(now.setHours(0, 0, 0, 0))
    } else if (range === "7") {
      fromDate = subDays(now, 7)
    } else if (range === "30") {
      fromDate = subDays(now, 30)
    }

    const where = {
      createdAt: { gte: fromDate }
    }

    // Orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { variant: { select: { costPrice: true } } } },
      },
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // New Customers
    const newCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: fromDate },
      },
    })

    // Payment Method Pie Chart
    let bkash = 0, nagad = 0, cod = 0
    orders.forEach((o) => {
      if (o.paymentMethod === "BKASH") bkash++
      if (o.paymentMethod === "NAGAD") nagad++
      if (o.paymentMethod === "COD") cod++
    })
    const paymentData = [
      { name: "bKash", value: bkash },
      { name: "Nagad", value: nagad },
      { name: "COD", value: cod },
    ]

    // Order Status Bar Chart
    const statusCounts: Record<string, number> = {}
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    })
    const statusData = Object.entries(statusCounts).map(([name, count]) => ({
      name,
      count,
    }))

    // Revenue Line Chart (Daily)
    const dailyRevenueMap: Record<string, number> = {}
    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split("T")[0]
      dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + Number(o.total)
    })
    const revenueData = Object.entries(dailyRevenueMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }))

    // Top 10 Products
    const productStats: Record<string, { name: string; units: number; revenue: number }> = {}
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName, units: 0, revenue: 0 }
        }
        productStats[item.productId].units += item.quantity
        productStats[item.productId].revenue += Number(item.price) * item.quantity
      })
    })

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Export Data (Raw orders data for CSV)
    const exportData = orders.map(o => ({
      OrderNumber: o.orderNumber,
      Date: o.createdAt,
      Status: o.status,
      PaymentMethod: o.paymentMethod,
      PaymentStatus: o.paymentStatus,
      Total: Number(o.total),
    }))

    // ─── P&L ──────────────────────────────────────────────────────
    // COGS matched to actual units sold (quantity * variant.costPrice),
    // same methodology already used correctly on the Inventory page
    // (app/(admin)/admin/inventory/page.tsx) -- this used to be the cost of
    // Purchase Orders *received* in range, which has nothing to do with what
    // was actually sold in that window (restocking heavily with zero sales
    // showed huge "COGS"; selling from existing stock showed ৳0).
    // Cancelled and returned orders are excluded -- neither is a real sale.
    const pnlOrders = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED")
    let netRevenue = 0
    let totalCOGS = 0
    for (const o of pnlOrders) {
      const subtotal = Number(o.subtotal || 0)
      const discount = Number(o.discount || 0)
      netRevenue += Math.max(0, subtotal - discount)
      for (const item of o.items) {
        totalCOGS += Number(item.quantity) * Number(item.variant?.costPrice || 0)
      }
    }
    const grossProfit = netRevenue - totalCOGS
    const margin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: fromDate } },
      select: { amount: true, category: true },
    })
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = grossProfit - totalExpenses

    const expensesByCategory: Record<string, number> = {}
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount)
    })

    return NextResponse.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        newCustomers,
      },
      pnl: {
        revenue: netRevenue,
        cogs: totalCOGS,
        grossProfit,
        margin,
        expenses: totalExpenses,
        netProfit,
        expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })),
      },
      paymentData,
      statusData,
      revenueData,
      topProducts,
      exportData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
