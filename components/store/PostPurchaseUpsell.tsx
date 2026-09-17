"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useCartStore } from "@/store/useCartStore"

interface Product {
  id: string
  name: string
  slug: string
  images: { url: string }[]
  variants: { id: string; price: number; stock: number }[]
}

export default function PostPurchaseUpsell({ orderId }: { orderId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const { addItem } = useCartStore()

  useEffect(() => {
    const key = `upsell_shown_${orderId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")

    fetch("/api/store/upsell-suggestions")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
  }, [orderId])

  if (dismissed || products.length === 0) return null

  const handleAdd = (product: Product) => {
    const variant = product.variants.find((v) => v.stock > 0)
    if (!variant) return
    addItem({
      id: variant.id,
      productId: product.id,
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      price: variant.price,
      image: product.images[0]?.url ?? "",
      quantity: 1,
      size: "",
      color: "",
    })
    setAdded(product.id)
    setTimeout(() => setAdded(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Customers also loved</h2>
          <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          {products.slice(0, 3).map((p) => {
            const variant = p.variants.find((v) => v.stock > 0)
            return (
              <div key={p.id} className="flex items-center gap-4 border rounded-xl p-3">
                <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-sm text-gray-500">৳{variant?.price?.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={!variant}
                  className="shrink-0 px-3 py-1.5 bg-black text-white text-sm rounded-lg disabled:opacity-40"
                >
                  {added === p.id ? "Added!" : "Add"}
                </button>
              </div>
            )
          })}
        </div>
        <button onClick={() => setDismissed(true)} className="mt-4 w-full text-sm text-gray-500 hover:underline">
          No thanks
        </button>
      </div>
    </div>
  )
}
