import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await prisma.page.findUnique({ where: { slug, isPublished: true } }).catch(() => null)
  if (!page) return {}
  return {
    title: page.title,
    alternates: { canonical: `${SITE_URL}/pages/${slug}` },
  }
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await prisma.page.findUnique({ where: { slug, isPublished: true } }).catch(() => null)
  if (!page) notFound()

  return (
    <div className="bg-berber-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-8 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-berber-black mb-8">{page.title}</h1>
        <div
          className="prose prose-neutral max-w-none prose-headings:font-heading prose-a:text-berber-gold prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  )
}
