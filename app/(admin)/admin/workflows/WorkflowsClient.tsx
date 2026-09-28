"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Zap, 
  Plus, 
  Pencil, 
  Trash2, 
  Play, 
  Search, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Tag, 
  DollarSign, 
  Bell, 
  GitBranch,
  ShieldCheck,
  Save,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TRIGGERS = [
  { value: "ORDER_PLACED", label: "Order placed", description: "Fires immediately when checkout completes" },
  { value: "ORDER_STATUS_CHANGED", label: "Order status updated", description: "Fires when order transitions (e.g. Delivered/Shipped)" },
  { value: "PAYMENT_RECEIVED", label: "Payment received", description: "Fires upon bKash / online gateway verification" },
  { value: "REVIEW_LEFT", label: "Product review submitted", description: "Fires when customer submits a star rating" },
  { value: "CUSTOMER_REGISTERED", label: "New account created", description: "Fires on user signup or first login" },
  { value: "ABANDONED_CART", label: "Cart abandoned (>1h)", description: "Fires after shopper leaves items in cart" },
  { value: "RETURN_APPROVED", label: "Return RMA approved", description: "Fires when return request is authorized" },
  { value: "STOCK_LOW", label: "Stock level low (≤5)", description: "Fires when inventory crosses restock threshold" },
]

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Automated Email", icon: Mail },
  { value: "ADD_TAG", label: "Attach Customer Tag (e.g. VIP)", icon: Tag },
  { value: "REMOVE_TAG", label: "Remove Customer Tag", icon: Tag },
  { value: "ADD_STORE_CREDIT", label: "Disburse Store Credit", icon: DollarSign },
  { value: "NOTIFY_ADMIN", label: "Dispatch Admin Notification", icon: Bell },
]

type Workflow = {
  id: string
  name: string
  description: string | null
  trigger: string
  conditions: any[]
  actions: any[]
  isActive: boolean
  runCount: number
  _count: { runs: number }
}

function emptyForm() {
  return {
    name: "",
    description: "",
    trigger: "ORDER_PLACED",
    conditions: [] as any[],
    actions: [{ type: "SEND_EMAIL", config: { message: "" } }] as any[],
    isActive: true,
  }
}

