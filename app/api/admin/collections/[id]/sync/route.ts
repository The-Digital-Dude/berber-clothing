import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

type Rule = { field: string; operator: string; value: string }

async function matchProducts(rules: Rule[]): Promise<string[]> {
  // Build Prisma where clause from rules
  // Supported: field=tags operator=contains, field=price operator=lt/gt/lte/gte, field=category operator=equals, field=brand operator=equals
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, tags: true, price: true, categoryId: true, brandId: true, category: { select: { slug: true } }, brand: { select: { slug: true } } },
  })

  return allProducts
    .filter((p) => rules.every((rule) => {
      const field = rule.field
      const val = rule.value
      if (field === "tags") return p.tags?.toLowerCase().includes(val.toLowerCase())
      if (field === "price") {
        const price = Number(p.price)
        const v = parseFloat(val)
        if (rule.operator === "lt") return price < v
        if (rule.operator === "gt") return price > v
        if (rule.operator === "lte") return price <= v
        if (rule.operator === "gte") return price >= v
      }
      if (field === "category") return p.category?.slug === val || p.categoryId === val
      if (field === "brand") return p.brand?.slug === val || p.brandId === val
      return false
    }))
    .map((p) => p.id)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const collection = await prisma.smartCollection.findUnique({ where: { id } })
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rules: Rule[] = JSON.parse(collection.rules)
  const productIds = await matchProducts(rules)

  // Replace all products in collection
  await prisma.$transaction([
    prisma.smartCollectionProduct.deleteMany({ where: { collectionId: id } }),
    prisma.smartCollectionProduct.createMany({
      data: productIds.map((productId) => ({ collectionId: id, productId })),
      skipDuplicates: true,
    }),
  ])

  return NextResponse.json({ matched: productIds.length })
}
