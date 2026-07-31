"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // The callback route exchanges the PKCE code and sets the session before
    // redirecting here, so we just need to confirm a session exists.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message || "Failed to reset password")
    } else {
      setDone(true)
      setTimeout(() => router.push("/account"), 2000)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-berber-black mb-2">Set New Password</h1>
          <p className="text-sm text-berber-text-muted">Choose a new password for your Berber account.</p>
        </div>

        {done ? (
          <div className="p-6 bg-berber-muted rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-berber-success/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-berber-success" />
            </div>
            <h2 className="font-heading font-bold text-xl">Password Updated</h2>
            <p className="text-sm text-berber-text-muted">Redirecting you to your account...</p>
          </div>
        ) : !ready ? (
          <div className="p-6 bg-berber-muted rounded-2xl text-center space-y-2">
            <p className="text-sm text-berber-text-muted">
              This link is invalid or has expired.{" "}
              <Link href="/forgot-password" className="font-bold text-berber-black hover:text-berber-gold">
                Request a new one
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-berber-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20 transition-all duration-300 rounded-full text-xs disabled:opacity-50"
            >
              {loading ? "Updating..." : <> Update Password <ArrowRight className="w-4 h-4" /> </>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
