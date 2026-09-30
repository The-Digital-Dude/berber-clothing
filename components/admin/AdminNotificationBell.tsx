"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, ShoppingCart, PackageX, RotateCcw, Undo2, UserPlus, CheckCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: "new_order" | "low_stock" | "order_cancelled" | "order_returned" | "new_customer"
  title: string
  message: string
  link: string | null
  createdAt: string
  read: boolean
}

const TYPE_ICON: Record<Notification["type"], any> = {
  new_order: ShoppingCart,
  low_stock: PackageX,
  order_cancelled: RotateCcw,
  order_returned: Undo2,
  new_customer: UserPlus,
}

const TYPE_COLOR: Record<Notification["type"], string> = {
  new_order: "bg-emerald-50 text-emerald-600",
  low_stock: "bg-amber-50 text-amber-600",
  order_cancelled: "bg-rose-50 text-rose-600",
  order_returned: "bg-rose-50 text-rose-600",
  new_customer: "bg-blue-50 text-blue-600",
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-BD")
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const d = await res.json()
        setNotifications(d.notifications || [])
        setUnreadCount(d.unreadCount || 0)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // Refresh on page load/navigation only -- no background polling.
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    fetch(`/api/admin/notifications/${id}/read`, { method: "POST" }).catch(() => {})
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    fetch("/api/admin/notifications/read-all", { method: "POST" }).catch(() => {})
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        title="Notifications"
        className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 text-xs animate-in fade-in-50 zoom-in-95 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100">
            <p className="font-semibold text-zinc-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-10 flex items-center justify-center text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-zinc-400">
                <Bell className="w-6 h-6 mx-auto mb-2 text-zinc-200" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-2.5 px-3.5 py-2.5 border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer",
                      !n.read && "bg-amber-50/40"
                    )}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", TYPE_COLOR[n.type])}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-zinc-900 truncate", !n.read && "font-semibold")}>{n.title}</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-zinc-400 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                  </div>
                )

                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
