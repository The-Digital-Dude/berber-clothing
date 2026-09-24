import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      category: true,
      variants: { where: { stock: { gt: 0 } }, take: 1 },
    },
    take: 1000,
  })

  const storeName = (await prisma.setting.findUnique({ where: { key: "store_name" } }))?.value || "Berber"

  const items = products
    .filter((p) => p.images.length > 0)
    .map((p) => {
      const sellingPrice = Number(p.price)
      const comparePriceNum = p.comparePrice ? Number(p.comparePrice) : 0
      const hasDiscount = comparePriceNum > sellingPrice
      const price = (hasDiscount ? comparePriceNum : sellingPrice).toFixed(2)
      const salePrice = hasDiscount ? sellingPrice.toFixed(2) : null
      const inStock = p.variants.length > 0
      const image = p.images[0]?.url ?? ""
      const url = `${SITE_URL}/shop/${p.slug}`
      const description = escapeXml((p.description ?? p.name).replace(/<[^>]*>/g, "").slice(0, 5000))

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(url)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>
      <g:price>${price} BDT</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} BDT</g:sale_price>` : ""}
      <g:brand>${escapeXml(storeName)}</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
      <g:product_type>${escapeXml(p.category?.name ?? "Clothing")}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(storeName)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(storeName)} product feed</description>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  })
}
