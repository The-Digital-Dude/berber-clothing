import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

// PATCH body: { updates: [{ variantId, stock, price? }] }
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { updates } = await req.json()
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 })
  }

  const results = await Promise.allSettled(
    updates.map(({ variantId, stock, price }: { variantId: string; stock?: number; price?: number }) =>
      prisma.productVariant.update({
        where: { id: variantId },
        data: {
          ...(stock !== undefined ? { stock } : {}),
          ...(price !== undefined ? { price } : {}),
        },
      })
    )
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ succeeded, failed })
}
