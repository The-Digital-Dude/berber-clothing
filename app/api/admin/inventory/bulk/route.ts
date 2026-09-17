import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { notifyStockAlerts } from "@/lib/stockAlert"

// PATCH body: { updates: [{ variantId, stock, price? }] }
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { updates } = await req.json()
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 })
  }

  // Fetch current stock levels to detect 0→positive transitions
  const currentVariants = await prisma.productVariant.findMany({
    where: { id: { in: updates.map((u: any) => u.variantId) } },
    select: { id: true, stock: true },
  })
  const currentStockMap = Object.fromEntries(currentVariants.map((v) => [v.id, v.stock]))

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

  // Notify back-in-stock subscribers for variants that just came back
  for (const update of updates) {
    const { variantId, stock } = update as { variantId: string; stock?: number }
    if (stock !== undefined && stock > 0 && (currentStockMap[variantId] ?? 0) === 0) {
      notifyStockAlerts(variantId).catch(() => {})
    }
  }

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ succeeded, failed })
}
