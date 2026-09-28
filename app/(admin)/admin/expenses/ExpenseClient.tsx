"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Packaging", "Delivery", "Other"]

type Expense = {
  id: string
  category: string
  amount: number
  date: string
  note: string | null
}

export function ExpenseClient({ data }: { data: Expense[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [category, setCategory] = useState("Rent")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = data.reduce((s, e) => s + Number(e.amount), 0)
    const categoryTotals: Record<string, number> = {}
    data.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount)
    })
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
    return {
      total,
      count: data.length,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      avg: data.length > 0 ? Math.round(total / data.length) : 0,
    }
  }, [data])

  function openCreate() {
    setEditing(null)
    setCategory("Rent")
    setAmount("")
    setDate(new Date().toISOString().slice(0, 10))
    setNote("")
    setIsDialogOpen(true)
  }

  function openEdit(e: Expense) {
    setEditing(e)
    setCategory(e.category)
    setAmount(String(e.amount))
    setDate(e.date.slice(0, 10))
    setNote(e.note || "")
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/admin/expenses/${editing.id}` : "/api/admin/expenses"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: parseFloat(amount), date, note }),
      })
      if (res.ok) {
        toast.success(editing ? "Expense record updated" : "Expense record logged")
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save expense")
      }
    } catch {
      toast.error("Error saving expense")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense record?")) return
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Expense record deleted")
        router.refresh()
      } else {
        toast.error("Failed to delete expense")
      }
    } catch {
      toast.error("Error deleting expense")
    }
  }

  const filtered = useMemo(() => {
    return data.filter((e) => {
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) return false
      if (search) {
        const q = search.toLowerCase()
        const matchCategory = e.category.toLowerCase().includes(q)
        const matchNote = (e.note || "").toLowerCase().includes(q)
        if (!matchCategory && !matchNote) return false
      }
      return true
    })
  }, [data, selectedCategory, search])

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Outflows</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-1">৳{stats.total.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Recorded expenses</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Top Spend Category</p>
            <h3 className="text-xl font-bold text-zinc-900 mt-1 truncate max-w-[150px]">
              {stats.topCategory ? stats.topCategory.name : "—"}
            </h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">
              {stats.topCategory ? `৳${stats.topCategory.amount.toLocaleString()}` : "No entries"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Average / Entry</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">৳{stats.avg.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Per expense item</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Logged Entries</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.count}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Audit transactions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search category or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Amount (৳)</th>
                <th className="px-4 py-3.5">Description / Note</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No expense records found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click &ldquo;Add Expense&rdquo; above to record a disbursement.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-900">
                      {new Date(e.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {e.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-rose-700 text-xs">
                        -৳{Number(e.amount).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600">
                      {e.note || <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                          title="Edit expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete expense"
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

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{data.length}</strong> recorded expenses
          </span>
          <span className="font-bold text-zinc-900">
            Total Filtered: ৳{filtered.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}
          </span>
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
