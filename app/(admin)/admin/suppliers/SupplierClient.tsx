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
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  MessageCircle,
  ShoppingCart,
} from "lucide-react"

type Supplier = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  purchaseOrderCount: number
  createdAt: string
}

export function SupplierClient({ data }: { data: Supplier[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setNote("")
    setIsDialogOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setName(s.name)
    setPhone(s.phone || "")
    setEmail(s.email || "")
    setAddress(s.address || "")
    setNote(s.note || "")
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Supplier name is required")
    setSaving(true)
    try {
      const url = editing ? `/api/admin/suppliers/${editing.id}` : "/api/admin/suppliers"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address, note }),
      })
      if (res.ok) {
        toast.success(editing ? "Supplier updated" : "Supplier added")
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save supplier")
      }
    } catch {
      toast.error("Error saving supplier")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, supplierName: string) {
    if (!confirm(`Delete supplier "${supplierName}"?`)) return
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Supplier deleted")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to delete supplier")
      }
    } catch {
      toast.error("Error deleting supplier")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Supplier</Button>} />
          <DialogContent className="sm:max-w-lg w-[94vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-zinc-200 shadow-2xl gap-0">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>{editing ? "Edit Supplier Details" : "Register New Supplier"}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">Company / Factory Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Garments Ltd / Dhaka Knitwear"
                  className="h-9 rounded-xl border-zinc-300 font-bold text-xs shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">Phone Number</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="h-9 rounded-xl border-zinc-300 font-mono text-xs shadow-2xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-600">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@company.com"
                    className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">Factory / Office Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 42, Sector 3, Uttara, Dhaka"
                  className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-600">Notes / Fabric Specialization</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Premium pure cotton fabric, 15-day turnaround"
                  className="h-9 rounded-xl border-zinc-300 text-xs shadow-2xs"
                />
              </div>

              <Button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm mt-4"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Supplier"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/60 border-zinc-200 text-xs font-bold">
              <TableHead className="pl-5 text-zinc-700 font-bold">Supplier / Vendor</TableHead>
              <TableHead className="text-zinc-700 font-bold">Contact Channels</TableHead>
              <TableHead className="text-zinc-700 font-bold">Address / Location</TableHead>
              <TableHead className="text-zinc-700 font-bold">Purchase Orders</TableHead>
              <TableHead className="text-right pr-5 text-zinc-700 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-400 text-xs">
                  No suppliers registered yet. Click "Add Supplier" to add manufacturing partners.
                </TableCell>
              </TableRow>
            ) : (
              data.map((s) => (
                <TableRow key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                  <TableCell className="pl-5 py-3.5">
                    <div>
                      <p className="font-bold text-zinc-900">{s.name}</p>
                      {s.note && <p className="text-zinc-400 text-[11px] mt-0.5">{s.note}</p>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {s.phone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${s.phone}`}
                            className="font-mono text-[11px] font-semibold text-zinc-800 hover:underline"
                          >
                            {s.phone}
                          </a>
                          <a
                            href={`https://wa.me/${s.phone.replace(/\D/g, "").replace(/^0/, "880")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50"
                            title="WhatsApp chat"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {s.email && (
                        <p className="text-zinc-400 text-[11px] truncate max-w-xs">{s.email}</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="text-zinc-600 text-[11px] max-w-xs truncate">
                      {s.address || "—"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold text-[11px]">
                      {s.purchaseOrderCount} POs
                    </span>
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        className="h-8 w-8 text-zinc-600 hover:text-zinc-900 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id, s.name)}
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
