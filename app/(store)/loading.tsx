import { Loader2 } from "lucide-react"

// Shown instantly on every in-store navigation (the navbar/footer stay put),
// so a click always has visible feedback and the old page can't be re-clicked.
export default function StoreLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] bg-berber-bg text-berber-black"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-berber-gold" />
        <p className="text-xs uppercase tracking-widest text-berber-text-muted font-bold animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
