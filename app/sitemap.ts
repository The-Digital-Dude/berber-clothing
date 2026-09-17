import { MetadataRoute } from "next"
import prisma from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

  const [products, categories, blogs, bundles, collections] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.bundle.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.smartCollection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl,                         lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${siteUrl}/shop`,               lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${siteUrl}/bundles`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${siteUrl}/gift-cards`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/blog`,               lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${siteUrl}/track`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/faq`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/size-guide`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/returns`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/about`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/login`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/register`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/shop/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const bundlePages: MetadataRoute.Sitemap = bundles.map((b) => ({
    url: `${siteUrl}/bundles/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const blogPages: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${siteUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${siteUrl}/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...bundlePages,
    ...blogPages,
    ...collectionPages,
  ]
}
