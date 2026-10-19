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

// Sitewide flash sale shown in the navbar. Returns only plain JSON fields
// (cached values go through JSON, so Dates are pre-serialised to ISO strings).
export const getSitewideSale = unstable_cache(
  async () => {
    const now = new Date()
    const sale = await prisma.flashSale.findFirst({
      where: { scope: "SITEWIDE", isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { createdAt: "desc" },
    })
    if (!sale) return null
    return {
      name: sale.name,
      discountType: sale.discountType as string,
      discountValue: Number(sale.discountValue),
      endsAt: sale.endsAt.toISOString(),
    }
  },
  ["sitewide-sale"],
  { revalidate: 60, tags: ["sitewide-sale"] }
)

// Category tree + brands for the /shop filter sidebar.
export const getShopFilters = unstable_cache(
  async () => {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, slug: { notIn: ["waistcoat", "trousers"] } },
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
    ])
    return { categories, brands }
  },
  ["shop-filters"],
  { revalidate: 60, tags: ["shop-filters"] }
)
