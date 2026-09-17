import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)
  return { title: `#${tag} — Blog`, description: `Posts tagged with ${tag}` }
}

export default async function BlogTagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)

  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      tags: { contains: tag },
    },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, tags: true },
  })

  if (posts.length === 0) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/blog" className="text-sm text-gray-500 hover:underline mb-2 inline-block">&larr; All posts</Link>
        <h1 className="text-3xl font-bold">#{tag}</h1>
        <p className="text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.id} className="flex gap-6">
            {post.coverImage && (
              <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="font-semibold text-lg hover:underline line-clamp-2">{post.title}</h2>
              </Link>
              {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags?.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <Link key={t} href={`/blog/tag/${encodeURIComponent(t)}`} className={`text-xs px-2 py-0.5 rounded-full ${t === tag ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
