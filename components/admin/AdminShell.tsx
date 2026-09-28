"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/admin/Sidebar"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "admin_sidebar_collapsed"

export default function AdminShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1")
    } catch {}
    setHydrated(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafbfc] text-zinc-900 font-sans antialiased">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col bg-[#090a0f] text-white overflow-hidden border-r border-zinc-800/80 transition-[width] duration-200 ease-out z-40 shadow-sm",
          hydrated && collapsed ? "w-[68px]" : "w-[245px]"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.webp"
              alt="Berber Clothing"
              className="h-7 w-auto object-contain brightness-0 invert shrink-0"
            />
            {(!hydrated || !collapsed) && (
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase truncate">
                Admin Console
              </span>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          <Sidebar collapsed={hydrated && collapsed} onToggleCollapsed={toggle} />
        </div>

        {/* Footer info */}
        {(!hydrated || !collapsed) && (
          <div className="shrink-0 border-t border-zinc-800/80 px-3.5 py-2.5 bg-zinc-950/40">
            <p className="text-[10px] text-zinc-500 truncate font-mono">{email}</p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
