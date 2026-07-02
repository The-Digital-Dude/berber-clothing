import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-berber-bg p-4 text-center">
      <h1 className="text-9xl font-heading font-black text-berber-gold/20 select-none">404</h1>
      
      <div className="space-y-4 -mt-10 relative z-10 bg-berber-bg p-6 rounded-lg max-w-md w-full">
        <h2 className="text-3xl font-heading font-bold text-berber-black">Page Not Found</h2>
        <p className="text-berber-text-muted text-sm">
          We couldn't find the page you were looking for. It might have been removed, renamed, or didn't exist in the first place.
        </p>
        
        <div className="pt-6">
          <Link href="/">
            <Button className="w-full bg-berber-black hover:bg-berber-gold text-white font-bold uppercase tracking-widest text-xs h-12 transition-colors">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
