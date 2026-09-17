"use client"
import { useState } from "react"

interface Variant {
  id: string
  size: string | null
  color: string | null
  stock: number
  price: number
  product: { name: string; slug: string }
}

export default function InventoryBulkClient({ variants }: { variants: Variant[] }) {
  const [rows, setRows] = useState(variants.map((v) => ({ ...v, dirty: false })))
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null)
  const [search, setSearch] = useState("")

  const update = (id: string, field: "stock" | "price", value: number) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value, dirty: true } : r))
  }

  const save = async () => {
    const dirty = rows.filter((r) => r.dirty)
    if (dirty.length === 0) return
    setSaving(true)
    const res = await fetch("/api/admin/inventory/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: dirty.map((r) => ({ variantId: r.id, stock: r.stock, price: r.price })) }),
    })
    const data = await res.json()
    setResult(data)
    setRows((prev) => prev.map((r) => ({ ...r, dirty: false })))
    setSaving(false)
  }

  const filtered = rows.filter((r) =>
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.size ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.color ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const dirtyCount = rows.filter((r) => r.dirty).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory Bulk Update</h1>
        <button
          onClick={save}
          disabled={saving || dirtyCount === 0}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-40"
        >
          {saving ? "Saving…" : `Save ${dirtyCount > 0 ? `(${dirtyCount})` : ""}`}
        </button>
      </div>

      {result && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 text-sm rounded-lg">
          Saved: {result.succeeded} succeeded, {result.failed} failed.
        </div>
      )}

      <input
        type="search"
        placeholder="Filter by product, size, color…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 border rounded-lg px-3 py-2 text-sm"
      />

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium w-28">Stock</th>
              <th className="px-4 py-3 font-medium w-32">Price (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className={r.dirty ? "bg-yellow-50" : ""}>
                <td className="px-4 py-2 font-medium truncate max-w-[200px]">{r.product.name}</td>
                <td className="px-4 py-2 text-gray-500">{r.size ?? "—"}</td>
                <td className="px-4 py-2 text-gray-500">{r.color ?? "—"}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    value={r.stock}
                    onChange={(e) => update(r.id, "stock", parseInt(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={r.price}
                    onChange={(e) => update(r.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">No variants found.</p>
        )}
      </div>
    </div>
  )
}
