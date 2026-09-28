"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Monitor, Smartphone, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const TEMPLATES: { key: string; label: string; description: string }[] = [
  { key: "order_confirmation", label: "Order Confirmation", description: "Sent instantly when a customer places an order" },
  { key: "shipping_dispatched", label: "Shipping Dispatched", description: "Sent when an order is marked Shipped" },
  { key: "order_status_update", label: "Order Status Update", description: "Sent on Confirmed/Processing/Cancelled transitions" },
  { key: "order_delivered", label: "Order Delivered", description: "Sent when an order is marked Delivered, with care tips" },
  { key: "return_update", label: "Return Update", description: "Sent when a return request is approved/rejected/refunded" },
  { key: "abandoned_cart", label: "Abandoned Cart", description: "1h and 24h cart recovery reminders" },
  { key: "review_request", label: "Review Request", description: "Sent 3 days after delivery asking for a review" },
  { key: "welcome_email", label: "Welcome Email", description: "Sent when a new account is created" },
  { key: "gift_card", label: "Gift Card", description: "Sent to the recipient when a gift card is purchased" },
  { key: "store_credit", label: "Store Credit Issued", description: "Sent when an admin issues store credit" },
  { key: "back_in_stock", label: "Back in Stock", description: "Sent to customers watching a sold-out variant" },
  { key: "admin_new_order", label: "Admin: New Order", description: "Internal notification sent to the store's admin email" },
  { key: "admin_low_stock", label: "Admin: Low Stock", description: "Internal notification when a variant runs low" },
]

export default function EmailStudioClient() {
  const [selected, setSelected] = useState(TEMPLATES[0].key)
  const [html, setHtml] = useState("")
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(false)
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop")
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/email-templates/preview?template=${selected}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.html) { setHtml(d.html); setSubject(d.subject) }
      })
      .finally(() => setLoading(false))
  }, [selected])

  const sendTest = async () => {
    if (!testEmail) { toast.error("Enter an email address first"); return }
    setSending(true)
    try {
      const res = await fetch("/api/admin/email-templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selected, to: testEmail }),
      })
      const data = await res.json()
      if (res.ok) toast.success(`Test email sent to ${testEmail}`)
      else toast.error(data.error || "Failed to send test email")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Template list */}
      <div className="md:col-span-1 space-y-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelected(t.key)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
              selected === t.key ? "bg-black text-white" : "hover:bg-muted text-foreground"
            )}
          >
            <div className="font-medium">{t.label}</div>
            <div className={cn("text-xs mt-0.5", selected === t.key ? "text-white/70" : "text-muted-foreground")}>
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Subject</div>
                <div className="text-sm font-medium truncate">{subject || "—"}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setViewport("desktop")}
                    className={cn("p-2", viewport === "desktop" ? "bg-black text-white" : "hover:bg-muted")}
                    title="Desktop preview"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewport("mobile")}
                    className={cn("p-2", viewport === "mobile" ? "bg-black text-white" : "hover:bg-muted")}
                    title="Mobile preview"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-9 px-3 rounded-lg border text-sm w-48"
                />
                <Button size="sm" onClick={sendTest} disabled={sending} className="gap-1.5">
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send test
                </Button>
              </div>
            </div>

            <div className="flex justify-center bg-gray-100 rounded-xl p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64 w-full text-muted-foreground text-sm">Loading preview…</div>
              ) : (
                <iframe
                  key={selected + viewport}
                  srcDoc={html}
                  title="Email preview"
                  className="bg-white rounded-lg shadow-sm border transition-all"
                  style={{ width: viewport === "desktop" ? 600 : 375, height: 700 }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
