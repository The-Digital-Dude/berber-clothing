import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

export const metadata: Metadata = {
  title: "Style Journal, Lookbooks & Tailoring Guides | Berber Clothing",
  description: "Read expert menswear styling guides, lookbooks, fabric advice, and modern suit etiquette from Berber Clothing in Bangladesh.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Style Journal & Menswear Lookbooks | Berber Clothing",
    description: "Read expert menswear styling guides, lookbooks, and modern suit etiquette.",
    url: `${SITE_URL}/blog`,
    siteName: "Berber Clothing",
    images: [
      {
        url: `${SITE_URL}/api/og?title=Style%20Journal%20%26%20Lookbooks&category=Editorial`,
        width: 1200,
        height: 630,
        alt: "Berber Journal",
      },
    ],
  },
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  }).catch(() => [])

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Berber Clothing Style Journal",
    url: `${SITE_URL}/blog`,
    description: "Expert menswear styling guides, lookbooks, and modern suit etiquette.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  }

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
    ],
  }

  return (
    <div className="bg-berber-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-heading font-bold text-berber-black mb-2">Journal</h1>
        <p className="text-berber-text-muted mb-10">Style tips, lookbooks and modern formalwear stories</p>

        {posts.length === 0 && (
          <p className="text-berber-text-muted">No posts yet. Check back soon.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <article className="bg-white rounded-2xl overflow-hidden border border-berber-border hover:shadow-lg transition-all duration-300">
                {post.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5">
                  {post.category && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-berber-gold">
                      {post.category.name}
                    </span>
                  )}
                  <h2 className="text-lg font-heading font-bold text-berber-black mt-1 mb-2 group-hover:text-berber-gold transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && <p className="text-sm text-berber-text-muted line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between mt-4 text-xs text-berber-text-muted">
                    <span>{post.authorName}</span>
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }) : ""}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
