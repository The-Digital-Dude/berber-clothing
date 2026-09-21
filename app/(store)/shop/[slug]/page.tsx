import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import ProductGallery from "@/components/store/ProductGallery"
import VariantSelector from "@/components/store/VariantSelector"
import ProductCard from "@/components/store/ProductCard"
import ReviewSection from "@/components/store/ReviewSection"
import FrequentlyBoughtTogether from "@/components/store/FrequentlyBoughtTogether"
import RecentlyViewed from "@/components/store/RecentlyViewed"
import RecordView from "@/components/store/RecordView"
import FlashSaleCountdown from "@/components/store/FlashSaleCountdown"
import SocialProof from "@/components/store/SocialProof"
import ProductAddons from "@/components/store/ProductAddons"
import ReviewMediaGallery from "@/components/store/ReviewMediaGallery"
import ProductQA from "@/components/store/ProductQA"
import SizeQuiz from "@/components/store/SizeQuiz"
import StickyAddToCart from "@/components/store/StickyAddToCart"
import CompleteTheSet from "@/components/store/CompleteTheSet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Truck, RefreshCw, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import { getActiveFlashSale, applyFlashSaleDiscount } from "@/lib/flashSale"
import Link from "next/link"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
  }).catch(() => null)

  if (!product) return { title: "Product Not Found" }

  const image = product.images[0]?.url
  const price = Number(product.price).toLocaleString()
  const title = (product as any).seoTitle || `${product.name} — ৳${price}`
  const description = (product as any).seoDescription || product.description || `Shop ${product.name} at Berber. Premium quality fashion from Bangladesh.`
  const keywords = (product as any).seoKeywords || undefined

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/${slug}`,
      images: image ? [{ url: image, width: 800, height: 1000, alt: product.name }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      brand: true,
      addons: { orderBy: { sortOrder: 'asc' } },
    }
  }).catch(() => null)

  if (!product) {
    notFound()
  }

  const [reviewAgg, flashSale, attrConfig, reviews, qas] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }).catch(() => ({ _avg: { rating: 0 }, _count: { rating: 0 } })),
    getActiveFlashSale(product.id, product.categoryId).catch(() => null),
    prisma.categoryAttributeConfig.findUnique({
      where: { categoryId: product.categoryId },
    }).catch(() => null),
    prisma.review.findMany({
      where: { productId: product.id, isApproved: true },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []),
    prisma.reviewQA.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ])

  const salePrice = flashSale ? applyFlashSaleDiscount(Number(product.price), flashSale) : null
  const displayPrice = salePrice ?? Number(product.price)

  // Fetch related products, FBT suggestions, settings, and set bundle in parallel
  const [relatedProducts, fbtPairs, shippingSettings, bundle] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 4,
      include: { category: true, images: true, variants: true },
    }).catch(() => []),
    prisma.frequentlyBoughtTogether.findMany({
      where: { primaryId: product.id },
      orderBy: { score: "desc" },
      take: 3,
      include: { secondary: { include: { images: { take: 1 }, variants: true } } },
    }).catch(() => []),
    prisma.setting.findMany({
      where: { key: { in: ["free_shipping_above"] } },
    }).catch(() => []),
    // "Complete the Set" bundle
    product.bundleId ? prisma.bundle.findUnique({
      where: { id: product.bundleId },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true, name: true, slug: true, price: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
                variants: true,
              },
            },
          },
        },
      },
    }).catch(() => null) : Promise.resolve(null),
  ])

  const settingsMap = Object.fromEntries(shippingSettings.map((s: any) => [s.key, s.value]))
  const freeShippingThreshold = settingsMap.free_shipping_above ? Number(settingsMap.free_shipping_above) : null
  const setBundle = JSON.parse(JSON.stringify(bundle))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku || product.id,
    brand: { "@type": "Brand", name: product.brand?.name || "Berber" },
    ...(reviewAgg._count.rating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (reviewAgg._avg.rating || 0).toFixed(1),
        reviewCount: reviewAgg._count.rating,
      },
    }),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: Number(product.price),
      highPrice: Number(product.comparePrice || product.price),
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/shop/${product.slug}`,
    },
  }

  return (
    <div className="bg-berber-bg animate-in fade-in duration-500">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RecordView product={{ id: product.id, name: product.name, slug: product.slug, price: displayPrice, image: product.images[0]?.url }} />

      {/* Breadcrumb - Minimal */}
      <div className="container mx-auto px-4 py-6 text-[10px] uppercase tracking-widest text-berber-text-muted">
        <a href="/" className="hover:text-berber-gold transition-colors">Home</a>
        <span className="mx-2">/</span>
        <a href="/shop" className="hover:text-berber-gold transition-colors">Shop</a>
        <span className="mx-2">/</span>
        <a href={`/shop?category=${product.category?.slug}`} className="hover:text-berber-gold transition-colors">{product.category?.name}</a>
        <span className="mx-2">/</span>
        <span className="text-berber-text font-bold">{product.name}</span>
      </div>

      <div className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Image Gallery - Split layout on desktop, stacked on mobile */}
          <div className="w-full lg:w-3/5">
            <ProductGallery images={serialize(product.images)} videoUrl={(product as any).videoUrl} />
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-2/5 flex flex-col pt-4 lg:pt-10 sticky top-20 h-max">

            {/* Title & Price */}
            <div className="mb-8">
              {product.brand && (
                <Link href={`/brands/${product.brand.slug}`} className="inline-block mb-3 text-xs font-bold uppercase tracking-widest text-berber-text-muted hover:text-berber-gold transition-colors border border-berber-border rounded-full px-3 py-1">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-berber-black mb-2 leading-tight">{product.name}</h1>
              {reviewAgg._count.rating > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm text-berber-text-muted">
                  <span className="text-berber-gold font-bold">★ {(reviewAgg._avg.rating || 0).toFixed(1)}</span>
                  <span>({reviewAgg._count.rating} review{reviewAgg._count.rating === 1 ? "" : "s"})</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="font-mono text-2xl font-bold">৳{displayPrice.toLocaleString()}</span>
                {(product.comparePrice || (flashSale && Number(product.price) !== displayPrice)) && (
                  <span className="font-mono text-lg text-berber-text-muted line-through">
                    ৳{Number(product.comparePrice || product.price).toLocaleString()}
                  </span>
                )}
                {flashSale && (
                  <span className="bg-berber-error text-white px-2 py-1 text-xs font-bold rounded uppercase tracking-widest">
                    {flashSale.discountType === "PERCENTAGE"
                      ? `${flashSale.discountValue}% off`
                      : `৳${flashSale.discountValue} off`}
                  </span>
                )}
                {!flashSale && product.comparePrice && (
                  <span className="bg-berber-error/10 text-berber-error px-2 py-1 text-xs font-bold rounded uppercase tracking-widest">Sale</span>
                )}
              </div>
              {flashSale && (
                <div className="mt-4">
                  <FlashSaleCountdown
                    saleName={flashSale.name}
                    discountLabel={flashSale.discountType === "PERCENTAGE"
                      ? `${flashSale.discountValue}% off`
                      : `৳${flashSale.discountValue} off`}
                    endsAt={flashSale.endsAt.toISOString()}
                  />
                </div>
              )}
            </div>

            {/* Social proof */}
            <SocialProof productId={product.id} />

            {/* Size quiz */}
            <SizeQuiz />

            {/* Selectors */}
            <VariantSelector
              product={serialize(product)}
              flashSale={flashSale ? serialize(flashSale) : null}
              attr1Label={attrConfig?.attr1Label || "Size"}
              attr2Label={attrConfig?.attr2Label || "Color"}
              categoryId={product.categoryId}
              sizeChartImage={product.sizeChartImage || null}
            />

            {/* Complete the Set */}
            {setBundle && setBundle.items?.length > 0 && (
              <CompleteTheSet
                bundle={setBundle}
                primaryName={product.name}
                primaryPrice={displayPrice}
                primaryColors={Array.from(new Set(product.variants.map((v: any) => v.color).filter(Boolean)))}
              />
            )}

            {/* Product Add-ons */}
            {product.addons.length > 0 && (
              <ProductAddons addons={serialize(product.addons)} productId={product.id} />
            )}

            {/* Accordions for extra info */}
            <div className="mt-12 border-t border-berber-border">
              <Accordion defaultValue={["details"]} className="w-full">
                
                <AccordionItem value="details" className="border-berber-border">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:text-berber-gold hover:no-underline">Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm text-berber-text-muted max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }} />
                    {product.tags && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {product.tags.split(',').map((tag: string) => (
                          <span key={tag.trim()} className="px-3 py-1 bg-berber-muted text-xs text-berber-text-muted rounded-full border border-berber-border">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="delivery" className="border-berber-border">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:text-berber-gold hover:no-underline">Delivery & Returns</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm text-berber-text-muted">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-berber-text">Standard Delivery</p>
                        <p>Delivered within 3–5 working days.{freeShippingThreshold ? ` Free on orders above ৳${freeShippingThreshold.toLocaleString()}.` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-berber-text">Hassle-Free Returns</p>
                        <p>Return any unworn item within 7 days of delivery.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-berber-text">Secure Checkout</p>
                        <p>We accept bKash, Nagad, and Cash on Delivery.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reviews" className="border-berber-border">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:text-berber-gold hover:no-underline">
                    Reviews {reviewAgg._count.rating > 0 && `(${reviewAgg._count.rating})`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ReviewMediaGallery reviews={serialize(reviews)} />
                    <ReviewSection productId={product.id} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="qa" className="border-berber-border">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-widest hover:text-berber-gold hover:no-underline">
                    Questions & Answers {qas.length > 0 && `(${qas.length})`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ProductQA productId={product.id} qas={serialize(qas)} />
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
            
          </div>
        </div>

        {/* Frequently Bought Together */}
        {fbtPairs.length > 0 && (
          <FrequentlyBoughtTogether
            primary={{ id: product.id, name: product.name, slug: product.slug, price: displayPrice, images: serialize(product.images).map((img: any) => ({ url: img.url, alt: img.alt ?? undefined })), variants: serialize(product.variants) }}
            suggestions={fbtPairs.map((p: any) => ({ id: p.secondary.id, name: p.secondary.name, slug: p.secondary.slug, price: Number(p.secondary.price), images: serialize(p.secondary.images), variants: serialize(p.secondary.variants) }))}
          />
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 md:mt-32">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-berber-black mb-10 text-center">Complete The Look</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {serialize(relatedProducts).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        <div className="mt-24 md:mt-32">
          <RecentlyViewed currentProductId={product.id} />
        </div>
      </div>

      {/* Sticky mobile add-to-cart */}
      <StickyAddToCart
        productName={product.name}
        price={displayPrice}
        image={product.images[0]?.url}
      />
    </div>
  )
}
