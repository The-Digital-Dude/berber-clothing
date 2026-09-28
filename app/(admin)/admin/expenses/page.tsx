import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { ExpenseClient } from "./ExpenseClient"
import { Receipt } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string; limit?: string }>
}) {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const params = await searchParams
  const search = (params.search || "").trim()
  const category = (params.category || "ALL").trim()
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const limit = Math.max(10, Math.min(100, parseInt(params.limit || "25", 10)))
  const skip = (page - 1) * limit

  const where: any = {
    ...(category !== "ALL" ? { category } : {}),
    ...(search
      ? {
          OR: [
            { note: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [expenses, totalFiltered, totalSum, allCount, categoryGroups] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.count(),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
    }),
  ])

  const total = Number(totalSum._sum.amount || 0)
  const sortedCategories = categoryGroups.sort(
    (a, b) => Number(b._sum.amount || 0) - Number(a._sum.amount || 0)
  )
  const topCategory = sortedCategories[0]
    ? { name: sortedCategories[0].category, amount: Number(sortedCategories[0]._sum.amount || 0) }
    : null

  const totalPages = Math.ceil(totalFiltered / limit) || 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              <Receipt className="w-3.5 h-3.5" />
              Financial Outflows
            </span>
            <span className="text-xs text-zinc-600 font-medium">Operating expenses & overhead tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Expense & Cash Outflow Log</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Record, categorize, and monitor store operational costs, marketing investments, rent, and utility disbursements.
          </p>
        </div>
      </div>

      <ExpenseClient
        data={JSON.parse(JSON.stringify(expenses))}
        stats={{
          total,
          count: allCount,
          topCategory,
          avg: allCount > 0 ? Math.round(total / allCount) : 0,
        }}
        pagination={{
          page,
          limit,
          total: totalFiltered,
          totalPages,
        }}
        currentSearch={search}
        currentCategory={category}
      />
    </div>
  )
}
