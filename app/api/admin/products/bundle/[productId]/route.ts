import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

// GET /api/admin/products/bundle/[productId]
// Returns the bundle (+ items) for a given product, or null
export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { productId } = await params

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      bundleId: true,
      setBundle: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              product: {
                select: { id: true, name: true, slug: true, price: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  })

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ bundle: product.setBundle })
}

// POST /api/admin/products/bundle/[productId]
// Body: { discountPct?: number, companionProductIds: string[] }
// Creates or updates the bundle, syncing BundleItem rows to match companionProductIds
export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { productId } = await params
  const { discountPct, companionProductIds } = await req.json()

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, bundleId: true },
  })
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  if (product.bundleId) {
    // Update existing bundle
    await prisma.bundle.update({
      where: { id: product.bundleId },
      data: { discountPct: discountPct ?? null },
    })
    // Sync items: delete all, recreate in order
    await prisma.bundleItem.deleteMany({ where: { bundleId: product.bundleId } })
    if (companionProductIds.length > 0) {
      await prisma.bundleItem.createMany({
        data: companionProductIds.map((pid: string, i: number) => ({
          bundleId: product.bundleId!,
          productId: pid,
          sortOrder: i,
        })),
      })
    }
    const updated = await prisma.bundle.findUnique({
      where: { id: product.bundleId },
      include: { items: { orderBy: { sortOrder: "asc" }, include: { product: { select: { id: true, name: true, slug: true, price: true, images: { take: 1 } } } } } },
    })
    return NextResponse.json({ bundle: updated })
  } else {
    // Create new bundle and link to product
    const bundle = await prisma.bundle.create({
      data: {
        name: `${product.name} — Set`,
        slug: `set-${productId}`,
        price: 0,
        type: "PICK_N",
        discountPct: discountPct ?? null,
        primaryProduct: { connect: { id: productId } },
        items: {
          create: companionProductIds.map((pid: string, i: number) => ({
            productId: pid,
            sortOrder: i,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" }, include: { product: { select: { id: true, name: true, slug: true, price: true, images: { take: 1 } } } } } },
    })
    // Link product → bundle
    await prisma.product.update({ where: { id: productId }, data: { bundleId: bundle.id } })
    return NextResponse.json({ bundle })
  }
}

// DELETE /api/admin/products/bundle/[productId]
// Deletes the entire bundle (and unlinks the product)
export async function DELETE(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { productId } = await params

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { bundleId: true } })
  if (!product?.bundleId) return NextResponse.json({ success: true })

  await prisma.product.update({ where: { id: productId }, data: { bundleId: null } })
  await prisma.bundle.delete({ where: { id: product.bundleId } })
  return NextResponse.json({ success: true })
}
