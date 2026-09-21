"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ShoppingCart, Bell, Menu, ChevronDown, LogOut, Settings, ExternalLink, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/admin/Sidebar"
import { cn } from "@/lib/utils"

type SearchResult = {
  type: "order" | "product" | "customer"
  id: string
  label: string
  sub: string
  href: string
}

const typePill: Record<string, string> = {
  order: "bg-blue-100 text-blue-700",
  product: "bg-emerald-100 text-emerald-700",
  customer: "bg-violet-100 text-violet-700",
}

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        if (res.ok) { const d = await res.json(); setResults(d.results || []); setOpen(true) }
      } finally { setLoading(false) }
    }, 250)
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const go = (href: string) => { setQuery(""); setOpen(false); router.push(href) }

  return (
    <header className="h-14 flex items-center gap-3 bg-white border-b border-gray-200 px-4 lg:px-5 shrink-0 z-20">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger render={
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors md:hidden">
            <Menu className="w-5 h-5" />
          </button>
        } />
        <SheetContent side="left" className="p-0 w-[240px] bg-[#0f1117]">
          <div className="flex h-14 items-center border-b border-white/8 px-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-black text-[#0f1117]">B</div>
              <span className="text-sm font-bold text-white tracking-wider">BERBER</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Global search */}
      <div ref={searchRef} className="relative flex-1 max-w-lg">
        <div className="relative flex items-center">
          {loading
            ? <Loader2 className="absolute left-3 w-4 h-4 text-gray-400 animate-spin pointer-events-none" />
            : <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          }
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search orders, products, customers…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 focus:bg-white transition-all"
          />
          <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 font-mono border border-gray-200 rounded px-1.5 py-0.5 bg-white">
            ⌘K
          </kbd>
        </div>

        {open && (
          <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 overflow-hidden">
            {!loading && results.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No results for "{query}"</div>
            )}
            {results.map(r => (
              <button key={r.href} onClick={() => go(r.href)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <span className={cn("text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0", typePill[r.type])}>
                  {r.type}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">{r.label}</span>
                  <span className="block text-xs text-gray-400 truncate">{r.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* New order quick button */}
        <Link href="/admin/orders/new"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <ShoppingCart className="w-3.5 h-3.5" />
          New Order
        </Link>

        {/* View store */}
        <Link href="/" target="_blank"
          className="hidden lg:flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          Store
        </Link>

        {/* Notifications placeholder */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-[10px] font-black text-white uppercase">
              {email?.[0] ?? "A"}
            </div>
            <span className="hidden lg:block text-xs font-medium text-gray-700 max-w-[120px] truncate">{email}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold text-gray-900 truncate">{email}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider">Administrator</p>
              </div>
              <Link href="/admin/settings" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>
              <Link href="/" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                View Store
              </Link>
              <div className="border-t border-gray-100" />
              <Link href="/api/auth/signout"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
