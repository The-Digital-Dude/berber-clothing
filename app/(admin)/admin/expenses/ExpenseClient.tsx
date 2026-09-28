"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingDown, 
  PieChart, 
  Tag,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import AdminPagination from "@/components/admin/AdminPagination"

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Packaging", "Delivery", "Other"]

type Expense = {
  id: string
  category: string
  amount: number
  date: string
  note: string | null
}

interface ExpenseClientProps {
  data: Expense[]
  stats: {
    total: number
    count: number
    topCategory: { name: string; amount: number } | null
    avg: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentCategory: string
}

export function ExpenseClient({
  data,
  stats,
  pagination,
  currentSearch,
  currentCategory,
}: ExpenseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [category, setCategory] = useState("Rent")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState(currentSearch)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/expenses?${params.toString()}`, { scroll: false })
  }

  const handleCategoryFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat && cat !== "ALL") {
      params.set("category", cat)
    } else {
      params.delete("category")
    }
    params.set("page", "1")
    router.push(`/admin/expenses?${params.toString()}`, { scroll: false })
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setCategory("Rent")
    setAmount("")
    setDate(new Date().toISOString().slice(0, 10))
    setNote("")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (exp: Expense) => {
    setEditing(exp)
    setCategory(exp.category)
    setAmount(String(exp.amount))
    setDate(new Date(exp.date).toISOString().slice(0, 10))
    setNote(exp.note || "")
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount")
      return
    }

    setSaving(true)
    try {
      const payload = {
        category,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        note: note.trim() || null,
      }

      if (editing) {
        const res = await fetch(`/api/admin/expenses/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update expense")
        toast.success("Expense updated successfully")
      } else {
        const res = await fetch("/api/admin/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to record expense")
        toast.success("Expense logged successfully")
      }

      setIsDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("An error occurred while saving.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return

    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Expense removed")
      router.refresh()
    } catch {
      toast.error("Failed to delete expense record")
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Lifetime Outflow</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{stats.total.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Across {stats.count} records</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Top Expense Category</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.topCategory?.name || "None"}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">
              {stats.topCategory ? `৳${stats.topCategory.amount.toLocaleString()}` : "No data"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Avg. Expense Cost</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{stats.avg.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Per recorded receipt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Expense Logs</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.count}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Lifetime disbursements</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search expense note or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => handleCategoryFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
              currentCategory === "ALL" || !currentCategory
                ? "bg-zinc-900 text-white shadow-2xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                currentCategory === cat
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition shrink-0 ml-1"
          >
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-4 py-3.5">Reference / Memo</th>
                <th className="px-4 py-3.5">Disbursement Date</th>
                <th className="px-4 py-3.5">Amount (৳)</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No expense records found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click "Log Expense" to record an outflow.</p>
                  </td>
                </tr>
              ) : (
                data.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        <Tag className="w-3 h-3 text-zinc-500" />
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-zinc-900 max-w-xs truncate">
                      {e.note || <span className="text-zinc-400 italic">No memo</span>}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          {new Date(e.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-rose-700 text-xs">
                      -৳{Number(e.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* AdminPagination at table bottom */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            basePath="/admin/expenses"
          />
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Receipt className="w-4 h-4 text-zinc-900" />
              <span>{editing ? "Edit Expense Record" : "Record New Expense"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Disbursed Amount (৳)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Expense Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Reference Note (Optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Facebook Ads campaign or Office rent for Sept"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving Record…" : editing ? "Update Expense" : "Log Expense"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
