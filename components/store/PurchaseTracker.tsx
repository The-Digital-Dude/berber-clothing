"use client"

import { useEffect } from "react"
import { trackPurchase } from "@/lib/analytics"

interface Props {
  order: {
    id: string
    orderNumber: string
    total: number
    items?: { productId: string; productName: string; price: number; quantity: number }[]
  }
}

export default function PurchaseTracker({ order }: Props) {
  useEffect(() => {
    const key = `purchase_tracked_${order.id}`
    if (sessionStorage.getItem(key)) return
    trackPurchase({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      items: order.items?.map((i) => ({ productId: i.productId, name: i.productName, price: Number(i.price), quantity: i.quantity })),
    })
    sessionStorage.setItem(key, "1")
  }, [order.id])

  return null
}
