"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Send, Sparkles, User, RefreshCw, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
  id: string
  senderRole: "CUSTOMER" | "ADMIN"
  message: string
  createdAt: string
}

export default function OrderMessages({ orderId, isAdmin = false }: { orderId: string; isAdmin?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const apiBase = isAdmin ? `/api/admin/orders/${orderId}/messages` : `/api/orders/${orderId}/messages`

  const fetchMessages = () => {
    fetch(apiBase)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchMessages()
    // Poll for updates every 15s when window is active
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [apiBase])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send message")
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
        setText("")
        toast.success(isAdmin ? "Reply sent & customer notified via email" : "Message sent to support")
      }
    } catch (err: any) {
      toast.error(err.message || "Could not send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-berber-surface border border-berber-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-96">
      {/* Thread Header */}
      <div className="px-4 py-3 bg-berber-muted/50 border-b border-berber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-berber-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-berber-black">
            {isAdmin ? "Customer Communication Thread" : "Order Support & Messages"}
          </span>
        </div>
        <button
          onClick={fetchMessages}
          className="text-berber-text-muted hover:text-berber-gold transition-colors p-1"
          title="Refresh thread"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent to-berber-muted/20">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-xs text-berber-text-muted">
            Loading messages…
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 rounded-full bg-berber-muted border border-berber-border flex items-center justify-center mx-auto mb-2 text-berber-text-muted">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-berber-black">No messages yet on this order.</p>
            <p className="text-[11px] text-berber-text-muted mt-0.5">
              {isAdmin
                ? "Send a message to update the customer. They will receive an email copy."
                : "Have questions about delivery, size, or exchange? Drop us a message here."}
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isOwn = isAdmin ? m.senderRole === "ADMIN" : m.senderRole === "CUSTOMER"
          const isStoreAdmin = m.senderRole === "ADMIN"

          return (
            <div key={m.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isStoreAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-berber-gold uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" /> Berber Support
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-berber-text-muted uppercase tracking-wider">
                    <User className="w-2.5 h-2.5" /> Customer
                  </span>
                )}
                <span className="text-[10px] text-berber-text-muted/70">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs",
                  isOwn
                    ? "bg-berber-black text-white rounded-tr-xs"
                    : isStoreAdmin
                    ? "bg-berber-gold/10 border border-berber-gold/30 text-berber-black rounded-tl-xs"
                    : "bg-berber-muted text-berber-black border border-berber-border rounded-tl-xs"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.message}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-berber-surface border-t border-berber-border flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAdmin ? "Type an update to the customer…" : "Write a message regarding your order…"}
          className="flex-1 bg-berber-muted/40 border border-berber-border rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-berber-gold"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <Button
          size="sm"
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-berber-black hover:bg-berber-gold hover:text-berber-black text-white rounded-xl px-4 h-10 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
