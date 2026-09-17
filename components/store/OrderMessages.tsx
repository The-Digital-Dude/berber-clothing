"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const bottomRef = useRef<HTMLDivElement>(null)

  const apiBase = isAdmin ? `/api/admin/orders/${orderId}/messages` : `/api/orders/${orderId}/messages`

  useEffect(() => {
    fetch(apiBase)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {})
  }, [apiBase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })
    const data = await res.json()
    if (data.message) {
      setMessages((prev) => [...prev, data.message])
      setText("")
    }
    setSending(false)
  }

  return (
    <div className="border rounded-lg flex flex-col h-72">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-8">No messages yet</p>
        )}
        {messages.map((m) => {
          const isOwn = isAdmin ? m.senderRole === "ADMIN" : m.senderRole === "CUSTOMER"
          return (
            <div key={m.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {!isOwn && (
                  <p className="text-xs font-bold mb-0.5 opacity-60">{m.senderRole}</p>
                )}
                <p>{m.message}</p>
                <p className="text-xs opacity-50 mt-0.5 text-right">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-2 flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
