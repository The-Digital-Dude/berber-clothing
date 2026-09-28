"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/admin/Sidebar"

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
    <div className="flex h-screen w-full overflow-hidden bg-[#f4f5f7]">
      {/* Sidebar */}
      <aside
        className="hidden md:flex shrink-0 flex-col bg-[#0f1117] text-white overflow-hidden border-r border-white/5 transition-[width] duration-200"
        style={{ width: hydrated && collapsed ? 68 : 240 }}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-white/8">
          <img src="/logo.webp" alt="Berber Clothing" className="h-8 w-auto object-contain brightness-0 invert" />
          {!collapsed && (
            <span className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase ml-auto">Admin</span>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <Sidebar collapsed={collapsed} onToggleCollapsed={toggle} />
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 border-t border-white/8 px-4 py-2.5">
            <p className="text-[10px] text-slate-600 truncate">{email}</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
