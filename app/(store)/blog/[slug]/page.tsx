import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import ProductCard from "@/components/store/ProductCard"
import { serialize } from "@/lib/utils"
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    include: { category: true },
  }).catch(() => null)

  if (!post) return { title: "Article Not Found | Berber Clothing" }

  const title = `${post.title} | Berber Clothing Journal`
  const description = post.excerpt || `Read "${post.title}" on the Berber Clothing Style Journal. Expert menswear tailoring and formalwear insights.`
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category?.name || "Style Journal")}&image=${encodeURIComponent(post.coverImage || "")}`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "Berber Clothing",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: true,
      products: { include: { product: { include: { images: true, variants: true, category: true } } } },
    },
  }).catch(() => null)

  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Berber Clothing",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-icon.png`,
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    image: post.coverImage || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  }

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
      ...(post.category ? [{ "@type": "ListItem", position: 3, name: post.category.name, item: `${SITE_URL}/blog?category=${post.category.slug}` }] : []),
      { "@type": "ListItem", position: post.category ? 4 : 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  }

  return (
    <div className="bg-berber-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      {post.coverImage && (
        <div className="relative w-full aspect-[21/9] overflow-hidden">
          <Image src={post.coverImage} alt={post.title} fill sizes="100vw" className="object-cover" priority />
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-4 flex items-center gap-3 text-xs text-berber-text-muted">
          <a href="/blog" className="hover:text-berber-gold transition-colors">Journal</a>
          <span>/</span>
          {post.category && <span className="text-berber-gold font-bold uppercase tracking-widest">{post.category.name}</span>}
        </div>
        <h1 className="text-4xl font-heading font-bold text-berber-black mb-4 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-berber-text-muted mb-10 pb-8 border-b border-berber-border">
          <span>By {post.authorName}</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span>}
          {post.tags && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.split(",").map((t) => (
                <span key={t} className="px-2 py-0.5 bg-berber-muted text-berber-text-muted text-xs rounded">{t.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="prose prose-lg max-w-none text-berber-text" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.products.length > 0 && (
          <div className="mt-16 pt-8 border-t border-berber-border">
            <h2 className="text-2xl font-heading font-bold mb-6">Featured Products in this Story</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serialize(post.products.map((bp) => bp.product)).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
