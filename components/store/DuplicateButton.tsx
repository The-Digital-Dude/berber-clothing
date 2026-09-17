"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DuplicateButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDuplicate = async () => {
    if (!confirm("Duplicate this product?")) return
    setLoading(true)
    const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (data.id) router.push(`/admin/products/${data.id}/edit`)
    else alert(data.error ?? "Failed to duplicate")
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Duplicating…" : "Duplicate"}
    </button>
  )
}
