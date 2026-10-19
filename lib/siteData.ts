import { cache } from "react"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"

// The root layout, generateMetadata and the store layout each queried the same
// settings on every request (with the DB in another region, each round trip is
// slow). cache() dedupes within a request; unstable_cache shares across requests
// for 60s, so admin edits show up within a minute.
const fetchSettings = unstable_cache(
  async (keys: string[]) => {
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
    return Object.fromEntries(rows.map((s) => [s.key, s.value])) as Record<string, string>
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] }
)

export const getSettings = cache(async (keys: string[]) => fetchSettings([...keys].sort()))

export const getNavCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: {
        isActive: true,
        showOnNavbar: true,
        parentId: null,
        slug: { notIn: ["waistcoat", "trousers"] },
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, name: true, slug: true, image: true, description: true,
        children: {
          where: { isActive: true, slug: { notIn: ["waistcoat", "trousers"] } },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true, image: true, description: true },
        },
      },
    }),
  ["nav-categories"],
  { revalidate: 60, tags: ["nav-categories"] }
)
