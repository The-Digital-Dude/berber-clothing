import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound, redirect } from "next/navigation"
import ProductGallery from "@/components/store/ProductGallery"
import VariantSelector from "@/components/store/VariantSelector"
import DynamicProductHeader from "@/components/store/DynamicProductHeader"
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
import StickyAddToCart from "@/components/store/StickyAddToCart"
import TrackPageView from "@/components/store/TrackPageView"
import ViewContentTracker from "@/components/store/ViewContentTracker"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Truck, RefreshCw, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import { getActiveFlashSale, applyFlashSaleDiscount } from "@/lib/flashSale"
import Link from "next/link"
import { getSuitGarment } from "@/lib/suitPurchasePolicy"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

function extractColorPart(name: string): string {
  const dashParts = name.split(/[–—-]/)
  if (dashParts.length > 1) {
    return dashParts[dashParts.length - 1].trim()
  }
  const commonColors = [
    "Light Grey", "Dark Grey", "Slate Grey", "Charcoal", "Grey", "Gray",
    "Navy Blue", "Navy", "Royal Blue", "Midnight Blue", "Blue",
    "Jet Black", "Black",
    "Olive Green", "Sage Green", "Forest Green", "Green",
    "Beige", "Tan", "Camel", "Cream", "Brown", "Burgundy", "Maroon"
  ]
  const found = commonColors.find((c) => name.toLowerCase().includes(c.toLowerCase()))
  return found || ""
}

function isTrouserOrWaistcoat(product: any): { isTrouser: boolean; isWaistcoat: boolean } {
  const catSlug = product.category?.slug?.toLowerCase() || ""
  const pSlug = product.slug?.toLowerCase() || ""
  const pName = product.name?.toLowerCase() || ""

  const isTrouser =
    catSlug.includes("trouser") ||
    catSlug.includes("pant") ||
    pSlug.includes("trouser") ||
    pName.includes("trouser") ||
    pName.includes("pant")

  const isWaistcoat =
    catSlug.includes("waistcoat") ||
    catSlug.includes("vest") ||
    pSlug.includes("waistcoat") ||
    pName.includes("waistcoat") ||
    pName.includes("vest")

  return { isTrouser, isWaistcoat }
}

