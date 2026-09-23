import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import BundleAddToCart from "./BundleAddToCart"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const bundle = await prisma.bundle.findUnique({ where: { slug, isActive: true } }).catch(() => null)
  if (!bundle) return { title: "Bundle Not Found" }
  return { title: `${bundle.name} Bundle`, description: bundle.description || "" }
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await prisma.bundle.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, price: true, comparePrice: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              variants: { select: { id: true, size: true, color: true, stock: true } },
            },
          },
        },
      },
    },
  }).catch(() => null)

  if (!bundle) notFound()

  // Pricing derived purely from individual product prices — no bundle-level override
  const setTotal = bundle.items.reduce((s, item) => s + Number(item.product.price) * item.quantity, 0)
  const wasTotal = bundle.items.reduce((s, item) => {
    const was = item.product.comparePrice ? Number(item.product.comparePrice) : Number(item.product.price)
    return s + was * item.quantity
  }, 0)
  const saving = wasTotal - setTotal

  return (
    <div className="bg-berber-bg min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Product grid */}
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-berber-gold">Complete Set</span>
            <h1 className="text-3xl font-heading font-bold text-berber-black mt-1 mb-2">{bundle.name}</h1>
            {bundle.description && <p className="text-berber-text-muted mb-8">{bundle.description}</p>}

            <div className="space-y-4">
              {bundle.items.map((item, idx) => {
                const image = item.product.images[0]?.url
                const price = Number(item.product.price)
                const comparePrice = item.product.comparePrice ? Number(item.product.comparePrice) : null
                return (
                  <div key={item.id} className="flex gap-4 bg-white rounded-xl p-4 border border-berber-border">
                    {idx > 0 && <div className="self-center text-xl font-bold text-berber-text-muted shrink-0">+</div>}
                    {image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={image} alt={item.product.name} fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-berber-black">{item.product.name}</h3>
                      <p className="text-sm text-berber-text-muted">{item.quantity > 1 ? `×${item.quantity}` : ""}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm font-medium">৳{price.toLocaleString()}</span>
                        {comparePrice && comparePrice > price && (
                          <span className="font-mono text-xs text-berber-text-muted line-through">৳{comparePrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-2xl border border-berber-border p-6 sticky top-24 space-y-4">
              {bundle.image && (
                <div className="relative rounded-xl overflow-hidden aspect-square mb-4">
                  <Image src={bundle.image} alt={bundle.name} fill sizes="320px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Set Total</p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-3xl font-mono font-bold text-berber-black">৳{setTotal.toLocaleString()}</span>
                  {saving > 0 && (
                    <span className="text-lg font-mono text-berber-text-muted line-through mb-0.5">৳{wasTotal.toLocaleString()}</span>
                  )}
                </div>
                {saving > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-berber-success/10 text-berber-success rounded-full text-xs font-bold">
                    You save ৳{saving.toLocaleString()}
                  </div>
                )}
              </div>
              <BundleAddToCart bundle={JSON.parse(JSON.stringify(bundle))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
