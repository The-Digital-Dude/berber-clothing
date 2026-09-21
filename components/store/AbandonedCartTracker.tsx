"use client"

import { useSession } from "@/hooks/useSession"
import { useAbandonedCart } from "@/hooks/useAbandonedCart"

export default function AbandonedCartTracker() {
  const { data, status } = useSession()
  const email = status === "authenticated" ? data.user.email : undefined
  const name = status === "authenticated" ? (data.user.name ?? undefined) : undefined
  useAbandonedCart(email, undefined, name)
  return null
}
