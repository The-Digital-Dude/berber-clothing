"use client"

import { useEffect } from "react"
import { recordView, type ViewedProduct } from "./RecentlyViewed"

interface Props {
  product: ViewedProduct
}

export default function RecordView({ product }: Props) {
  useEffect(() => {
    recordView(product)
    fetch("/api/store/product-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {})
  }, [product.id, product])
  return null
}
