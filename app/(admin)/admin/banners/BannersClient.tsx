"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import ImagePicker from "@/components/admin/ImagePicker"

type Banner = {
  id: string; title: string | null; image: string; link: string | null
  isActive: boolean; sortOrder: number
}

function emptyForm() {
  return { title: "", image: "", link: "", isActive: true, sortOrder: 0 }
}

export default function BannersClient({ data }: { data: Banner[] }) {
  const [banners, setBanners] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(b: Banner) {
    setEditing(b)
    setForm({ title: b.title || "", image: b.image, link: b.link || "", isActive: b.isActive, sortOrder: b.sortOrder })
    setOpen(true)
  }

  async function refresh() {
    const listRes = await fetch("/api/admin/banners")
    setBanners(await listRes.json())
  }

  async function handleSave() {
    if (!form.image) { toast.error("An image is required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Banner updated" : "Banner created")
    setOpen(false)
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setBanners(bs => bs.filter(b => b.id !== id))
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    })
    setBanners(bs => bs.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Banner</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Banner" : "Create Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Image *</label>
              <p className="text-xs text-muted-foreground mb-1">
                Upload a high-resolution source (at least 1920px wide) — it's shown full-bleed across the whole homepage width.
              </p>
              <ImagePicker value={form.image} onChange={(url) => setForm({ ...form, image: url })} bucket="banner-images" />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Wear Your Story" />
            </div>
            <div>
              <label className="text-sm font-medium">Link</label>
              <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/shop" />
            </div>
            <div>
              <label className="text-sm font-medium">Sort order</label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Banner"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banner</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No banners yet — the homepage is showing a placeholder stock photo.</TableCell></TableRow>}
            {banners.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <img src={b.image} alt={b.title || "Banner"} className="w-16 h-10 object-cover rounded" />
                  {b.title || <span className="text-muted-foreground italic">Untitled</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.link || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.sortOrder}</TableCell>
                <TableCell><Switch checked={b.isActive} onCheckedChange={() => toggleActive(b)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4" /></Button>
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