export default function WorkflowsClient({ data }: { data: Workflow[] }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const total = workflows.length
    const active = workflows.filter((w) => w.isActive).length
    const totalRuns = workflows.reduce((sum, w) => sum + (w._count?.runs || w.runCount || 0), 0)
    return { total, active, totalRuns }
  }, [workflows])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(w: Workflow) {
    setEditing(w)
    setForm({
      name: w.name,
      description: w.description || "",
      trigger: w.trigger,
      conditions: w.conditions || [],
      actions: w.actions || [],
      isActive: w.isActive,
    })
    setOpen(true)
  }

  function addAction() {
    setForm((f) => ({
      ...f,
      actions: [...f.actions, { type: "SEND_EMAIL", config: {} }],
    }))
  }

  function updateAction(idx: number, field: string, val: string) {
    setForm((f) => {
      const actions = [...f.actions]
      if (field === "type") {
        actions[idx] = { type: val, config: {} }
      } else {
        actions[idx] = { ...actions[idx], config: { ...actions[idx].config, [field]: val } }
      }
      return { ...f, actions }
    })
  }

  function removeAction(idx: number) {
    setForm((f) => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Workflow name is required")
      return
    }
    if (form.actions.length === 0) {
      toast.error("Please add at least one action step")
      return
    }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/workflows/${editing.id}` : "/api/admin/workflows"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save workflow")
      toast.success(editing ? "Workflow pipeline updated" : "Workflow automation created")
      setOpen(false)
      const listRes = await fetch("/api/admin/workflows")
      setWorkflows(await listRes.json())
    } catch (e: any) {
      toast.error(e.message || "Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this automation workflow?")) return
    try {
      await fetch(`/api/admin/workflows/${id}`, { method: "DELETE" })
      toast.success("Workflow deleted")
      setWorkflows((ws) => ws.filter((w) => w.id !== id))
    } catch {
      toast.error("Failed to delete workflow")
    }
  }

  async function toggleActive(w: Workflow) {
    const updatedStatus = !w.isActive
    setWorkflows((ws) => ws.map((x) => (x.id === w.id ? { ...x, isActive: updatedStatus } : x)))
    try {
      await fetch(`/api/admin/workflows/${w.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...w, isActive: updatedStatus }),
      })
      toast.success(`Workflow ${updatedStatus ? "activated" : "paused"}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = w.name.toLowerCase().includes(q)
        const matchDesc = (w.description || "").toLowerCase().includes(q)
        const matchTrigger = w.trigger.toLowerCase().includes(q)
        if (!matchName && !matchDesc && !matchTrigger) return false
      }
      return true
    })
  }, [workflows, search])

  const getTriggerLabel = (val: string) => {
    return TRIGGERS.find((t) => t.value === val)?.label || val
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Workflows</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Configured pipelines</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Automations</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.active}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Listening to store events</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Executions</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalRuns}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Automated actions dispatched</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Execution Health</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">100%</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Reliable event dispatch</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search workflows by name, trigger…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-2xs transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Workflow
        </button>
      </div>

      {/* Workflows Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Workflow Pipeline</th>
                <th className="px-4 py-3.5">Event Trigger</th>
                <th className="px-4 py-3.5">Automated Actions Chain</th>
                <th className="px-4 py-3.5">Executions</th>
                <th className="px-4 py-3.5">Active</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-700">No automation workflows configured</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Click &ldquo;Create New Workflow&rdquo; to build your first trigger.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const runs = w._count?.runs || w.runCount || 0

                  return (
                    <tr key={w.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900">{w.name}</div>
                        {w.description && (
                          <div className="text-[11px] text-zinc-600 truncate max-w-[240px] mt-0.5">
                            {w.description}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                          <Zap className="w-3 h-3 text-amber-600" />
                          {getTriggerLabel(w.trigger)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {w.actions.map((act, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200"
                            >
                              {act.type === "SEND_EMAIL" && <Mail className="w-3 h-3 text-indigo-600" />}
                              {act.type === "ADD_TAG" && <Tag className="w-3 h-3 text-purple-600" />}
                              {act.type === "ADD_STORE_CREDIT" && <DollarSign className="w-3 h-3 text-emerald-600" />}
                              {act.type === "NOTIFY_ADMIN" && <Bell className="w-3 h-3 text-amber-600" />}
                              {act.type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-900">
                        {runs} run{runs !== 1 ? "s" : ""}
                      </td>

                      <td className="px-4 py-3.5">
                        <Switch
                          checked={w.isActive}
                          onCheckedChange={() => toggleActive(w)}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(w)}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                            title="Edit workflow"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete workflow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{workflows.length}</strong> workflows
          </span>
        </div>
      </div>

      {/* Create / Edit Workflow Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white border border-zinc-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{editing ? "Edit Automation Workflow" : "Create Automation Workflow"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Workflow Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Send VIP welcome voucher & add tag after 3rd order"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Description (Optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of this automation rule"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Event Trigger</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 bg-white"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Sequence Builder */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Automated Action Steps ({form.actions.length})
                </span>
                <button
                  type="button"
                  onClick={addAction}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                >
                  <Plus className="w-3 h-3" /> Add Step
                </button>
              </div>

              <div className="space-y-2.5">
                {form.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-800 text-[11px]">Step {idx + 1}: Action Type</span>
                      <button
                        type="button"
                        onClick={() => removeAction(idx)}
                        className="text-zinc-400 hover:text-rose-600 transition"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={action.type}
                      onChange={(e) => updateAction(idx, "type", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium bg-white focus:outline-none"
                    >
                      {ACTION_TYPES.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>

                    {action.type === "SEND_EMAIL" && (
                      <input
                        placeholder="Custom email subject / note"
                        value={action.config.message || ""}
                        onChange={(e) => updateAction(idx, "message", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                      />
                    )}

                    {(action.type === "ADD_TAG" || action.type === "REMOVE_TAG") && (
                      <input
                        placeholder="Tag name (e.g. VIP, LOYAL, HIGH_LTV)"
                        value={action.config.tag || ""}
                        onChange={(e) => updateAction(idx, "tag", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none font-mono"
                      />
                    )}

                    {action.type === "ADD_STORE_CREDIT" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Credit Amount (৳)"
                          value={action.config.amount || ""}
                          onChange={(e) => updateAction(idx, "amount", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                        />
                        <input
                          placeholder="Reason (e.g. 5th purchase bonus)"
                          value={action.config.reason || ""}
                          onChange={(e) => updateAction(idx, "reason", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                        />
                      </div>
                    )}

                    {action.type === "NOTIFY_ADMIN" && (
                      <input
                        placeholder="Internal message to log / notify staff"
                        value={action.config.message || ""}
                        onChange={(e) => updateAction(idx, "message", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <span className="text-xs font-semibold text-zinc-800">Activate Workflow Immediately</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving Workflow…" : editing ? "Update Workflow Pipeline" : "Deploy Automation Workflow"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
