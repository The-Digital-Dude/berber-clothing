"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Trash2, Edit, Plus, X } from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  recipientCount: number
  sentAt?: string
  scheduledAt?: string
  createdAt: string
}

interface Props {
  campaigns: Campaign[]
  subscriberCount: number
}

const statusColor: Record<string, string> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENT: "default",
}

export default function CampaignComposer({ campaigns: initial, subscriberCount }: Props) {
  const [campaigns, setCampaigns] = useState(initial)
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState({ name: "", subject: "", body: "" })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  async function saveDraft() {
    if (!form.name || !form.subject || !form.body) return toast.error("All fields required")
    setSaving(true)
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns((prev) => [data.campaign, ...prev])
      setComposing(false)
      setForm({ name: "", subject: "", body: "" })
      toast.success("Draft saved")
    }
    setSaving(false)
  }

  async function sendCampaign(id: string) {
    if (!confirm(`Send this campaign to ${subscriberCount} subscribers?`)) return
    setSending(id)
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    })
    const data = await res.json()
    if (data.campaign) {
      setCampaigns((prev) => prev.map((c) => c.id === id ? data.campaign : c))
      toast.success("Campaign sent!")
    } else {
      toast.error("Failed to send")
    }
    setSending(null)
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return
    await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" })
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{subscriberCount} active subscribers</p>
        <Button onClick={() => setComposing(true)} disabled={composing}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {composing && (
        <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New Campaign</h3>
            <Button variant="ghost" size="sm" onClick={() => setComposing(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1.5">
            <Label>Campaign Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Black Friday Sale" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject Line</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="50% off everything — today only!" />
          </div>
          <div className="space-y-1.5">
            <Label>Body (HTML)</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} placeholder="<h1>Hello!</h1><p>Your offer here...</p>" className="font-mono text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveDraft} disabled={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No campaigns yet</p>
        )}
        {campaigns.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <Badge variant={statusColor[c.status] as any}>{c.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{c.subject}</p>
              <p className="text-xs text-muted-foreground">
                {c.status === "SENT"
                  ? `Sent ${new Date(c.sentAt!).toLocaleDateString()} · ${c.recipientCount} recipients`
                  : `Created ${new Date(c.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {c.status === "DRAFT" && (
                <Button size="sm" disabled={sending === c.id} onClick={() => sendCampaign(c.id)}>
                  <Send className="h-4 w-4 mr-1" /> {sending === c.id ? "Sending..." : "Send"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => deleteCampaign(c.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
