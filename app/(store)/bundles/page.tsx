import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bundles — Berber",
  description: "Save more with our curated product bundles.",
}

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { product: { include: { images: { take: 1 } } } },
      },
    },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Bundles</h1>
        <p className="text-gray-500 max-w-md mx-auto">Curated sets at a better price. Mix, match, and save.</p>
      </div>

      {bundles.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No bundles available right now.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const savings = bundle.comparePrice
              ? Number(bundle.comparePrice) - Number(bundle.price)
              : null
            return (
              <Link key={bundle.id} href={`/bundles/${bundle.slug}`} className="group block border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Bundle image or product collage */}
                <div className="relative bg-gray-50 aspect-square overflow-hidden">
                  {bundle.image ? (
                    <Image src={bundle.image} alt={bundle.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="grid grid-cols-2 h-full gap-0.5">
                      {bundle.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative overflow-hidden bg-gray-100">
                          {item.product.images[0] && (
                            <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {savings && savings > 0 && (
                    <div className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
                      Save ৳{savings.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="font-semibold text-lg group-hover:text-[#c9a84c] transition-colors">{bundle.name}</h2>
                  {bundle.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{bundle.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{bundle.items.length} items included</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-lg font-bold">৳{Number(bundle.price).toLocaleString()}</span>
                    {bundle.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">৳{Number(bundle.comparePrice).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
