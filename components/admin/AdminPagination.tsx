"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function AdminPagination({
  page,
  totalPages,
  basePath,
}: {
  page: number
  totalPages: number
  basePath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", p.toString())
    router.push(`${basePath}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between text-xs text-zinc-500">
      <p className="font-medium">
        Page <span className="font-bold text-zinc-800">{page}</span> of{" "}
        <span className="font-bold text-zinc-800">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className="h-8 px-2.5 text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 gap-1 shadow-2xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className="h-8 px-2.5 text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 gap-1 shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
