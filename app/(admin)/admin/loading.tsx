import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
