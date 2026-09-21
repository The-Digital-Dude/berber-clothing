"use client"

import { useEffect } from "react"

export default function TrackPageView({ productId }: { productId: string }) {
  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", productId }),
    }).catch(() => {})
  }, [productId])

  return null
}
