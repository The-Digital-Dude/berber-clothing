"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleOAuth(provider: "google" | "facebook") {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!name) newErrors.name = "Full Name is required"
    if (!email) newErrors.email = "Email Address is required"
    if (!phone) newErrors.phone = "Phone Number is required"
    if (!password) newErrors.password = "Password is required"
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      })

      if (error) {
        toast.error(error.message || "Registration failed")
        return
      }
      if (!data.user) {
        toast.error("Registration failed")
        return
      }

      // Create the matching Prisma profile + sync role into app_metadata
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.user.id, name, email, phone }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || "Failed to set up account")
        return
      }

      if (data.session) {
        toast.success("Welcome to Berber! 🎉")
        router.push("/account")
        router.refresh()
      } else {
        toast.success("Account created! Check your email to confirm, then sign in.")
        router.push("/login")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col md:flex-row-reverse animate-in fade-in duration-500">

      {/* Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-24 bg-berber-surface">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-berber-black mb-2">Create Account</h1>
            <p className="text-sm text-berber-text-muted">Join the Berber Club to start earning rewards.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); if(errors.name) setErrors(prev => ({...prev, name: ""})) }}
                className={`w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if(errors.email) setErrors(prev => ({...prev, email: ""})) }}
                className={`w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); if(errors.phone) setErrors(prev => ({...prev, phone: ""})) }}
                placeholder="01XXXXXXXXX"
                className={`w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-berber-text-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); if(errors.password) setErrors(prev => ({...prev, password: ""})) }}
                placeholder="Minimum 8 characters"
                className={`w-full bg-berber-muted border border-transparent focus:border-berber-gold focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-berber-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20 transition-all duration-300 rounded-full text-xs disabled:opacity-50"
            >
              {loading ? "Creating Account..." : <> Create Account <ArrowRight className="w-4 h-4" /> </>}
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-berber-border" />
            <span className="text-[10px] uppercase tracking-widest text-berber-text-muted">Or continue with</span>
            <div className="flex-1 h-px bg-berber-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="py-3 border border-berber-border rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:border-berber-black transition-colors disabled:opacity-50"
            >
              {oauthLoading === "google" ? "Redirecting..." : "Google"}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={oauthLoading !== null}
              className="py-3 border border-berber-border rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:border-berber-black transition-colors disabled:opacity-50"
            >
              {oauthLoading === "facebook" ? "Redirecting..." : "Facebook"}
            </button>
          </div>

          <p className="text-center text-sm text-berber-text-muted pt-4 border-t border-berber-border">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-berber-black hover:text-berber-gold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Image Side */}
      <div className="hidden md:block w-1/2 relative bg-berber-muted overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1920&auto=format&fit=crop"
          alt="Berber Fashion"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-heading font-bold mb-4">Unapologetic Style.</h2>
          <p className="text-lg opacity-90">
            Sign up to get 10% off your first order and start earning Berber Club points.
          </p>
        </div>
      </div>
    </div>
  )
}
