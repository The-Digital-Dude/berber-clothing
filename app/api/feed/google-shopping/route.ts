import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim()
}

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: true,
      brand: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const itemsXml = products
    .map((product) => {
      const priceNum = Number(product.price)
      const comparePriceNum = product.comparePrice ? Number(product.comparePrice) : null
      const hasDiscount = comparePriceNum && comparePriceNum > priceNum

      const title = escapeXml(product.seoTitle || product.name)
      const rawDesc = product.seoDescription || product.description || `${product.name} from Berber.`
      const description = escapeXml(stripHtml(rawDesc))
      const link = `${siteUrl}/shop/${product.slug}`
      const mainImage = product.images[0]?.url || ""
      const extraImages = product.images.slice(1, 10).map((img) => img.url)
      const brand = escapeXml(product.brand?.name || "Berber")
      const categoryName = escapeXml(product.category?.name || "Apparel & Accessories > Clothing")
      
      const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      const availability = totalStock > 0 ? "in stock" : "out of stock"

      return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
      ${extraImages.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${availability}</g:availability>
      <g:price>${hasDiscount ? comparePriceNum : priceNum}.00 BDT</g:price>
      ${hasDiscount ? `<g:sale_price>${priceNum}.00 BDT</g:sale_price>` : ""}
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${categoryName}</g:product_type>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Berber Clothing Product Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Luxury contemporary fashion catalog for Google Merchant Center</description>
    ${itemsXml}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
