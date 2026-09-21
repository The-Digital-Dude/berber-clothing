"use client"

import { useEffect } from "react"

export default function TrackCheckoutStart() {
  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "checkout_start" }),
    }).catch(() => {})
  }, [])

  return null
}
