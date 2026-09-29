"use client"

import { useEffect, useState, useMemo } from "react"
import { 
  Monitor, 
  Smartphone, 
  Send, 
  Loader2, 
  Mail, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  Info,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TemplateItem {
  key: string
  label: string
  category: "ORDERS" | "MARKETING" | "ADMIN"
  description: string
  variables: string[]
}

const TEMPLATES: TemplateItem[] = [
  {
    key: "order_confirmation",
    label: "Order Confirmation",
    category: "ORDERS",
    description: "Sent instantly when a customer places a successful order",
    variables: ["customer_name", "order_number", "order_total", "items_table", "shipping_address"],
  },
  {
    key: "shipping_dispatched",
    label: "Shipping Dispatched",
    category: "ORDERS",
    description: "Sent when an order is handed over to courier rider",
    variables: ["customer_name", "order_number", "courier_name", "tracking_code", "consignment_id"],
  },
  {
    key: "order_status_update",
    label: "Order Status Update",
    category: "ORDERS",
    description: "Sent on Confirmed, Processing, or Custom transitions",
    variables: ["customer_name", "order_number", "status_label", "status_note"],
  },
  {
    key: "order_delivered",
    label: "Order Delivered",
    category: "ORDERS",
    description: "Sent upon successful delivery with clothing care tips",
    variables: ["customer_name", "order_number", "delivery_date", "support_link"],
  },
  {
    key: "return_update",
    label: "Return & RMA Update",
    category: "ORDERS",
    description: "Sent when a return is approved, received, or refunded",
    variables: ["customer_name", "order_number", "rma_status", "refund_amount", "admin_note"],
  },
  {
    key: "abandoned_cart",
    label: "Abandoned Cart Drip",
    category: "MARKETING",
    description: "Automated 1-hour and 24-hour cart recovery email",
    variables: ["customer_name", "cart_items", "checkout_url", "discount_code"],
  },
  {
    key: "review_request",
    label: "Product Review Request",
    category: "MARKETING",
    description: "Sent 3 days post-delivery requesting customer rating & photo",
    variables: ["customer_name", "purchased_products", "review_submission_link"],
  },
  {
    key: "welcome_email",
    label: "Customer Welcome",
    category: "MARKETING",
    description: "Sent when a new customer creates an account",
    variables: ["customer_name", "welcome_discount", "store_url"],
  },
  {
    key: "newsletter_welcome",
    label: "Newsletter Signup",
    category: "MARKETING",
    description: "Sent immediately after subscribing via the footer form, with a one-time 10% off code",
    variables: ["coupon_code", "store_url"],
  },
  {
    key: "gift_card",
    label: "Digital Gift Voucher",
    category: "MARKETING",
    description: "Sent to recipient with redeemable gift voucher code",
    variables: ["recipient_name", "sender_name", "voucher_code", "balance_amount", "personal_message"],
  },
  {
    key: "store_credit",
    label: "Store Credit Issued",
    category: "MARKETING",
    description: "Sent when admin issues promotional or apology store credit",
    variables: ["customer_name", "credit_amount", "reason", "account_balance"],
  },
  {
    key: "back_in_stock",
    label: "Back In Stock Alert",
    category: "MARKETING",
    description: "Sent to waiting subscribers when a product is replenished",
    variables: ["product_name", "variant_details", "product_url"],
  },
  {
    key: "admin_new_order",
    label: "Admin: New Order Alert",
    category: "ADMIN",
    description: "Internal alert sent to store operations team",
    variables: ["order_number", "customer_name", "total_amount", "payment_method"],
  },
  {
    key: "admin_low_stock",
    label: "Admin: Low Stock Alert",
    category: "ADMIN",
    description: "Internal alert when SKU drops below threshold",
    variables: ["product_name", "variant_size", "current_stock", "restock_po_url"],
  },
]

export default function EmailStudioClient() {
  const [selected, setSelected] = useState(TEMPLATES[0].key)
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "ORDERS" | "MARKETING" | "ADMIN">("ALL")
  const [html, setHtml] = useState("")
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(false)
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop")
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  const activeTemplate = TEMPLATES.find((t) => t.key === selected) || TEMPLATES[0]

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/email-templates/preview?template=${selected}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.html) {
          setHtml(d.html)
          setSubject(d.subject)
        }
      })
      .catch((e) => console.error("Error loading preview", e))
      .finally(() => setLoading(false))
  }, [selected])

  const sendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid recipient email address")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/admin/email-templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selected, to: testEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Test email dispatched to ${testEmail}`)
      } else {
        toast.error(data.error || "Failed to dispatch test email")
      }
    } catch {
      toast.error("Error sending test email")
    } finally {
      setSending(false)
    }
  }

  const copyVariable = (varName: string) => {
    const text = `{{${varName}}}`
    navigator.clipboard.writeText(text)
    setCopiedVar(varName)
    toast.success(`Copied ${text} to clipboard`)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "ALL") return TEMPLATES
    return TEMPLATES.filter((t) => t.category === categoryFilter)
  }, [categoryFilter])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Email Templates</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{TEMPLATES.length}</h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Production ready designs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Fulfillment Lifecycle</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">
              {TEMPLATES.filter((t) => t.category === "ORDERS").length}
            </h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Transactional alerts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Marketing Drips</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">
              {TEMPLATES.filter((t) => t.category === "MARKETING").length}
            </h3>
            <span className="text-xs text-zinc-600 font-medium mt-1 block">Cart & retention sequences</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Engine Status</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">Active</h3>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">Brevo / Resend verified</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Template Directory */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
          {/* Category Filter Tabs */}
          <div className="p-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center gap-1 overflow-x-auto">
            {(["ALL", "ORDERS", "MARKETING", "ADMIN"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                  categoryFilter === cat
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                )}
              >
                {cat === "ALL" ? "All" : cat === "ORDERS" ? "Orders" : cat === "MARKETING" ? "Marketing" : "Admin"}
              </button>
            ))}
          </div>

          {/* Template List */}
          <div className="divide-y divide-zinc-100 max-h-[680px] overflow-y-auto">
            {filteredTemplates.map((t) => {
              const isSelected = selected === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setSelected(t.key)}
                  className={cn(
                    "w-full text-left p-3.5 transition-colors block relative",
                    isSelected
                      ? "bg-zinc-100/90 border-l-4 border-zinc-900"
                      : "hover:bg-zinc-50 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-zinc-900 truncate">{t.label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded",
                        t.category === "ORDERS"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : t.category === "MARKETING"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      )}
                    >
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed font-normal">
                    {t.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Area: Interactive Preview & Test Dispatcher */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Preview Controls */}
          <div className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">Live Subject Line:</span>
              <p className="text-xs font-bold text-zinc-900 truncate mt-0.5">{subject || "Loading Subject…"}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Device switcher */}
              <div className="flex rounded-xl border border-zinc-200 bg-zinc-50/80 p-0.5">
                <button
                  onClick={() => setViewport("desktop")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-medium transition",
                    viewport === "desktop" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                  )}
                  title="Desktop Preview (600px)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport("mobile")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-medium transition",
                    viewport === "mobile" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                  )}
                  title="Mobile Preview (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Test Sender */}
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Send test to email…"
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs w-48 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
                />
                <button
                  onClick={sendTest}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 rounded-xl shadow-2xs transition"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test</span>
                </button>
              </div>
            </div>
          </div>

          {/* Supported Dynamic Variables */}
          <div className="p-3.5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                Available Dynamic Variables for {activeTemplate.label}:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeTemplate.variables.map((v) => (
                <button
                  key={v}
                  onClick={() => copyVariable(v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200/80 transition"
                  title="Click to copy variable tag"
                >
                  <span>&#123;&#123;{v}&#125;&#125;</span>
                  {copiedVar === v ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Device Frame */}
          <div className="rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-6 flex items-center justify-center min-h-[600px] shadow-inner">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-xs text-zinc-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
                <p className="font-semibold">Rendering email template canvas…</p>
              </div>
            ) : (
              <iframe
                key={selected + viewport}
                srcDoc={html}
                title="Email template preview canvas"
                className="bg-white rounded-2xl shadow-xl border border-zinc-300 transition-all"
                style={{
                  width: viewport === "desktop" ? "620px" : "375px",
                  height: "640px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
