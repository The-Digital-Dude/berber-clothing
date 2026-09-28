import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { ExpenseClient } from "./ExpenseClient"
import { DollarSign, Receipt, TrendingDown, PieChart } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ExpensesPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: 200,
  })

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

      <ExpenseClient data={JSON.parse(JSON.stringify(expenses))} />
    </div>
  )
}
