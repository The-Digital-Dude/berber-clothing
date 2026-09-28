"use client"

import { useState } from "react"
import { Mail, MailOpen, Send, Trash2, CheckCircle2, Search, Reply, User, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

  // Filter & Search
  const filteredMessages = messages.filter((m) => {
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
      toast.success(`Reply sent to ${selectedMessage.email}`)
    } catch (err: any) {
      toast.error(err.message || "Could not send reply")
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
      {/* Left Sidebar List */}
      <div className="md:col-span-5 border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
            />
          </div>

          <div className="flex gap-1.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === "unread" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("replied")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === "replied" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Replied
            </button>
          </div>
        </div>

        {/* Message Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredMessages.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400">
              No messages found.
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
                  className={`p-4 cursor-pointer transition-colors relative ${
                    isSelected
                      ? "bg-amber-50/60 border-l-4 border-amber-500"
                      : m.isRead
                      ? "hover:bg-gray-100/70"
                      : "bg-white font-semibold hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm text-gray-900 truncate">{m.name}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 font-medium truncate mb-1">
                    {m.subject || "No Subject"}
                  </p>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-normal">
                    {m.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {!m.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    {m.isReplied && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Replied
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right Detail & Reply Panel */}
      <div className="md:col-span-7 flex flex-col h-full bg-white">
        {selectedMessage ? (
          <>
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  {selectedMessage.subject || "No Subject Specified"}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span className="font-semibold text-gray-900">{selectedMessage.name}</span>
                  <span>&lt;{selectedMessage.email}&gt;</span>
                  <span>•</span>
                  <span>
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleRead(selectedMessage.id, selectedMessage.isRead)}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  title={selectedMessage.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {selectedMessage.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {selectedMessage.isReplied && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>A reply has already been sent to this inquiry via email.</span>
                </div>
              )}
            </div>

            {/* Email Reply Composer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 text-amber-600" /> Reply to {selectedMessage.name}
                </span>
                <span className="text-xs text-gray-400">Sending from store email</span>
              </div>

              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Write your response to ${selectedMessage.name}…`}
                className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none placeholder:text-gray-400"
              />

              <div className="flex justify-between items-center">
                <p className="text-[11px] text-gray-400">
                  Your response will be delivered directly to <strong>{selectedMessage.email}</strong>.
                </p>
                <Button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-black text-white hover:bg-amber-500 hover:text-black font-semibold rounded-xl text-xs gap-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingReply ? "Sending Email…" : "Send Email Reply"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-gray-400">
            <Mail className="w-12 h-12 stroke-[1.2] mb-3 text-gray-300" />
            <p className="text-sm">Select a message from the list to view and reply.</p>
          </div>
        )}
      </div>
    </div>
  )
}
