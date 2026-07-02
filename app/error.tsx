"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-berber-bg p-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-berber-border space-y-6">
        <div className="w-16 h-16 bg-berber-error/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-berber-error" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-berber-black">Something went wrong!</h2>
          <p className="text-berber-text-muted text-sm">
            We encountered an unexpected error. Please try again or contact support if the issue persists.
          </p>
        </div>

        <div className="pt-4 flex gap-4 justify-center">
          <Button 
            onClick={() => reset()}
            className="bg-berber-black hover:bg-berber-gold text-white font-bold uppercase tracking-widest text-xs h-12 px-8 transition-colors"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="font-bold uppercase tracking-widest text-xs h-12 px-8"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
