"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, MailOpen, Reply } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
}

export default function ContactInbox({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial)
  const [selected, setSelected] = useState<Message | null>(null)

  async function markRead(id: string) {
    await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead" }),
    })
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m))
    if (selected?.id === id) setSelected((s) => s ? { ...s, isRead: true } : s)
  }

  async function markReplied(id: string) {
    await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markReplied" }),
    })
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isReplied: true, isRead: true } : m))
    if (selected?.id === id) setSelected((s) => s ? { ...s, isReplied: true, isRead: true } : s)
  }

  function selectMessage(msg: Message) {
    setSelected(msg)
    if (!msg.isRead) markRead(msg.id)
  }

  return (
    <div className="flex gap-0 border rounded-lg overflow-hidden min-h-[500px]">
      {/* List */}
      <div className="w-80 border-r shrink-0 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center py-12 text-sm">No messages</p>
        )}
        {messages.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMessage(m)}
            className={cn(
              "w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors",
              selected?.id === m.id && "bg-muted",
              !m.isRead && "font-semibold"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm">{m.name}</span>
              {m.isReplied ? (
                <Badge variant="outline" className="text-xs">Replied</Badge>
              ) : !m.isRead ? (
                <Badge className="text-xs">New</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground truncate">{m.subject ?? m.message.slice(0, 40)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(m.createdAt).toLocaleDateString()}</p>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="flex-1 p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a message
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selected.subject ?? "(No subject)"}</h2>
                <p className="text-sm text-muted-foreground">
                  From: <strong>{selected.name}</strong> &lt;{selected.email}&gt;
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!selected.isRead && (
                  <Button size="sm" variant="outline" onClick={() => markRead(selected.id)}>
                    <MailOpen className="h-4 w-4 mr-1" /> Mark Read
                  </Button>
                )}
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject ?? "")}`}
                  onClick={() => markReplied(selected.id)}
                >
                  <Button size="sm">
                    <Reply className="h-4 w-4 mr-1" /> Reply via Email
                  </Button>
                </a>
              </div>
            </div>
            <div className="border rounded-md p-4 bg-muted/30 whitespace-pre-wrap text-sm">
              {selected.message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
