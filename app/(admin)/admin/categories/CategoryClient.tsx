"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Tag,
  Pencil,
  Trash2,
  Ruler,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  FolderTree,
} from "lucide-react"
import Link from "next/link"
import ImagePicker from "@/components/admin/ImagePicker"
import { cn } from "@/lib/utils"

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
    rows: [
      ["S", "", "", "", "", ""],
      ["M", "", "", "", "", ""],
      ["L", "", "", "", "", ""],
      ["XL", "", "", "", "", ""],
    ],
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
      .then((r) => r.json())
      .then((d) => {
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
    setGuide((g) => {
      const rows = g.rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r))
      return { ...g, rows }
    })
  }

  const addRow = () =>
    setGuide((g) => ({ ...g, rows: [...g.rows, g.columns.map(() => "")] }))
  const removeRow = (i: number) =>
    setGuide((g) => ({ ...g, rows: g.rows.filter((_, ri) => ri !== i) }))

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
      if (res.ok) {
        toast.success("Size guide saved")
        onClose()
      } else {
        toast.error("Failed to save size guide")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="font-bold uppercase text-zinc-500 text-[10px]">Measurement Unit:</label>
          <select
            value={guide.unit}
            onChange={(e) => setGuide((g) => ({ ...g, unit: e.target.value }))}
            className="h-7 px-2 text-xs font-bold rounded-lg border border-zinc-200 bg-white"
          >
            <option value="cm">Centimeters (cm)</option>
            <option value="inches">Inches (in)</option>
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add Size Row
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {guide.columns.map((col) => (
                <th key={col} className="p-2.5">
                  {col}
                </th>
              ))}
              <th className="p-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {guide.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-zinc-50/50">
                {row.map((val, ci) => (
                  <td key={ci} className="p-1.5">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      placeholder={ci === 0 ? "Size" : "-"}
                      className="w-full h-7 px-2 font-mono text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </td>
                ))}
                <td className="p-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1">
        <label className="font-bold uppercase text-zinc-500 text-[10px]">Fit Notes / Instructions</label>
        <Input
          value={guide.notes}
          onChange={(e) => setGuide((g) => ({ ...g, notes: e.target.value }))}
          placeholder="e.g. Regular fit. If between sizes, choose the larger size for a relaxed look."
          className="h-8 text-xs rounded-xl border-zinc-300"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={saving} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
          {saving ? "Saving…" : "Save Size Guide"}
        </Button>
      </div>
    </div>
  )
}

export function CategoryClient({ data }: { data: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sizeGuideId, setSizeGuideId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")

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
      description: c.description,
      image: c.image,
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`Category "${name}" deleted`)
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
    if (res.ok) {
      toast.success("Updated visibility")
      router.refresh()
    } else {
      toast.error("Failed to update")
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Category
        </Button>
      </div>

      {/* Size Guide Dialog */}
      <Dialog open={!!sizeGuideId} onOpenChange={(v) => !v && setSizeGuideId(null)}>
        <DialogContent className="sm:max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-indigo-600" /> Size Guide Chart & Fit Specs
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {sizeGuideId && <SizeGuideEditor categoryId={sizeGuideId} onClose={() => setSizeGuideId(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-amber-600" />
              <span>{editingId ? "Edit Category Details" : "Create New Category"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">Category Name *</label>
              <Input
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Panjabi & Kurtas"
                required
                className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">URL Slug *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="panjabi-kurtas"
                required
                className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
              />
              <p className="text-[11px] text-zinc-400 font-mono">URL: /shop?category={form.slug || "slug"}</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">Short Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional catalog description"
                className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">Cover Thumbnail</label>
              <div className="mt-1">
                <ImagePicker
                  value={form.image}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                  bucket="category-images"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">Sort Display Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Active</label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Navbar</label>
                <Switch
                  checked={form.showOnNavbar}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, showOnNavbar: v }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Homepage</label>
                <Switch
                  checked={form.showOnHomepage}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, showOnHomepage: v }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Category</TableHead>
              <TableHead className="text-zinc-700 font-bold">Cover Image</TableHead>
              <TableHead className="text-zinc-700 font-bold">Products</TableHead>
              <TableHead className="text-zinc-700 font-bold">Active</TableHead>
              <TableHead className="text-zinc-700 font-bold">Navbar</TableHead>
              <TableHead className="text-zinc-700 font-bold">Homepage</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  No categories found. Click "Add Category" to start building your catalog.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => (
                <TableRow key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <p className="font-bold text-zinc-900">{c.name}</p>
                      <p className="text-zinc-400 font-mono text-[11px] mt-0.5">/{c.slug}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-[10px]">
                        No img
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono font-bold text-[11px]">
                      {c.productCount} items
                    </span>
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(v) => toggleField(c.id, "isActive", v)}
                    />
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={c.showOnNavbar}
                      onCheckedChange={(v) => toggleField(c.id, "showOnNavbar", v)}
                    />
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={c.showOnHomepage}
                      onCheckedChange={(v) => toggleField(c.id, "showOnHomepage", v)}
                    />
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSizeGuideId(c.id)}
                        className="h-8 px-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                        title="Edit Size Chart Guide"
                      >
                        <Ruler className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="hidden sm:inline">Size Guide</span>
                      </button>

                      <Link href={`/shop?category=${c.slug}`} target="_blank" title="View in Store">
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
                        onClick={() => openEdit(c)}
                        title="Edit Category"
                        className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting === c.id}
                        title="Delete Category"
                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
