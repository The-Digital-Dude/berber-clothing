import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getActiveFlashSaleBatch, applyFlashSaleDiscount } from "@/lib/flashSale"
import { serialize } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const category  = sp.get("category")  || ""
  const brandId   = sp.get("brandId")   || ""
  const size      = sp.get("size")      || ""
  const color     = sp.get("color")     || ""
  const sort      = sp.get("sort")      || "newest"
  const saleOnly  = sp.get("sale")      === "true"
  const minPrice  = sp.get("minPrice")  || ""
  const maxPrice  = sp.get("maxPrice")  || ""
  const search    = sp.get("search")    || ""
  const take      = Math.min(parseInt(sp.get("take") || "12"), 100)

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-asc")  orderBy = { price: "asc" }
  if (sort === "price-desc") orderBy = { price: "desc" }

  const where: any = { isActive: true }
  if (search) {
    where.OR = [
      { name:        { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags:        { contains: search, mode: "insensitive" } },
    ]
  }
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } }).catch(() => null)
    if (cat) where.categoryId = cat.id
  }
  if (brandId)  where.brandId = brandId
  if (saleOnly) where.comparePrice = { not: null }
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = Number(minPrice)
    if (maxPrice) where.price.lte = Number(maxPrice)
  }
  if (size || color) {
    where.variants = { some: {} }
    if (size)  where.variants.some.size  = size
    if (color) where.variants.some.color = color
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: true, variants: true, brand: true },
      orderBy,
      take,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
  ])

  const flashSaleMap = await getActiveFlashSaleBatch(
    products.map((p: any) => ({ id: p.id, categoryId: p.categoryId }))
  ).catch(() => new Map())

  const enriched = serialize(products).map((p: any) => {
    const sale = flashSaleMap.get(p.id)
    return {
      ...p,
      flashSalePrice: sale ? applyFlashSaleDiscount(Number(p.price), sale) : null,
      flashSaleLabel: sale
        ? sale.discountType === "PERCENTAGE"
          ? `${sale.discountValue}% off`
          : `৳${sale.discountValue} off`
        : null,
    }
  })

  return NextResponse.json({ products: enriched, total, hasMore: total > take })
}
