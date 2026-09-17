"use client"

import { useEffect } from "react"
import { recordView } from "./RecentlyViewed"

interface Props {
  product: { id: string; name: string; slug: string; price: number; image?: string }
}

export default function RecordView({ product }: Props) {
  useEffect(() => {
    recordView(product)
  }, [product.id])
  return null
}
