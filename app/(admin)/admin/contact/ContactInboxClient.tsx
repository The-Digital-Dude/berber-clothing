"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Mail, 
  MailOpen, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Reply, 
  User, 
  Clock, 
  Inbox, 
  Filter, 
  ShieldCheck, 
  Check, 
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import AdminPagination from "@/components/admin/AdminPagination"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
}

interface ContactInboxClientProps {
  initialMessages: ContactMessage[]
  stats: {
    total: number
    unread: number
    replied: number
    rate: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentSearch: string
  currentFilter: string
}

export default function ContactInboxClient({
  initialMessages,
  stats,
  pagination,
  currentSearch,
  currentFilter,
}: ContactInboxClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [selectedId, setSelectedId] = useState<string | null>(initialMessages[0]?.id ?? null)
  const [search, setSearch] = useState(currentSearch)

  useEffect(() => {
    setMessages(initialMessages)
    setSelectedId(initialMessages[0]?.id ?? null)
  }, [initialMessages])

  // Reply state
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const selectedMessage = messages.find((m) => m.id === selectedId) || messages[0]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/admin/contact?${params.toString()}`, { scroll: false })
  }

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter && filter !== "all") {
      params.set("filter", filter)
    } else {
      params.delete("filter")
    }
    params.set("page", "1")
    router.push(`/admin/contact?${params.toString()}`, { scroll: false })
  }

  // Mark as read / unread
  const toggleRead = async (id: string, currentRead: boolean) => {
    try {
      const newRead = !currentRead
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: newRead }),
      })
      if (!res.ok) throw new Error()
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: newRead } : m))
      )
      toast.success(newRead ? "Marked as read" : "Marked as unread")
      router.refresh()
    } catch {
      toast.error("Failed to update message status")
    }
  }

  // Delete message
  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message?")) return
    try {
      const res = await fetch(`/api/admin/contact?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (selectedId === id) {
        setSelectedId(messages.find((m) => m.id !== id)?.id || null)
      }
      toast.success("Message deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete message")
    }
  }

  // Send Reply Email
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch("/api/admin/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage.id,
          to: selectedMessage.email,
          name: selectedMessage.name,
          subject: selectedMessage.subject || "Regarding your inquiry at Berber Clothing",
          originalMessage: selectedMessage.message,
          replyText: replyText.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send email")

      toast.success("Official email reply dispatched successfully!")
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMessage.id ? { ...m, isReplied: true, isRead: true } : m))
      )
      setReplyText("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not deliver email response.")
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Inquiries</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total.toLocaleString()}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Lifetime contact logs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleFilterChange(currentFilter === "unread" ? "all" : "unread")}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between",
            currentFilter === "unread" ? "border-indigo-400 bg-indigo-50/50" : "border-zinc-200/90 bg-white hover:border-indigo-300"
          )}
        >
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Unread Messages</p>
            <h3 className="text-2xl font-bold text-indigo-900 mt-1">{stats.unread.toLocaleString()}</h3>
            <span className="text-xs text-indigo-700/80 font-medium mt-1 block">Awaiting review</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => handleFilterChange(currentFilter === "replied" ? "all" : "replied")}
          className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between",
            currentFilter === "replied" ? "border-emerald-400 bg-emerald-50/50" : "border-zinc-200/90 bg-white hover:border-emerald-300"
          )}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Replied</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.replied.toLocaleString()}</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Resolved tickets</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Resolution Rate</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.rate}%</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Inquiry to response ratio</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search sender, email, subject, keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: `All (${stats.total})` },
            { key: "unread", label: `Unread (${stats.unread})` },
            { key: "replied", label: `Replied (${stats.replied})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition text-xs whitespace-nowrap",
                currentFilter === tab.key || (!currentFilter && tab.key === "all")
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Message List (Left 5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Inquiries ({pagination.total})
            </span>
          </div>

          <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto max-h-[600px]">
            {messages.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <MailOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-700">No support inquiries found</p>
                <p className="text-xs text-zinc-600 mt-0.5">Try clearing your search query or filters.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isSelected = m.id === selectedId
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id)
                      if (!m.isRead) toggleRead(m.id, false)
                    }}
                    className={cn(
                      "p-4 cursor-pointer transition-colors text-left relative",
                      isSelected ? "bg-zinc-50 border-l-4 border-l-zinc-900" : "hover:bg-zinc-50/60",
                      !m.isRead && "bg-indigo-50/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!m.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                        <span className={cn("text-xs truncate", !m.isRead ? "font-bold text-zinc-900" : "font-semibold text-zinc-800")}>
                          {m.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                        {new Date(m.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <p className={cn("text-xs mt-1 truncate", !m.isRead ? "font-semibold text-zinc-900" : "text-zinc-700")}>
                      {m.subject || "General Customer Inquiry"}
                    </p>

                    <p className="text-[11px] text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                      {m.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100/60 text-[10px]">
                      {m.isReplied && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Replied
                        </span>
                      )}
                      <span className="text-zinc-600 truncate">{m.email}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination at list bottom */}
          <div className="p-3 border-t border-zinc-100 bg-zinc-50/60">
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              basePath="/admin/contact"
            />
          </div>
        </div>

        {/* Message Details / Reply Drawer (Right 7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden flex flex-col min-h-[500px]">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-zinc-900">
                      {selectedMessage.subject || "General Customer Inquiry"}
                    </h2>
                    {selectedMessage.isReplied && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-2.5 h-2.5" /> Replied
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900">{selectedMessage.name}</span>
                    <span>&lt;{selectedMessage.email}&gt;</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {new Date(selectedMessage.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleRead(selectedMessage.id, selectedMessage.isRead)}
                    className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition shadow-2xs"
                    title={selectedMessage.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {selectedMessage.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-zinc-200 hover:border-rose-200 transition shadow-2xs"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-zinc-50/80 p-5 rounded-2xl border border-zinc-200/80 text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedMessage.message}
                </div>

                {selectedMessage.isReplied && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>An official reply has already been sent to this inquiry via email.</span>
                  </div>
                )}
              </div>

              {/* Email Reply Composer */}
              <div className="p-5 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                    <Reply className="w-3.5 h-3.5 text-zinc-900" /> Reply to {selectedMessage.name}
                  </span>
                  <span className="text-[11px] text-zinc-600 font-medium">Delivering to {selectedMessage.email}</span>
                </div>

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Type your response to ${selectedMessage.name}…`}
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition resize-none placeholder:text-zinc-400"
                />

                <div className="flex justify-between items-center">
                  <p className="text-[11px] text-zinc-600">
                    This message will be dispatched from the store&apos;s support email server.
                  </p>
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 rounded-xl shadow-2xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingReply ? "Sending Email…" : "Dispatch Email Reply"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-zinc-400">
              <Mail className="w-12 h-12 stroke-[1.2] mb-3 opacity-40 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-600">Select a message from the list to view and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
