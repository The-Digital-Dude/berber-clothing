"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { captureFbc } from "@/lib/fbclid"

export default function MetaPixelTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureFbc()
    const w = window as any
    if (typeof w.fbq === "function") {
      w.fbq("track", "PageView")
    }
  }, [pathname, searchParams])

  return null
}
