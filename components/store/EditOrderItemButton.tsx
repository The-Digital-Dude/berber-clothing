"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X } from "lucide-react"
import { toast } from "sonner"

type Variant = { id: string; size: string; color: string; stock: number }

export default function EditOrderItemButton({
  orderId,
  itemId,
  currentVariantId,
  variants,
  otherItemVariantIds,
}: {
  orderId: string
  itemId: string
  currentVariantId: string
  variants: Variant[]
  otherItemVariantIds: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(currentVariantId)
  const [saving, setSaving] = useState(false)

  const options = variants.filter((v) => !otherItemVariantIds.includes(v.id) || v.id === currentVariantId)

  const save = async () => {
    if (selected === currentVariantId) { setOpen(false); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/store/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Item updated")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update item")
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-berber-gold hover:text-berber-black transition-colors mt-1"
      >
        <Pencil className="w-3 h-3" /> Change size / color
      </button>
    )
  }

  return (
    <div className="mt-2 p-3 bg-berber-muted/40 rounded-lg border border-berber-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-berber-text-muted">Change size / color</span>
        <button onClick={() => setOpen(false)} aria-label="Cancel">
          <X className="w-3.5 h-3.5 text-berber-text-muted hover:text-berber-black" />
        </button>
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full h-9 px-2 rounded-md border border-berber-border bg-white text-sm"
      >
        {options.map((v) => (
          <option key={v.id} value={v.id} disabled={v.stock <= 0 && v.id !== currentVariantId}>
            {v.size} / {v.color}{v.id !== currentVariantId ? (v.stock > 0 ? ` — ${v.stock} left` : " — out of stock") : " (current)"}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || selected === currentVariantId}
        className="w-full py-2 text-xs font-bold uppercase tracking-widest bg-berber-black text-white rounded-md hover:bg-berber-gold transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Change"}
      </button>
    </div>
  )
}
