"use client"

import { useState, useMemo } from "react"
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
  AlertCircle,
  Inbox,
  Filter,
  MessageSquare,
  ShieldCheck,
  Check
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

export default function ContactInboxClient({
  initialMessages,
  initialUnreadCount,
}: {
  initialMessages: ContactMessage[]
  initialUnreadCount: number
}) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [selectedId, setSelectedId] = useState<string | null>(initialMessages[0]?.id ?? null)
  const [filter, setFilter] = useState<"all" | "unread" | "replied">("all")
  const [search, setSearch] = useState("")

  // Reply state
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const selectedMessage = messages.find((m) => m.id === selectedId)

  const stats = useMemo(() => {
    const total = messages.length
    const replied = messages.filter((m) => m.isReplied).length
    const unread = messages.filter((m) => !m.isRead).length
    const rate = total > 0 ? Math.round((replied / total) * 100) : 0
    return { total, replied, unread, rate }
  }, [messages])

  // Filter & Search
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter === "unread" && m.isRead) return false
      if (filter === "replied" && !m.isReplied) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = m.name.toLowerCase().includes(q)
        const matchEmail = m.email.toLowerCase().includes(q)
        const matchSub = (m.subject || "").toLowerCase().includes(q)
        const matchMsg = m.message.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchSub && !matchMsg) return false
      }
      return true
    })
  }, [messages, filter, search])

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
      setUnreadCount((prev) => (newRead ? Math.max(0, prev - 1) : prev + 1))
      toast.success(newRead ? "Marked as read" : "Marked as unread")
    } catch {
      toast.error("Failed to update message status")
    }
  }

  // Delete message
  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return
    try {
      const res = await fetch("/api/admin/contact", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      const isWasUnread = messages.find((m) => m.id === id)?.isRead === false
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (isWasUnread) setUnreadCount((prev) => Math.max(0, prev - 1))
      if (selectedId === id) {
        const remaining = messages.filter((m) => m.id !== id)
        setSelectedId(remaining[0]?.id ?? null)
      }
      toast.success("Message deleted")
    } catch {
      toast.error("Failed to delete message")
    }
  }

  // Send reply
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      const res = await fetch("/api/admin/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyMessage: replyText.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send email")

      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, isRead: true, isReplied: true } : m
        )
      )
      setReplyText("")
      toast.success(`Reply dispatched to ${selectedMessage.email}`)
    } catch (err: any) {
      toast.error(err.message || "Could not send reply")
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Total Inquiries</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Inbound messages</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Unread Messages</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.unread}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Pending triage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Replied & Solved</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats.replied}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Delivered email responses</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Resolution Rate</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.rate}%</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Support coverage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two-Column App Layout */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Sidebar List */}
        <div className="lg:col-span-5 border-r border-zinc-200 flex flex-col h-full bg-zinc-50/40">
          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-zinc-200 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by sender, email, or message…"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
              />
            </div>

            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-lg font-semibold transition text-xs",
                  filter === "all"
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                All ({messages.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-3 py-1 rounded-lg font-semibold transition text-xs",
                  filter === "unread"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                )}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("replied")}
                className={cn(
                  "px-3 py-1 rounded-lg font-semibold transition text-xs",
                  filter === "replied"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                Replied ({stats.replied})
              </button>
            </div>
          </div>

          {/* Message Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredMessages.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-600">No contact messages match filter</p>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelected = m.id === selectedId
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id)
                      if (!m.isRead) toggleRead(m.id, false)
                    }}
                    className={cn(
                      "p-3.5 cursor-pointer transition-colors relative border-l-3",
                      isSelected
                        ? "bg-zinc-100 border-zinc-900"
                        : m.isRead
                        ? "hover:bg-zinc-100/60 border-transparent bg-white/70"
                        : "bg-white font-semibold hover:bg-zinc-50 border-amber-500"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!m.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-zinc-900 truncate">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 whitespace-nowrap font-medium">
                        {new Date(m.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-800 font-medium truncate mb-0.5">
                      {m.subject || "No Subject"}
                    </p>

                    <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                      {m.message}
                    </p>

                    {m.isReplied && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Replied via Email
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Detail & Reply Panel */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white">
          {selectedMessage ? (
            <>
              {/* Detail Header */}
              <div className="p-5 border-b border-zinc-200 flex items-start justify-between gap-4 bg-zinc-50/30">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 mb-1">
                    {selectedMessage.subject || "Inquiry (No Subject)"}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                    <span className="font-semibold text-zinc-900">{selectedMessage.name}</span>
                    <span className="font-mono text-zinc-600">&lt;{selectedMessage.email}&gt;</span>
                    <span>•</span>
                    <span className="text-zinc-600">
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

                {/* Action Toolbar */}
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
