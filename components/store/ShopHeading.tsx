"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useTransition, useMemo } from "react"
import Link from "next/link"
import { Layers, ChevronRight, Sparkles } from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
  parentId?: string | null
  parent?: { id: string; name: string; slug: string } | null
  children?: Category[]
}

export default function ShopHeading({ categories = [] }: { categories?: Category[] }) {
  const sp = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const search = sp.get("search") || ""
  const activeSlug = sp.get("category") || ""
  const isSale = sp.get("sale") === "true"

  // Find active category
  const { activeCategory, parentCategory, subcategories } = useMemo(() => {
    if (!activeSlug) return { activeCategory: null, parentCategory: null, subcategories: [] as Category[] }

    const match = categories.find((c) => c.slug === activeSlug)
    if (!match) return { activeCategory: null, parentCategory: null, subcategories: [] as Category[] }

    if (match.parentId) {
      // It's a subcategory
      const parent = categories.find((c) => c.id === match.parentId) || (match.parent as Category | undefined)
      const siblings = categories.filter((c) => c.parentId === match.parentId)
      const subs: Category[] = siblings.length > 0 ? siblings : ((parent as Category | undefined)?.children || [])
      return {
        activeCategory: match,
        parentCategory: parent || null,
        subcategories: subs,
      }
    } else {
      // It's a top-level parent category
      const subs = categories.filter((c) => c.parentId === match.id)
      return {
        activeCategory: match,
        parentCategory: null,
        subcategories: (subs.length > 0 ? subs : (match.children || [])) as Category[],
      }
    }
  }, [categories, activeSlug])

  function selectCategory(slug: string) {
    startTransition(() => {
      const p = new URLSearchParams(sp.toString())
      if (slug) {
        p.set("category", slug)
      } else {
        p.delete("category")
      }
      p.delete("page")
      router.replace(`/shop?${p.toString()}`, { scroll: false })
    })
  }

  // Determine Title
  let title = "Shop All"
  if (search) title = `Search: "${search}"`
  else if (isSale) title = "Sale Collection"
  else if (activeCategory) {
    title = parentCategory ? `${activeCategory.name}` : activeCategory.name
  }

  const effectiveParent = parentCategory || (activeCategory && !activeCategory.parentId ? activeCategory : null)

  return (
    <div className="space-y-4">
      {/* Breadcrumb if in subcategory or category */}
      {effectiveParent && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <button
            onClick={() => selectCategory("")}
            className="hover:text-amber-700 transition-colors"
          >
            Shop
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <button
            onClick={() => selectCategory(effectiveParent.slug)}
            className={activeCategory?.id === effectiveParent.id ? "font-bold text-zinc-900" : "hover:text-amber-700 transition-colors"}
          >
            {effectiveParent.name}
          </button>
          {parentCategory && activeCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-bold text-zinc-900">{activeCategory.name}</span>
            </>
          )}
        </div>
      )}

      <div>
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-berber-black tracking-tight">
          {title}
        </h1>
      </div>

      {/* Subcategory Filter Pills Bar */}
      {effectiveParent && subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => selectCategory(effectiveParent.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSlug === effectiveParent.slug
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700"
            }`}
          >
            All {effectiveParent.name}
          </button>

          {subcategories.map((sub) => {
            const isSubActive = activeSlug === sub.slug
            return (
              <button
                key={sub.id}
                onClick={() => selectCategory(sub.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSubActive
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700"
                }`}
              >
                {sub.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
