import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Blog", description: "Style tips, lookbooks and news" }

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  }).catch(() => [])

  return (
    <div className="bg-berber-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-heading font-bold text-berber-black mb-2">Journal</h1>
        <p className="text-berber-text-muted mb-10">Style tips, lookbooks and stories</p>

        {posts.length === 0 && (
          <p className="text-berber-text-muted">No posts yet. Check back soon.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <article className="bg-white rounded-2xl overflow-hidden border border-berber-border hover:shadow-lg transition-all duration-300">
                {post.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  {post.category && <span className="text-[10px] font-bold uppercase tracking-widest text-berber-gold">{post.category.name}</span>}
                  <h2 className="text-lg font-heading font-bold text-berber-black mt-1 mb-2 group-hover:text-berber-gold transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-berber-text-muted line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between mt-4 text-xs text-berber-text-muted">
                    <span>{post.authorName}</span>
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}</span>
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
