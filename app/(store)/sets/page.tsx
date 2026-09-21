import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop Sets | Berber",
  description: "Complete blazer sets — buy your blazer with matching pant, koti, and more.",
}

export default async function SetsPage() {
  // Fetch products that have a bundle configured
  const primaryProducts = await prisma.product.findMany({
    where: { bundleId: { not: null }, isActive: true },
    include: {
      images: { take: 1 },
      category: true,
      setBundle: {
        include: {
          items: {
            include: {
              product: {
                include: { images: { take: 1 } },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">The Collection</p>
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-berber-black">Blazer Sets</h1>
        <p className="text-berber-text-muted max-w-lg mx-auto text-sm leading-relaxed">
          Each blazer is designed to pair with a matching pant, koti, and more. Mix and match pieces — every item also sold individually.
        </p>
      </div>

      {primaryProducts.length === 0 ? (
        <p className="text-center text-berber-text-muted py-20">No sets available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {primaryProducts.map((product) => {
            const bundle = product.setBundle
            const companions = bundle?.items.map((i: any) => i.product) ?? []
            const allImages = [
              product.images[0]?.url,
              ...companions.map((c: any) => c.images[0]?.url).filter(Boolean),
            ].filter(Boolean) as string[]

            return (
              <div key={product.id} className="group border border-berber-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image strip */}
                <div className="flex h-80 overflow-hidden">
                  {allImages.slice(0, 3).map((url: string, i: number) => (
                    <div key={i} className="relative flex-1 overflow-hidden">
                      <Image
                        src={url}
                        alt={product.name}
                        fill
                        sizes="33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  ))}
                  {allImages.length === 0 && (
                    <div className="flex-1 bg-berber-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-berber-text-muted">{product.category?.name}</p>
                    <h2 className="font-heading text-xl font-bold text-berber-black mt-1">{product.name}</h2>
                  </div>

                  {companions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-berber-text-muted">Also available:</span>
                      {companions.map((c: any) => (
                        <Link
                          key={c.id}
                          href={`/shop/${c.slug}`}
                          className="text-xs font-medium border border-berber-border rounded-full px-3 py-1 hover:border-berber-gold hover:text-berber-gold transition-colors"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link href={`/shop/${product.slug}`}>
                    <button className="w-full py-3 bg-berber-black text-white text-xs font-bold uppercase tracking-widest hover:bg-berber-gold transition-colors rounded-xl mt-2">
                      Explore Set
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
