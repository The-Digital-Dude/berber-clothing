"use client"
import { useCartStore } from "@/store/useCartStore"
import { useRouter } from "next/navigation"

interface DraftItem {
  productId: string
  variantId: string
  name: string
  size: string
  color: string
  quantity: number
  price: number
}

interface Draft {
  id: string
  guestEmail: string | null
  items: DraftItem[]
  subtotal: number
  discount: number
  total: number
  note: string | null
  status: string
  expiresAt: string | null
}

export default function DraftOrderClient({ draft }: { draft: Draft }) {
  const { addItem, clearCart } = useCartStore()
  const router = useRouter()

  const expired = draft.expiresAt && new Date(draft.expiresAt) < new Date()

  const acceptDraft = () => {
    clearCart()
    draft.items.forEach((item) =>
      addItem({ id: item.variantId, productId: item.productId, productSlug: "", variantId: item.variantId, name: item.name, price: item.price, image: "", quantity: item.quantity, size: item.size, color: item.color })
    )
    router.push("/checkout")
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Your Draft Order</h1>
      {expired ? (
        <p className="text-red-600 text-sm mb-4">This draft order has expired.</p>
      ) : draft.status === "COMPLETED" ? (
        <p className="text-green-600 text-sm mb-4">This draft order has already been placed.</p>
      ) : null}

      {draft.note && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium mb-1">Note from us</p>
          <p className="text-gray-700">{draft.note}</p>
        </div>
      )}

      <div className="bg-white border rounded-xl divide-y mb-6">
        {draft.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start px-4 py-3">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">{[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}</p>
            </div>
            <p className="text-sm font-medium">৳{(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
        {draft.discount > 0 && (
          <div className="flex justify-between px-4 py-2 text-sm text-green-700">
            <span>Discount</span>
            <span>−৳{draft.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between px-4 py-3 font-bold">
          <span>Total</span>
          <span>৳{draft.total.toLocaleString()}</span>
        </div>
      </div>

      {!expired && draft.status === "OPEN" && (
        <button onClick={acceptDraft} className="w-full py-3 bg-black text-white rounded-xl font-semibold">
          Accept & Proceed to Checkout
        </button>
      )}
    </div>
  )
}
