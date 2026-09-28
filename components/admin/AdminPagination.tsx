"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AdminPaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  basePath?: string
  pageSizeOptions?: number[]
  showPageSize?: boolean
  onBeforeChange?: (nextPage: number, nextSize?: number) => boolean | Promise<boolean>
  onPageChange?: (nextPage: number) => void
  onPageSizeChange?: (nextSize: number) => void
}

export default function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize = 25,
  basePath,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  onBeforeChange,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [pendingTarget, setPendingTarget] = useState<string | number | null>(null)

  const activePath = basePath || pathname

  const handlePageSwitch = async (targetPage: number, targetKey: string | number) => {
    if (isPending || targetPage < 1 || targetPage > totalPages || targetPage === page) return

    if (onBeforeChange) {
      const allowed = await onBeforeChange(targetPage, pageSize)
      if (!allowed) return
    }

    if (onPageChange) {
      onPageChange(targetPage)
      return
    }

    setPendingTarget(targetKey)
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", targetPage.toString())
    startTransition(() => {
      router.push(`${activePath}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSizeSwitch = async (targetSize: number) => {
    if (isPending || targetSize === pageSize) return

    if (onBeforeChange) {
      const allowed = await onBeforeChange(1, targetSize)
      if (!allowed) return
    }

    if (onPageSizeChange) {
      onPageSizeChange(targetSize)
      return
    }

    setPendingTarget("size")
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")
    params.set("limit", targetSize.toString())
    startTransition(() => {
      router.push(`${activePath}?${params.toString()}`, { scroll: false })
    })
  }

  // Calculate range items showing (e.g., "1 to 25 of 120 items")
  const startItem = totalItems !== undefined ? (totalItems === 0 ? 0 : (page - 1) * pageSize + 1) : null
  const endItem = totalItems !== undefined ? Math.min(page * pageSize, totalItems) : null

  // Generate numbered pages with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages)
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages)
    }
    return pages
  }

  if (totalPages <= 1 && (!totalItems || totalItems <= pageSizeOptions[0])) {
    if (!totalItems || totalItems === 0) return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 w-full select-none relative">
      {/* Pending status progress bar at the very top of pagination strip */}
      {isPending && (
        <div className="absolute -top-4 left-0 right-0 h-0.5 bg-amber-100 overflow-hidden rounded-full">
          <div className="h-full bg-amber-500 animate-pulse w-full origin-left" />
        </div>
      )}

      {/* Left side: Item count summary */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {totalItems !== undefined && startItem !== null && endItem !== null ? (
          <p className="font-medium text-zinc-500 flex items-center gap-1.5">
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
            <span>
              Showing <span className="font-bold text-zinc-900">{startItem}</span> to{" "}
              <span className="font-bold text-zinc-900">{endItem}</span> of{" "}
              <span className="font-bold text-zinc-900">{totalItems.toLocaleString()}</span> entries
            </span>
          </p>
        ) : (
          <p className="font-medium text-zinc-500 flex items-center gap-1.5">
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
            <span>
              Page <span className="font-bold text-zinc-900">{page}</span> of{" "}
              <span className="font-bold text-zinc-900">{totalPages || 1}</span>
            </span>
          </p>
        )}

        {/* Page Size Selector */}
        {showPageSize && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200">
            <span className="text-zinc-500 hidden md:inline">Per page:</span>
            <select
              value={pageSize}
              disabled={isPending}
              onChange={(e) => handleSizeSwitch(Number(e.target.value))}
              aria-label="Items per page"
              className="h-7 px-2 text-xs font-semibold rounded-lg bg-white border border-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => handlePageSwitch(1, "first")}
            aria-label="First page"
            className="h-8 w-8 p-0 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 shadow-2xs hidden sm:flex items-center justify-center rounded-lg"
          >
            {isPending && pendingTarget === "first" ? (
              <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
            ) : (
              <ChevronsLeft className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Prev page button */}
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => handlePageSwitch(page - 1, "prev")}
            aria-label="Previous page"
            className="h-8 px-2.5 text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 gap-1 shadow-2xs rounded-lg"
          >
            {isPending && pendingTarget === "prev" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-0.5">
            {getPageNumbers().map((num, idx) => {
              if (num === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-8 flex items-center justify-center text-zinc-400 font-medium text-xs select-none"
                  >
                    …
                  </span>
                )
              }

              const targetNumber = Number(num)
              const isCurrent = targetNumber === page
              const isTargetLoading = isPending && pendingTarget === targetNumber

              return (
                <button
                  key={`page-${num}`}
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePageSwitch(targetNumber, targetNumber)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center shadow-2xs",
                    isCurrent
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-60"
                  )}
                >
                  {isTargetLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  ) : (
                    num
                  )}
                </button>
              )
            })}
          </div>

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => handlePageSwitch(page + 1, "next")}
            aria-label="Next page"
            className="h-8 px-2.5 text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 gap-1 shadow-2xs rounded-lg"
          >
            <span className="hidden sm:inline">Next</span>
            {isPending && pendingTarget === "next" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => handlePageSwitch(totalPages, "last")}
            aria-label="Last page"
            className="h-8 w-8 p-0 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 shadow-2xs hidden sm:flex items-center justify-center rounded-lg"
          >
            {isPending && pendingTarget === "last" ? (
              <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
            ) : (
              <ChevronsRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
