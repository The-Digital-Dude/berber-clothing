"use client"

import { useEffect } from "react"
import { trackViewContent } from "@/lib/analytics"

interface Props {
  product: { id: string; name: string; price: number; category?: string }
}

export default function ViewContentTracker({ product }: Props) {
  useEffect(() => {
    trackViewContent(product)
  }, [product.id])

  return null
}
