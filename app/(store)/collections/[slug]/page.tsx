import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductCard from "@/components/store/ProductCard"
import { serialize } from "@/lib/utils"
import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles, Layers } from "lucide-react"

type Rule = { field: string; operator: string; value: string }

async function getCollectionWithProducts(slug: string) {
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

  if (!collection) return null

  let products = collection.products
    .map((cp) => cp.product)
    .filter((p) => p && p.isActive)

  // If no curated products are attached yet, dynamically evaluate rules
  if (products.length === 0 && collection.rules) {
    try {
      const parsedRules: Rule[] = JSON.parse(collection.rules)
      if (Array.isArray(parsedRules) && parsedRules.length > 0) {
        const allActive = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            category: true,
            brand: true,
          },
        })

        const matched = allActive.filter((p) =>
          parsedRules.every((rule) => {
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
          })
        )

        products = matched
      }
    } catch {}
  }

  return { collection, products }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getCollectionWithProducts(slug)
  if (!data) return { title: "Collection Not Found | Berber" }

  const title = `${data.collection.name} | Berber Collection`
  const description = data.collection.description || `Explore the curated ${data.collection.name} collection at Berber.`
  const firstImage = data.products[0]?.images[0]?.url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: firstImage ? [{ url: firstImage }] : [],
    },
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getCollectionWithProducts(slug)

  if (!data) notFound()

  const { collection, products } = data

  return (
    <div className="bg-berber-bg min-h-screen animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-6 text-[10px] uppercase tracking-widest text-berber-text-muted">
        <Link href="/" className="hover:text-berber-gold transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-berber-gold transition-colors">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-berber-text font-bold">Collections</span>
        <span className="mx-2">/</span>
        <span className="text-berber-gold font-bold">{collection.name}</span>
      </div>

      {/* Collection Hero */}
      <section className="container mx-auto px-4 pb-12">
        <div className="bg-gradient-to-br from-berber-surface to-berber-muted/40 border border-berber-border/80 rounded-3xl p-8 md:p-12 relative overflow-hidden text-center max-w-5xl mx-auto shadow-xs">
          <div className="absolute top-0 right-0 w-72 h-72 bg-berber-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-berber-gold/10 border border-berber-gold/20 text-berber-gold text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Curated Collection
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-berber-black tracking-tight mb-4">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="text-berber-text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {collection.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-berber-text-muted">
            <Layers className="w-3.5 h-3.5 text-berber-gold" />
            <span>{products.length} {products.length === 1 ? "Curated Piece" : "Curated Pieces"}</span>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="container mx-auto px-4 pb-24 max-w-6xl">
        {products.length === 0 ? (
          <div className="text-center py-24 bg-berber-surface rounded-2xl border border-berber-border/60">
            <div className="w-12 h-12 rounded-full bg-berber-muted flex items-center justify-center mx-auto mb-3 text-berber-text-muted">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-berber-black mb-1">Collection Updating</h3>
            <p className="text-sm text-berber-text-muted mb-6">New items are being added to this collection soon.</p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 bg-berber-black hover:bg-berber-gold hover:text-berber-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {serialize(products).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
