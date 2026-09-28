import prisma from "@/lib/prisma"
import { CategoryClient } from "./CategoryClient"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { products: true } },
        },
      },
      attributeConfig: true,
      _count: { select: { products: true, children: true } },
    },
  })

  const formatted = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: c.image || "",
    parentId: c.parentId || null,
    parent: c.parent ? { id: c.parent.id, name: c.parent.name, slug: c.parent.slug } : null,
    isActive: c.isActive,
    showOnNavbar: c.showOnNavbar,
    showOnHomepage: c.showOnHomepage,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    childrenCount: c._count.children,
    children: (c.children || []).map((ch) => ({
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      description: ch.description || "",
      image: ch.image || "",
      parentId: ch.parentId || c.id,
      isActive: ch.isActive,
      showOnNavbar: ch.showOnNavbar,
      showOnHomepage: ch.showOnHomepage,
      sortOrder: ch.sortOrder,
      productCount: ch._count?.products || 0,
    })),
  }))


  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Category Catalog</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {categories.length} categories
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage navigation taxonomies, display flags (Navbar / Homepage), category images, and size guides
          </p>
        </div>
      </div>
      <CategoryClient data={formatted} />
    </div>
  )
}
