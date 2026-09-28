"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  X,
  RefreshCw,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  rules: string
  isActive: boolean
  sortOrder: number
  _count: { products: number }
}

const FIELD_OPTIONS = ["tags", "price", "category", "brand"]
const OPERATOR_OPTIONS: Record<string, string[]> = {
  tags: ["contains"],
  price: ["lt", "lte", "gt", "gte"],
  category: ["equals"],
  brand: ["equals"],
}

type Rule = { field: string; operator: string; value: string }

function RuleBuilder({ rules, onChange }: { rules: Rule[]; onChange: (r: Rule[]) => void }) {
  function add() {
    onChange([...rules, { field: "tags", operator: "contains", value: "" }])
  }
  function remove(i: number) {
    onChange(rules.filter((_, idx) => idx !== i))
  }
  function update(i: number, partial: Partial<Rule>) {
    const updated = rules.map((r, idx) => (idx === i ? { ...r, ...partial } : r))
    onChange(updated)
  }

  return (
    <div className="space-y-2.5">
      {rules.map((r, i) => (
        <div key={i} className="flex gap-2 items-center text-xs">
          <select
            value={r.field}
            onChange={(e) =>
              update(i, { field: e.target.value, operator: OPERATOR_OPTIONS[e.target.value][0] })
            }
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 font-semibold text-zinc-800"
          >
            {FIELD_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            value={r.operator}
            onChange={(e) => update(i, { operator: e.target.value })}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 font-mono text-zinc-700"
          >
            {(OPERATOR_OPTIONS[r.field] ?? ["equals"]).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Input
            value={r.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Matching keyword or value"
            className="flex-1 h-8 text-xs rounded-lg border-zinc-200"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1 text-zinc-400 hover:text-rose-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={add}
        className="h-8 text-xs gap-1 border-dashed"
      >
        <Plus className="h-3.5 w-3.5" /> Add Condition Rule
      </Button>
    </div>
  )
}

export default function CollectionsClient({ collections: initial }: { collections: Collection[] }) {
  const router = useRouter()
  const [collections, setCollections] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", rules: [] as Rule[] })
  const [saving, setSaving] = useState(false)

  async function create() {
    if (!form.name.trim() || !form.slug.trim()) return toast.error("Name and slug required")
    setSaving(true)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.collection) {
        setCollections((prev) => [...prev, { ...data.collection, _count: { products: 0 } }])
        setCreating(false)
        setForm({ name: "", slug: "", description: "", rules: [] })
        toast.success("Smart collection created")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to create collection")
      }
    } finally {
      setSaving(false)
    }
  }

  async function sync(id: string) {
    setSyncing(id)
    try {
      const res = await fetch(`/api/admin/collections/${id}/sync`, { method: "POST" })
      const data = await res.json()
      if (data.matched !== undefined) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, _count: { products: data.matched } } : c))
        )
        toast.success(`Synced — ${data.matched} products matched`)
        router.refresh()
      } else {
        toast.error("Sync failed")
      }
    } finally {
      setSyncing(null)
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete collection "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id))
        toast.success(`"${name}" deleted`)
        router.refresh()
      } else {
        toast.error("Failed to delete")
      }
    } catch {
      toast.error("Error deleting collection")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger render={<Button className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"><Plus className="h-3.5 w-3.5" /> New Smart Collection</Button>} />
          <DialogContent className="sm:max-w-lg w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                <span>Create Smart Collection</span>
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">Collection Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    }))
                  }
                  placeholder="e.g. Premium Silk Panjabis"
                  className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">URL Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="premium-silk-panjabis"
                  className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional collection description"
                  className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <label className="font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Matching Criteria Rules</span>
                </label>
                <RuleBuilder rules={form.rules} onChange={(rules) => setForm((f) => ({ ...f, rules }))} />
              </div>

              <Button
                onClick={create}
                disabled={saving || !form.name || !form.slug}
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm mt-4"
              >
                {saving ? "Creating…" : "Save & Create Collection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Collection Name</TableHead>
              <TableHead className="text-zinc-700 font-bold">Matched Products</TableHead>
              <TableHead className="text-zinc-700 font-bold">Matching Rules</TableHead>
              <TableHead className="text-zinc-700 font-bold">Status</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {collections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-400 text-xs">
                  No smart collections configured yet. Click above to create one.
                </TableCell>
              </TableRow>
            ) : (
              collections.map((c) => {
                let parsedRules: Rule[] = []
                try {
                  parsedRules = JSON.parse(c.rules || "[]")
                } catch {}

                return (
                  <TableRow key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell className="pl-5 py-3.5">
                      <div>
                        <p className="font-bold text-zinc-900">{c.name}</p>
                        <p className="text-zinc-400 font-mono text-[11px] mt-0.5">/{c.slug}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold text-[11px]">
                        {c._count?.products ?? 0} products
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {parsedRules.length === 0 ? (
                          <span className="text-zinc-400 text-[11px]">No conditions</span>
                        ) : (
                          parsedRules.map((r, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[10px]"
                            >
                              {r.field} {r.operator} "{r.value}"
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        )}
                      >
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => sync(c.id)}
                          disabled={syncing === c.id}
                          className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Sync matching products"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", syncing === c.id && "animate-spin")} />
                          <span>Sync</span>
                        </button>

                        <Link href={`/shop?collection=${c.slug}`} target="_blank" title="View in Storefront">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-900 rounded-lg"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(c.id, c.name)}
                          className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
