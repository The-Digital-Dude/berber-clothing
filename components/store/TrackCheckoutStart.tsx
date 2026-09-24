"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/useCartStore"
import { trackInitiateCheckout } from "@/lib/analytics"

export default function TrackCheckoutStart() {
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "checkout_start" }),
    }).catch(() => {})

    if (items.length > 0) {
      const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      trackInitiateCheckout(value, items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
