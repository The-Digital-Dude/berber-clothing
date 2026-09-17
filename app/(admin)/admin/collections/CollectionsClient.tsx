"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

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
    const updated = rules.map((r, idx) => idx === i ? { ...r, ...partial } : r)
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select value={r.field} onChange={(e) => update(i, { field: e.target.value, operator: OPERATOR_OPTIONS[e.target.value][0] })} className="border rounded px-2 py-1 text-sm bg-background">
            {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={r.operator} onChange={(e) => update(i, { operator: e.target.value })} className="border rounded px-2 py-1 text-sm bg-background">
            {(OPERATOR_OPTIONS[r.field] ?? ["equals"]).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <Input value={r.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="value" className="flex-1 h-8 text-sm" />
          <Button size="sm" variant="ghost" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add Rule</Button>
    </div>
  )
}

export default function CollectionsClient({ collections: initial }: { collections: Collection[] }) {
  const [collections, setCollections] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", rules: [] as Rule[] })
  const [saving, setSaving] = useState(false)

  async function create() {
    if (!form.name || !form.slug) return toast.error("Name and slug required")
    setSaving(true)
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
      toast.success("Collection created")
    }
    setSaving(false)
  }

  async function sync(id: string) {
    setSyncing(id)
    const res = await fetch(`/api/admin/collections/${id}/sync`, { method: "POST" })
    const data = await res.json()
    if (data.matched !== undefined) {
      setCollections((prev) => prev.map((c) => c.id === id ? { ...c, _count: { products: data.matched } } : c))
      toast.success(`Synced — ${data.matched} products matched`)
    } else {
      toast.error("Sync failed")
    }
    setSyncing(null)
  }

  async function deleteCollection(id: string) {
    if (!confirm("Delete this collection?")) return
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" })
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" /> New Collection
        </Button>
      </div>

      {creating && (
        <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">New Smart Collection</h3>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Sale" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="summer-sale" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Rules (products must match ALL)</Label>
            <RuleBuilder rules={form.rules} onChange={(r) => setForm({ ...form, rules: r })} />
          </div>
          <Button onClick={create} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
        </div>
      )}

      {collections.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No collections yet</p>
      )}

      <div className="space-y-3">
        {collections.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">/{c.slug} · {c._count.products} products</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={syncing === c.id} onClick={() => sync(c.id)}>
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing === c.id ? "animate-spin" : ""}`} />
                {syncing === c.id ? "Syncing..." : "Sync"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteCollection(c.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
