"use client"

import { useEffect } from "react"
import { trackPurchase } from "@/lib/analytics"

interface Props {
  order: { id: string; orderNumber: string; total: number }
}

export default function PurchaseTracker({ order }: Props) {
  useEffect(() => {
    const key = `purchase_tracked_${order.id}`
    if (sessionStorage.getItem(key)) return
    trackPurchase({ id: order.id, orderNumber: order.orderNumber, total: order.total })
    sessionStorage.setItem(key, "1")
  }, [order.id])

  return null
}
