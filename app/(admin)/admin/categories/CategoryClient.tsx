"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Tag, Pencil, Trash2 } from "lucide-react"
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

export function CategoryClient({ data }: { data: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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


