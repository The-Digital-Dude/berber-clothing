"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Tag, Pencil, Trash2, Ruler, X } from "lucide-react"
import Image from "next/image"
import ImagePicker from "@/components/admin/ImagePicker"

type Category = {
  id: string
  name: string
  slug: string
  description: string
  image: string
  isActive: boolean
  showOnNavbar: boolean
  showOnHomepage: boolean
  sortOrder: number
  productCount: number
}

const emptyForm = () => ({
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
  showOnNavbar: true,
  showOnHomepage: true,
  sortOrder: 0,
})

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

const DEFAULT_COLUMNS = ["Size", "Chest", "Shoulder", "Waist", "Length", "Sleeve"]

function emptySizeGuide() {
  return {
    unit: "cm",
    columns: DEFAULT_COLUMNS,
    rows: [["S", "", "", "", "", ""], ["M", "", "", "", "", ""], ["L", "", "", "", "", ""], ["XL", "", "", "", "", ""]],
    notes: "",
  }
}

function SizeGuideEditor({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const [guide, setGuide] = useState(emptySizeGuide())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load existing guide
  useEffect(() => {
    fetch(`/api/admin/size-guide?categoryId=${categoryId}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.columns) {
          setGuide({
            unit: d.unit || "cm",
            columns: JSON.parse(d.columns),
            rows: JSON.parse(d.rows),
            notes: d.notes || "",
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [categoryId])

  const updateCell = (ri: number, ci: number, val: string) => {
    setGuide(g => {
      const rows = g.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r)
      return { ...g, rows }
    })
  }

  const addRow = () => setGuide(g => ({ ...g, rows: [...g.rows, g.columns.map(() => "")] }))
  const removeRow = (i: number) => setGuide(g => ({ ...g, rows: g.rows.filter((_, ri) => ri !== i) }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/size-guide", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          unit: guide.unit,
          columns: JSON.stringify(guide.columns),
          rows: JSON.stringify(guide.rows),
          notes: guide.notes || null,
        }),
      })
      if (res.ok) { toast.success("Size guide saved"); onClose() }
      else toast.error("Failed to save size guide")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Unit</label>
        <select value={guide.unit} onChange={e => setGuide(g => ({ ...g, unit: e.target.value }))}
          className="border border-input rounded px-2 py-1 text-sm">
          <option value="cm">cm</option>
          <option value="inches">inches</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {guide.columns.map((col, ci) => (
                <th key={ci} className="border border-border px-2 py-1.5 text-left text-xs font-bold bg-muted">
                  {col}{ci > 0 ? ` (${guide.unit})` : ""}
                </th>
              ))}
              <th className="border border-border px-2 py-1.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border p-0">
                    <input
                      value={cell}
                      onChange={e => updateCell(ri, ci, e.target.value)}
                      placeholder={ci === 0 ? "e.g. S" : "e.g. 86-90"}
                      className="w-full px-2 py-1.5 text-sm focus:outline-none focus:bg-blue-50 min-w-[70px]"
                    />
                  </td>
                ))}
                <td className="border border-border px-1 text-center">
                  <button onClick={() => removeRow(ri)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Row
      </Button>

      <div>
        <label className="text-sm font-medium">Notes (optional)</label>
        <Input value={guide.notes} onChange={e => setGuide(g => ({ ...g, notes: e.target.value }))}
          placeholder="e.g. All measurements are in cm. Size up if between sizes." className="mt-1" />
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Size Guide"}
      </Button>
    </div>
  )
}

export function CategoryClient({ data }: { data: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [sizeGuideId, setSizeGuideId] = useState<string | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm())
    setError("")
    setOpen(true)
  }

  function openEdit(c: Category) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      isActive: c.isActive,
      showOnNavbar: c.showOnNavbar,
      showOnHomepage: c.showOnHomepage,
      sortOrder: c.sortOrder,
    })
    setError("")
    setOpen(true)
  }

  function onNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and Slug are required.")
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editingId ? "Category updated" : "Category created")
        setOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Category deleted")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to delete")
      }
    } finally {
      setDeleting(null)
    }
  }

  async function toggleField(id: string, field: "isActive" | "showOnNavbar" | "showOnHomepage", value: boolean) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) router.refresh()
    else toast.error("Failed to update")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Size Guide Dialog */}
      <Dialog open={!!sizeGuideId} onOpenChange={(v) => !v && setSizeGuideId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-4 w-4" /> Size Guide Editor
            </DialogTitle>
          </DialogHeader>
          {sizeGuideId && <SizeGuideEditor categoryId={sizeGuideId} onClose={() => setSizeGuideId(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => onNameChange(e.target.value)} placeholder="2-Piece Suits" required className={error && !form.name.trim() ? "border-red-500 focus-visible:ring-red-500" : ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="2-piece-suits" required className={error && !form.slug.trim() ? "border-red-500 focus-visible:ring-red-500" : ""} />
              {error && (!form.name.trim() || !form.slug.trim()) && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <p className="text-xs text-muted-foreground mt-1">URL: /shop?category={form.slug || "slug"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional short description" />
            </div>
            <div>
              <label className="text-sm font-medium">Image</label>
              <div className="mt-1">
                <ImagePicker value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} bucket="category-images" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="flex flex-col items-start gap-2">
                <label className="text-xs font-medium">Active</label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="text-xs font-medium">Show on Navbar</label>
                <Switch checked={form.showOnNavbar} onCheckedChange={(v) => setForm((f) => ({ ...f, showOnNavbar: v }))} />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="text-xs font-medium">Show on Homepage</label>
                <Switch checked={form.showOnHomepage} onCheckedChange={(v) => setForm((f) => ({ ...f, showOnHomepage: v }))} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Navbar</TableHead>
              <TableHead>Homepage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No categories yet — click "Add Category" to create one.
                </TableCell>
              </TableRow>
            )}
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.slug}</div>
                </TableCell>
                <TableCell>
                  {c.image ? (
                    <div className="relative w-10 h-10 rounded overflow-hidden border">
                      <Image src={c.image} alt={c.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded border flex items-center justify-center text-muted-foreground text-xs bg-muted">
                      {c.name.charAt(0)}
                    </div>
                  )}
                </TableCell>
                <TableCell>{c.productCount}</TableCell>
                <TableCell>
                  <Switch checked={c.isActive} onCheckedChange={(v) => toggleField(c.id, "isActive", v)} />
                </TableCell>
                <TableCell>
                  <Switch checked={c.showOnNavbar} onCheckedChange={(v) => toggleField(c.id, "showOnNavbar", v)} />
                </TableCell>
                <TableCell>
                  <Switch checked={c.showOnHomepage} onCheckedChange={(v) => toggleField(c.id, "showOnHomepage", v)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSizeGuideId(c.id)} title="Edit Size Guide">
                      <Ruler className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="destructive" size="sm" disabled={deleting === c.id} onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


