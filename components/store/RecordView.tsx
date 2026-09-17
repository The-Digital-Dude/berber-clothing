"use client"

import { useEffect } from "react"
import { recordView } from "./RecentlyViewed"

interface Props {
  product: { id: string; name: string; slug: string; price: number; image?: string }
}

export default function RecordView({ product }: Props) {
  useEffect(() => {
    recordView(product)
    fetch("/api/store/product-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {})
  }, [product.id])
  return null
}
