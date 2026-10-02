import prisma from "@/lib/prisma"
import ShopFilters from "@/components/store/ShopFilters"
import ShopTopControls from "@/components/store/ShopTopControls"
import ShopProductGrid from "@/components/store/ShopProductGrid"
import ShopHeading from "@/components/store/ShopHeading"
import { Suspense } from "react"
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; search?: string; sort?: string }>
}): Promise<Metadata> {
  const { category, brand, search } = await searchParams

  if (search) {
    return {
      title: `Search: "${search}" | Berber Clothing`,
      description: `Browse search results for "${search}" at Berber Clothing. Modern formalwear in Bangladesh.`,
      robots: { index: false, follow: true },
    }
  }

  let title = "Shop Men's Formalwear, Suits & Blazers | Berber Clothing"
  let description = "Explore premium 2-piece suits, 3-piece suits, blazers, and luxury formalwear in Bangladesh. Free delivery above ৳5000 and Cash on Delivery available."
  let canonicalUrl = `${SITE_URL}/shop`

  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category, isActive: true },
      select: { name: true, description: true },
    }).catch(() => null)

    if (cat) {
      title = `${cat.name} — Buy Online in Bangladesh | Berber Clothing`
      description = cat.description || `Shop exclusive ${cat.name} online at Berber Clothing. Premium tailoring, fast delivery in Dhaka and all Bangladesh.`
      canonicalUrl = `${SITE_URL}/shop?category=${encodeURIComponent(category)}`
    }
  } else if (brand) {
    const br = await prisma.brand.findUnique({
      where: { slug: brand, isActive: true },
      select: { name: true },
    }).catch(() => null)

    if (br) {
      title = `${br.name} Collection | Berber Clothing`
      description = `Shop authentic ${br.name} collection at Berber Clothing. Modern menswear, blazers, and suits.`
      canonicalUrl = `${SITE_URL}/shop?brand=${encodeURIComponent(brand)}`
    }
  }

  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(category ? `${category.toUpperCase()} Collection` : "Modern Formalwear")}&category=Curated%20Catalog`

  return {
    title,
    description,
    keywords: ["suits Bangladesh", "buy blazer Dhaka", "mens formalwear BD", "mens clothing online Bangladesh", "Cash on Delivery suits"],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Berber Clothing",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Berber Clothing Shop",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [categories, brands, activeCategory] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
        slug: { notIn: ["waistcoat", "trousers"] },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true, slug: { notIn: ["waistcoat", "trousers"] } },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true },
        },
      },
    }).catch(() => []),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }).catch(() => []),
    category ? prisma.category.findUnique({ where: { slug: category } }).catch(() => null) : null,
  ])

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(activeCategory ? [{ "@type": "ListItem", position: 3, name: activeCategory.name, item: `${SITE_URL}/shop?category=${activeCategory.slug}` }] : []),
    ],
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: activeCategory ? `${activeCategory.name} Collection` : "Men's Formalwear Collection",
    url: `${SITE_URL}/shop${category ? `?category=${category}` : ""}`,
    description: activeCategory?.description || "Curated modern formalwear and suits by Berber Clothing.",
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-berber-border pb-6 mb-8 gap-4">
        <Suspense fallback={<div className="h-16 bg-berber-muted rounded-xl animate-pulse w-48" />}>
          <ShopHeading categories={categories as any} />
        </Suspense>
        <Suspense fallback={null}>
          <ShopTopControls />
        </Suspense>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
          <ShopFilters categories={categories as any} brands={brands as any} />
        </Suspense>

        <Suspense fallback={
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-berber-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        }>
          <ShopProductGrid />
        </Suspense>
      </div>
    </div>
  )
}
