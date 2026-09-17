import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductCard from "@/components/store/ProductCard"
import { serialize } from "@/lib/utils"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = await prisma.smartCollection.findUnique({ where: { slug } }).catch(() => null)
  if (!collection) return { title: "Collection Not Found" }
  return { title: collection.name, description: collection.description ?? undefined }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const collection = await prisma.smartCollection.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
              category: true,
            },
          },
        },
      },
    },
  }).catch(() => null)

  if (!collection) notFound()

  const products = collection.products.map((cp) => cp.product)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-berber-black">{collection.name}</h1>
        {collection.description && (
          <p className="text-berber-text-muted mt-3 max-w-2xl">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{products.length} products</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p>No products in this collection yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {serialize(products).map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
