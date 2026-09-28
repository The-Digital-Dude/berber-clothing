"use client"

import { useState, useEffect, useMemo } from "react"
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
  Pencil,
  Trash2,
  Ruler,
  ExternalLink,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Search,
  Layers,
  CornerDownRight,
  ChevronsUpDown,
} from "lucide-react"
import Link from "next/link"
import ImagePicker from "@/components/admin/ImagePicker"
import { cn } from "@/lib/utils"

export type CategoryItem = {
  id: string
  name: string
  slug: string
  description: string
  image: string
  parentId: string | null
  parent?: { id: string; name: string; slug: string } | null
  isActive: boolean
  showOnNavbar: boolean
  showOnHomepage: boolean
  sortOrder: number
  productCount: number
  childrenCount?: number
  children?: CategoryItem[]
}

const emptyForm = (defaultParentId?: string | null) => ({
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: defaultParentId || null,
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
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
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

export function CategoryClient({ data }: { data: CategoryItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sizeGuideId, setSizeGuideId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [isSubcategoryMode, setIsSubcategoryMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Separate top-level categories and subcategories
  const topLevelCategories = useMemo(() => {
    return data.filter((c) => !c.parentId)
  }, [data])

  const subcategoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem[]>()
    data.forEach((c) => {
      if (c.parentId) {
        const existing = map.get(c.parentId) || []
        existing.push(c)
        map.set(c.parentId, existing)
      }
    })
    return map
  }, [data])

  // Track expanded parent rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Default all top-level with children to expanded
    return new Set(topLevelCategories.map((c) => c.id))
  })

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (expandedIds.size > 0) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(topLevelCategories.map((c) => c.id)))
    }
  }

  function openAdd(defaultParentId?: string | null) {
    setEditingId(null)
    setForm(emptyForm(defaultParentId))
    setIsSubcategoryMode(Boolean(defaultParentId))
    setError("")
    setOpen(true)
  }

  function openEdit(c: CategoryItem) {
    setEditingId(c.id)
    setIsSubcategoryMode(Boolean(c.parentId))
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      parentId: c.parentId || null,
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
    if (isSubcategoryMode && !form.parentId) {
      setError("Please select a parent category for this subcategory.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        parentId: isSubcategoryMode ? form.parentId : null,
      }
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    if (!confirm(`Delete category "${name}"? Any child subcategories will become top-level.`)) return
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

  // Filtered categories
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return topLevelCategories
    const q = searchQuery.toLowerCase().trim()
    return topLevelCategories.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)
      const children = subcategoryMap.get(cat.id) || []
      const childMatch = children.some((ch) => ch.name.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q))
      return nameMatch || childMatch
    })
  }, [topLevelCategories, subcategoryMap, searchQuery])

  return (
    <div className="space-y-4">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories & subcategories…"
            className="pl-9 h-9 text-xs rounded-xl border-zinc-200 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="h-9 px-3 rounded-xl border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer flex items-center gap-1.5"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span>{expandedIds.size > 0 ? "Collapse All" : "Expand All"}</span>
          </Button>

          <Button
            onClick={() => openAdd(null)}
            className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Category
          </Button>
        </div>
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
              <span>{editingId ? "Edit Category Details" : "Create New Category / Subcategory"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            {/* Level Selector */}
            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Hierarchy Level</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubcategoryMode(false)
                    setForm((f) => ({ ...f, parentId: null }))
                  }}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                    !isSubcategoryMode ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Top-Level Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubcategoryMode(true)
                    if (!form.parentId && topLevelCategories.length > 0) {
                      setForm((f) => ({ ...f, parentId: topLevelCategories[0].id }))
                    }
                  }}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                    isSubcategoryMode ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Subcategory
                </button>
              </div>
            </div>

            {/* Parent Category Picker (if subcategory mode) */}
            {isSubcategoryMode && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="font-bold uppercase tracking-wider text-zinc-600 text-[10px]">Parent Category *</label>
                <select
                  value={form.parentId || ""}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  required
                  className="w-full h-9 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="" disabled>Select parent category…</option>
                  {topLevelCategories
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (/{c.slug})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">Category Name *</label>
              <Input
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Oversized T-Shirts"
                required
                className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-zinc-600">URL Slug *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="oversized-t-shirts"
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

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm cursor-pointer"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories Tree Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold w-[34%]">Category & Hierarchy</TableHead>
              <TableHead className="text-zinc-700 font-bold">Cover Image</TableHead>
              <TableHead className="text-zinc-700 font-bold">Products</TableHead>
              <TableHead className="text-zinc-700 font-bold">Active</TableHead>
              <TableHead className="text-zinc-700 font-bold">Navbar</TableHead>
              <TableHead className="text-zinc-700 font-bold">Homepage</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filteredParents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                  {searchQuery ? "No matching categories found." : "No categories found. Click 'Add Category' to start."}
                </TableCell>
              </TableRow>
            ) : (
              filteredParents.map((parent) => {
                const children = subcategoryMap.get(parent.id) || []
                const isExpanded = expandedIds.has(parent.id)
                const totalRollupProducts = parent.productCount + children.reduce((sum, ch) => sum + ch.productCount, 0)

                return (
                  <div key={parent.id} className="contents">
                    {/* Top-Level Parent Row */}
                    <TableRow className="hover:bg-zinc-50/80 transition-colors bg-white font-medium border-b border-zinc-100">
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {children.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(parent.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                              title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-6 h-6 flex items-center justify-center text-zinc-300">
                              •
                            </span>
                          )}

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900 text-sm">{parent.name}</span>
                              {children.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-800">
                                  <Layers className="w-2.5 h-2.5" />
                                  {children.length} subcategories
                                </span>
                              )}
                            </div>
                            <span className="text-zinc-400 font-mono text-[11px] mt-0.5">/{parent.slug}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {parent.image ? (
                          <img
                            src={parent.image}
                            alt={parent.name}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-[10px]">
                            No img
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold text-[11px]">
                            {totalRollupProducts} total
                          </span>
                          {children.length > 0 && parent.productCount > 0 && (
                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              ({parent.productCount} direct)
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={parent.isActive}
                          onCheckedChange={(v) => toggleField(parent.id, "isActive", v)}
                        />
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={parent.showOnNavbar}
                          onCheckedChange={(v) => toggleField(parent.id, "showOnNavbar", v)}
                        />
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={parent.showOnHomepage}
                          onCheckedChange={(v) => toggleField(parent.id, "showOnHomepage", v)}
                        />
                      </TableCell>

                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Subcategory Shortcut */}
                          <button
                            type="button"
                            onClick={() => openAdd(parent.id)}
                            className="h-8 px-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/90 text-amber-900 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            title={`Add Subcategory to ${parent.name}`}
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Add Sub</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSizeGuideId(parent.id)}
                            className="h-8 px-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            title="Edit Size Chart Guide"
                          >
                            <Ruler className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="hidden md:inline">Size Guide</span>
                          </button>

                          <Link href={`/shop?category=${parent.slug}`} target="_blank" title="View in Store">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(parent)}
                            title="Edit Category"
                            className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(parent.id, parent.name)}
                            disabled={deleting === parent.id}
                            title="Delete Category"
                            className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Subcategories (Indented Rows) */}
                    {isExpanded &&
                      children.map((sub) => (
                        <TableRow
                          key={sub.id}
                          className="bg-zinc-50/50 hover:bg-zinc-100/60 transition-colors border-b border-zinc-100/80"
                        >
                          <TableCell className="pl-12 py-2.5">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-semibold text-zinc-800 text-xs">{sub.name}</span>
                                <span className="text-zinc-400 font-mono text-[10px]">/{sub.slug}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {sub.image ? (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-8 h-8 rounded-md object-cover bg-zinc-100 border border-zinc-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-[9px]">
                                -
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 font-mono text-[10px] font-bold">
                              {sub.productCount} items
                            </span>
                          </TableCell>

                          <TableCell>
                            <Switch
                              checked={sub.isActive}
                              onCheckedChange={(v) => toggleField(sub.id, "isActive", v)}
                            />
                          </TableCell>

                          <TableCell>
                            <Switch
                              checked={sub.showOnNavbar}
                              onCheckedChange={(v) => toggleField(sub.id, "showOnNavbar", v)}
                            />
                          </TableCell>

                          <TableCell>
                            <Switch
                              checked={sub.showOnHomepage}
                              onCheckedChange={(v) => toggleField(sub.id, "showOnHomepage", v)}
                            />
                          </TableCell>

                          <TableCell className="text-right pr-5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSizeGuideId(sub.id)}
                                className="h-7 px-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Edit Subcategory Size Guide"
                              >
                                <Ruler className="w-3 h-3 text-zinc-400" />
                                <span className="hidden md:inline">Size Guide</span>
                              </button>

                              <Link href={`/shop?category=${sub.slug}`} target="_blank" title="View in Store">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-400 hover:text-zinc-900 rounded-md cursor-pointer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(sub)}
                                title="Edit Subcategory"
                                className="h-7 w-7 text-zinc-600 hover:text-zinc-900 rounded-md cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(sub.id, sub.name)}
                                disabled={deleting === sub.id}
                                title="Delete Subcategory"
                                className="h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </div>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
