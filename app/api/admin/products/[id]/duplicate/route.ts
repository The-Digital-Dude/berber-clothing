import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const source = await prisma.product.findUnique({
    where: { id },
    include: { images: true, variants: true },
  })
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const baseSlug = `${source.slug}-copy`
  // Make slug unique
  let slug = baseSlug
  let suffix = 1
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const copy = await prisma.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      description: source.description,
      price: source.price,
      comparePrice: source.comparePrice && Number(source.comparePrice) > 0 ? source.comparePrice : null,
      categoryId: source.categoryId,
      brandId: source.brandId,
      tags: source.tags,
      isActive: false, // draft by default
      isFeatured: false,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      seoKeywords: source.seoKeywords,
      images: {
        create: source.images.map((img) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
      },
      variants: {
        create: source.variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          sku: `${v.sku}-COPY-${Date.now()}`,
          stock: 0,
          price: v.price,
          comparePrice: v.comparePrice && Number(v.comparePrice) > 0 ? v.comparePrice : null,
          costPrice: v.costPrice,
        })),
      },
    },
  })

  return NextResponse.json({ product: copy })
}