async function findMatchingBlazer(product: any): Promise<string | null> {
  // 1. Direct bundle relation: if this trouser/waistcoat is in a set bundle, return the primary blazer
  const directBlazer = product.bundleItems?.find(
    (b: any) => b.bundle?.primaryProduct?.isActive && b.bundle?.primaryProduct?.slug
  )?.bundle?.primaryProduct
  if (directBlazer?.slug) return directBlazer.slug

  // 2. Match by color and tier
  const colorPart = extractColorPart(product.name)
  const isStudent = product.name.toLowerCase().includes("student")
  const isSignature = product.name.toLowerCase().includes("signature")

  const andConditions: any[] = []
  if (colorPart) andConditions.push({ name: { contains: colorPart, mode: "insensitive" as const } })
  if (isStudent) andConditions.push({ name: { contains: "Student", mode: "insensitive" as const } })
  if (isSignature) andConditions.push({ name: { contains: "Signature", mode: "insensitive" as const } })

  const matchingBlazer = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [
        { category: { slug: { in: ["blazer", "blazers"] } } },
        { category: { name: { contains: "blazer", mode: "insensitive" as const } } },
        { name: { contains: "blazer", mode: "insensitive" as const } },
      ],
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    },
    select: { slug: true },
  }).catch(() => null)

  if (matchingBlazer?.slug) return matchingBlazer.slug

  // 3. Fallback: match by color alone
  if (colorPart) {
    const colorBlazer = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { category: { slug: { in: ["blazer", "blazers"] } } },
          { category: { name: { contains: "blazer", mode: "insensitive" as const } } },
          { name: { contains: "blazer", mode: "insensitive" as const } },
        ],
        name: { contains: colorPart, mode: "insensitive" as const },
      },
      select: { slug: true },
    }).catch(() => null)
    if (colorBlazer?.slug) return colorBlazer.slug
  }

  // 4. Fallback: any active blazer
  const anyBlazer = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [
        { category: { slug: { in: ["blazer", "blazers"] } } },
        { category: { name: { contains: "blazer", mode: "insensitive" as const } } },
        { name: { contains: "blazer", mode: "insensitive" as const } },
      ],
    },
    select: { slug: true },
  }).catch(() => null)

  return anyBlazer?.slug || null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  let product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      category: true,
      bundleItems: {
        include: {
          bundle: {
            include: {
              primaryProduct: { select: { slug: true, isActive: true } },
            },
          },
        },
      },
    },
  }).catch(() => null)

  if (!product) {
    product = await prisma.product.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" as const }, isActive: true },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        bundleItems: {
          include: {
            bundle: {
              include: {
                primaryProduct: { select: { slug: true, isActive: true } },
              },
            },
          },
        },
      },
    }).catch(() => null)
  }

  if (product) {
    const { isTrouser, isWaistcoat } = isTrouserOrWaistcoat(product)
    if (isTrouser || isWaistcoat) {
      const blazerSlug = await findMatchingBlazer(product)
      if (blazerSlug) {
        redirect(`/shop/${blazerSlug}?package=${isTrouser ? "2-piece" : "3-piece"}`)
      }
    }
  }

  if (!product) return { title: "Product Not Found | Berber Clothing" }

  const rawImage = (product as any).ogImage || product.images[0]?.url || ""
  const price = Number(product.price).toLocaleString()
  const title = (product as any).seoTitle || `${product.name} — ৳${price} | Cash on Delivery in Bangladesh | Berber Clothing`
  const description = (product as any).seoDescription || product.description || `Buy ${product.name} online at ৳${price} in Bangladesh. Premium modern formalwear with express delivery and Cash on Delivery.`
  const keywords = (product as any).seoKeywords || [product.name, product.category?.name || "Menswear", "Bangladesh suits", "mens formalwear BD", "buy blazer Bangladesh", "Cash on Delivery BD"]

  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(product.name)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(rawImage)}&category=${encodeURIComponent(product.category?.name || "Modern Formalwear")}`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}/shop/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/${slug}`,
      siteName: "Berber Clothing",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${product.name} — Berber Clothing`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ package?: string }>
}) {
  const { slug } = await params;
  const { package: initialPackageParam } = (await searchParams) || {};
  
  let product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      brand: true,
      addons: { orderBy: { sortOrder: 'asc' } },
      bundleItems: {
        include: {
          bundle: {
            include: {
              primaryProduct: { select: { slug: true, isActive: true } },
            },
          },
        },
      },
      setBundle: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  variants: { orderBy: { size: 'asc' } },
                  images: true,
                },
              },
            },
          },
        },
      },
    }
  }).catch(() => null)

  if (!product) {
    product = await prisma.product.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" as const }, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        brand: true,
        addons: { orderBy: { sortOrder: 'asc' } },
        bundleItems: {
          include: {
            bundle: {
              include: {
                primaryProduct: { select: { slug: true, isActive: true } },
              },
            },
          },
        },
        setBundle: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    variants: { orderBy: { size: 'asc' } },
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    }).catch(() => null)
  }

  // Recovery: If product not found directly and the requested slug contained blazer/colors
  // (e.g. from an old or broken redirect), try finding the intended blazer
  if (!product) {
    const colorWords = [
      "light-grey", "dark-grey", "slate-grey", "charcoal", "grey", "gray",
      "navy-blue", "royal-blue", "midnight-blue", "navy", "blue",
      "jet-black", "black",
      "olive-green", "sage-green", "forest-green", "green",
      "beige", "tan", "cream", "brown", "burgundy", "maroon"
    ]
    const matched = colorWords.find((c) => slug.toLowerCase().includes(c))
    if (matched) {
      const cleanColor = matched.replace(/-/g, " ")
      const candidateBlazer = await prisma.product.findFirst({
        where: {
          isActive: true,
          OR: [
            { category: { slug: { in: ["blazer", "blazers"] } } },
            { category: { name: { contains: "blazer", mode: "insensitive" as const } } },
            { name: { contains: "blazer", mode: "insensitive" as const } },
          ],
          name: { contains: cleanColor, mode: "insensitive" as const },
        },
        select: { slug: true },
      }).catch(() => null)
      if (candidateBlazer) {
        redirect(`/shop/${candidateBlazer.slug}`)
      }
    }

    notFound()
  }

  // Trousers and waistcoats are catalog components, not standalone offers.
  // Route them to the matching blazer configurator with the correct suit package pre-selected.
  const { isTrouser, isWaistcoat } = isTrouserOrWaistcoat(product)
  if (isTrouser || isWaistcoat) {
    const blazerSlug = await findMatchingBlazer(product)
    if (blazerSlug) {
      redirect(`/shop/${blazerSlug}?package=${isTrouser ? "2-piece" : "3-piece"}`)
    } else {
      redirect("/shop")
    }
  }

  // For Blazer products: discover matching Waistcoat and Trouser sibling products
  let waistcoatFromBundle: any = null
  let trouserFromBundle: any = null
  if (product.setBundle?.items) {
    for (const item of product.setBundle.items) {
      const p = item.product
      const { isTrouser: itemTrouser, isWaistcoat: itemWaistcoat } = isTrouserOrWaistcoat(p)
      if (itemWaistcoat && !waistcoatFromBundle) {
        waistcoatFromBundle = p
      } else if (itemTrouser && !trouserFromBundle) {
        trouserFromBundle = p
      }
    }
  }

  const colorPart = extractColorPart(product.name)
  const isStudent = product.name.toLowerCase().includes("student")

  const [matchingWaistcoat, matchingTrouser, reviewAgg, flashSale, attrConfig, reviews, qas] = await Promise.all([
    !waistcoatFromBundle && colorPart
      ? prisma.product.findFirst({
          where: {
            isActive: true,
            OR: [
              { category: { slug: { in: ["waistcoat", "waistcoats"] } } },
              { category: { name: { contains: "waistcoat", mode: "insensitive" as const } } },
              { name: { contains: "waistcoat", mode: "insensitive" as const } },
            ],
            AND: [
              { name: { contains: colorPart, mode: "insensitive" as const } },
              { name: { contains: isStudent ? "Student" : "Signature", mode: "insensitive" as const } },
            ],
          },
          include: { variants: { orderBy: { size: "asc" } }, images: true },
        }).catch(() => null)
      : Promise.resolve(null),
    !trouserFromBundle && colorPart
      ? prisma.product.findFirst({
          where: {
            isActive: true,
            OR: [
              { category: { slug: { in: ["trouser", "trousers", "pants", "pant"] } } },
              { category: { name: { contains: "trouser", mode: "insensitive" as const } } },
              { name: { contains: "trouser", mode: "insensitive" as const } },
            ],
            AND: [
              { name: { contains: colorPart, mode: "insensitive" as const } },
              { name: { contains: isStudent ? "Student" : "Signature", mode: "insensitive" as const } },
            ],
          },
          include: { variants: { orderBy: { size: "asc" } }, images: true },
        }).catch(() => null)
      : Promise.resolve(null),
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
      include: { media: true, user: { select: { name: true } } },
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
  const hasCompareDiscount = Number(product.comparePrice) > Number(product.price)

  // Fetch related products, FBT suggestions, and settings in parallel
  const [relatedProducts, fbtPairs, shippingSettings] = await Promise.all([
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
  ])

  const settingsMap = Object.fromEntries(shippingSettings.map((s: any) => [s.key, s.value]))
  const freeShippingThreshold = settingsMap.free_shipping_above ? Number(settingsMap.free_shipping_above) : null

  const productUrl = `${SITE_URL}/shop/${product.slug}`
  const priceValidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku || product.id,
    url: productUrl,
    brand: { "@type": "Brand", name: product.brand?.name || "Berber" },
    category: product.category?.name || undefined,
    ...(reviewAgg._count.rating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (reviewAgg._avg.rating || 0).toFixed(1),
        reviewCount: reviewAgg._count.rating,
      },
    }),
    ...(reviews.length > 0 && {
      review: reviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: (r as any).user?.name || "Verified Buyer" },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        ...(r.comment && { reviewBody: r.comment }),
        datePublished: r.createdAt.toISOString().slice(0, 10),
      })),
    }),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: Number(product.price),
      highPrice: hasCompareDiscount ? Number(product.comparePrice) : Number(product.price),
      offerCount: product.variants.length || 1,
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
      seller: { "@type": "Organization", name: product.brand?.name || "Berber Clothing", url: SITE_URL },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 60,
          currency: "BDT",
          ...(freeShippingThreshold && { freeShippingThreshold: { "@type": "MonetaryAmount", value: freeShippingThreshold, currency: "BDT" } }),
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
        applicableCountry: "BD",
      },
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(product.category ? [{ "@type": "ListItem", position: 3, name: product.category.name, item: `${SITE_URL}/shop?category=${product.category.slug}` }] : []),
      { "@type": "ListItem", position: product.category ? 4 : 3, name: product.name, item: productUrl },
    ],
  }

  return (
    <div className="bg-berber-bg animate-in fade-in duration-500">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <RecordView product={{ id: product.id, name: product.name, slug: product.slug, price: displayPrice, comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, image: product.images[0]?.url }} />
      <TrackPageView productId={product.id} />
      <ViewContentTracker product={{ id: product.id, name: product.name, price: displayPrice, category: product.category?.name }} />

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

            {/* Title & Live Price Header */}
            <DynamicProductHeader
              productName={product.name}
              initialPrice={displayPrice}
              initialComparePrice={product.comparePrice ? Number(product.comparePrice) : null}
              brand={product.brand ? { name: product.brand.name, slug: product.brand.slug } : null}
              reviewRating={reviewAgg._avg.rating || 0}
              reviewCount={reviewAgg._count.rating}
              flashSale={flashSale ? serialize(flashSale) : null}
            />
            {flashSale && (
              <div className="mb-6">
                <FlashSaleCountdown
                  saleName={flashSale.name}
                  discountLabel={flashSale.discountType === "PERCENTAGE"
                    ? `${flashSale.discountValue}% off`
                    : `৳${flashSale.discountValue} off`}
                  endsAt={flashSale.endsAt.toISOString()}
                />
              </div>
            )}

            {/* Social proof */}
            <SocialProof productId={product.id} />

            {/* Selectors */}
            <VariantSelector
              product={serialize(product)}
              flashSale={flashSale ? serialize(flashSale) : null}
              attr1Label={attrConfig?.attr1Label || "Size"}
              attr2Label={attrConfig?.attr2Label || "Color"}
              categoryId={product.categoryId}
              sizeChartImage={product.sizeChartImage || null}
              matchingSet={{
                waistcoat: (waistcoatFromBundle || matchingWaistcoat) ? serialize(waistcoatFromBundle || matchingWaistcoat) : null,
                trouser: (trouserFromBundle || matchingTrouser) ? serialize(trouserFromBundle || matchingTrouser) : null,
              }}
              initialPackage={initialPackageParam}
            />

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
            primary={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: displayPrice,
              images: serialize(product.images).map((img: any) => ({ url: img.url, alt: img.alt ?? undefined })),
              variants: product.variants.map((v: any) => ({
                id: v.id,
                size: v.size,
                color: v.color,
                stock: v.stock,
                price: v.price ? Number(v.price) : null,
              })),
            }}
            suggestions={fbtPairs.map((p: any) => ({
              id: p.secondary.id,
              name: p.secondary.name,
              slug: p.secondary.slug,
              price: Number(p.secondary.price),
              images: serialize(p.secondary.images),
              variants: p.secondary.variants.map((v: any) => ({
                id: v.id,
                size: v.size,
                color: v.color,
                stock: v.stock,
                price: v.price ? Number(v.price) : null,
              })),
              discountPct: Number(p.discountPct || 0),
            }))}
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
