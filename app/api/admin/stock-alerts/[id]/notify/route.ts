import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendBackInStockAlert } from "@/lib/email"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  try {
    const alert = await prisma.stockAlert.findUnique({
      where: { id },
      include: {
        variant: { include: { product: { select: { name: true, slug: true } } } },
      },
    })
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await sendBackInStockAlert({
      to: alert.email,
      productName: alert.variant.product.name,
      productUrl: `${SITE_URL}/shop/${alert.variant.product.slug}`,
      variantLabel: `${alert.variant.size} / ${alert.variant.color}`,
    })

    await prisma.stockAlert.update({ where: { id }, data: { notified: true } })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
