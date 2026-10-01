"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Store, CreditCard, Truck, Percent, Mail, BarChart2, Users, ChevronRight,
  ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Zap, Copy, Check, Globe
} from "lucide-react"

type Staff = { id: string; name: string; email: string; role: string }

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "courier", label: "Steadfast Courier", icon: Zap },
  { id: "shipping", label: "Shipping & Tax", icon: Truck },
  { id: "email", label: "Email / SMTP", icon: Mail },
  { id: "tracking", label: "Tracking & SEO", icon: BarChart2 },
  { id: "staff", label: "Staff", icon: Users },
]

export function SettingsClient({
  initialSettings,
  initialStaff,
}: {
  initialSettings: Record<string, string>
  initialStaff: Staff[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")

  // General
  const [storeName, setStoreName] = useState(initialSettings["store_name"] || "")
  const [storeTagline, setStoreTagline] = useState(initialSettings["store_tagline"] || "")
  const [storeDescription, setStoreDescription] = useState(initialSettings["store_description"] || "")
  const [supportEmail, setSupportEmail] = useState(initialSettings["support_email"] || "")
  const [supportPhone, setSupportPhone] = useState(initialSettings["support_phone"] || "")
  const [whatsappConcierge, setWhatsappConcierge] = useState(initialSettings["whatsapp_concierge_number"] || "")
  const [socialFacebook, setSocialFacebook] = useState(initialSettings["social_facebook"] || "")
  const [socialInstagram, setSocialInstagram] = useState(initialSettings["social_instagram"] || "")
  const [socialTiktok, setSocialTiktok] = useState(initialSettings["social_tiktok"] || "")
  const [isSaving, setIsSaving] = useState(false)

  // Payments
  const [enabledCOD, setEnabledCOD] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("COD")
  )
  const [enabledBkash, setEnabledBkash] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("BKASH")
  )
  const [enabledNagad, setEnabledNagad] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("NAGAD")
  )
  const [bkashNumber, setBkashNumber] = useState(initialSettings["bkash_merchant_number"] || "")
  const [nagadNumber, setNagadNumber] = useState(initialSettings["nagad_merchant_number"] || "")
  const [codDepositEnabled, setCodDepositEnabled] = useState(initialSettings["cod_deposit_enabled"] === "true")
  const [codDepositAmount, setCodDepositAmount] = useState(initialSettings["cod_deposit_amount"] || "100")
  const [isPaymentSaving, setIsPaymentSaving] = useState(false)

  // Steadfast Courier Settings
  const [steadfastApiKey, setSteadfastApiKey] = useState(initialSettings["steadfast_api_key"] || "")
  const [steadfastSecretKey, setSteadfastSecretKey] = useState(initialSettings["steadfast_secret_key"] || "")
  const [steadfastBaseUrl, setSteadfastBaseUrl] = useState(initialSettings["steadfast_base_url"] || "https://portal.packzy.com/api/v1")
  const [steadfastWebhookSecret, setSteadfastWebhookSecret] = useState(initialSettings["steadfast_webhook_secret"] || "")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isSteadfastSaving, setIsSteadfastSaving] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedBearer, setCopiedBearer] = useState(false)

  // Shipping & Tax
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(initialSettings["free_shipping_above"] || "")
  const [shippingChargeAmount, setShippingChargeAmount] = useState(initialSettings["shipping_charge"] || "60")
  const [taxEnabled, setTaxEnabled] = useState(initialSettings["tax_enabled"] === "true")
  const [taxRate, setTaxRate] = useState(initialSettings["tax_rate"] || "")
  const [taxLabel, setTaxLabel] = useState(initialSettings["tax_label"] || "VAT")
  const [isShippingTaxSaving, setIsShippingTaxSaving] = useState(false)

  // SMTP
  const [smtpHost, setSmtpHost] = useState(initialSettings["smtp_host"] || "")
  const [smtpPort, setSmtpPort] = useState(initialSettings["smtp_port"] || "587")
  const [smtpSecure, setSmtpSecure] = useState(initialSettings["smtp_secure"] === "true")
  const [smtpUser, setSmtpUser] = useState(initialSettings["smtp_user"] || "")
  const [smtpPass, setSmtpPass] = useState(initialSettings["smtp_pass"] || "")
  const [smtpFromName, setSmtpFromName] = useState(initialSettings["smtp_from_name"] || "")
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialSettings["smtp_from_email"] || "")
  const [adminNotificationEmail, setAdminNotificationEmail] = useState(initialSettings["admin_notification_email"] || "")
  const [testEmailTo, setTestEmailTo] = useState("")
  const [isSmtpSaving, setIsSmtpSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [abandonedCartEmailEnabled, setAbandonedCartEmailEnabled] = useState(initialSettings["abandoned_cart_email_enabled"] === "true")
  const [isAbandonedCartSaving, setIsAbandonedCartSaving] = useState(false)

  // Tracking
  const [ga4Id, setGa4Id] = useState(initialSettings["ga4_id"] || "")
  const [metaPixelId, setMetaPixelId] = useState(initialSettings["meta_pixel_id"] || "")
  const [clarityId, setClarityId] = useState(initialSettings["clarity_id"] || "")
  const [metaTitle, setMetaTitle] = useState(initialSettings["meta_title"] || "")
  const [metaDescription, setMetaDescription] = useState(initialSettings["meta_description"] || "")
  const [isTrackingSaving, setIsTrackingSaving] = useState(false)

  // Staff
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("STAFF")
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const patch = async (settings: Record<string, any>) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    })
    return res.ok
  }

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      const ok = await patch({
        store_name: storeName, store_tagline: storeTagline, store_description: storeDescription,
        support_email: supportEmail, support_phone: supportPhone,
        whatsapp_concierge_number: whatsappConcierge,
        social_facebook: socialFacebook, social_instagram: socialInstagram, social_tiktok: socialTiktok,
      })
      ok ? toast.success("General settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsSaving(false) }
  }

  const handleSavePayments = async () => {
    setIsPaymentSaving(true)
    try {
      const ok = await patch({
        enabled_payment_methods: [enabledCOD && "COD", enabledBkash && "BKASH", enabledNagad && "NAGAD"].filter(Boolean).join(","),
        bkash_merchant_number: bkashNumber,
        nagad_merchant_number: nagadNumber,
        cod_deposit_enabled: codDepositEnabled,
        cod_deposit_amount: codDepositAmount,
      })
      ok ? toast.success("Payment settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsPaymentSaving(false) }
  }

  const handleSaveSteadfast = async () => {
    setIsSteadfastSaving(true)
    try {
      const ok = await patch({
        steadfast_api_key: steadfastApiKey.trim(),
        steadfast_secret_key: steadfastSecretKey.trim(),
        steadfast_base_url: steadfastBaseUrl.trim(),
        steadfast_webhook_secret: steadfastWebhookSecret.trim(),
      })
      ok ? toast.success("Steadfast credentials & Webhook secret saved") : toast.error("Failed to save Steadfast settings")
      if (ok) router.refresh()
    } catch {
      toast.error("Error saving Steadfast settings")
    } finally {
      setIsSteadfastSaving(false)
    }
  }

  const handleTestSteadfast = async () => {
    if (!steadfastApiKey || !steadfastSecretKey) {
      toast.error("Please enter both Steadfast API Key and Secret Key first")
      return
    }
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    try {
      const res = await fetch("/api/admin/courier/steadfast/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: steadfastApiKey.trim(),
          secretKey: steadfastSecretKey.trim(),
          baseUrl: steadfastBaseUrl.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setConnectionTestResult({
          success: true,
          balance: data.balance,
          message: data.message || `Connected! Current Balance: ৳${data.balance ?? 0}`,
        })
        toast.success(`Steadfast API verified! Balance: ৳${data.balance ?? 0}`)
      } else {
        setConnectionTestResult({
          success: false,
          message: data.message || "Failed to authenticate with Steadfast API",
        })
        toast.error(data.message || "Steadfast authentication failed")
      }
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        message: err.message || "Network error testing Steadfast gateway",
      })
      toast.error("Error connecting to Steadfast")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveShippingTax = async () => {
    setIsShippingTaxSaving(true)
    try {
      const ok = await patch({
        free_shipping_above: freeShippingThreshold,
        shipping_charge: shippingChargeAmount,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_label: taxLabel,
      })
      ok ? toast.success("Shipping & tax settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsShippingTaxSaving(false) }
  }

  const handleSaveSmtp = async () => {
    setIsSmtpSaving(true)
    try {
      const ok = await patch({
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_secure: smtpSecure,
        smtp_user: smtpUser, smtp_pass: smtpPass,
        smtp_from_name: smtpFromName, smtp_from_email: smtpFromEmail,
        admin_notification_email: adminNotificationEmail,
      })
      ok ? toast.success("SMTP settings saved") : toast.error("Failed to save")
    } catch { toast.error("Error saving") } finally { setIsSmtpSaving(false) }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailTo) { toast.error("Enter a recipient email"); return }
    setIsSendingTest(true)
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      })
      const d = await res.json()
      res.ok ? toast.success("Test email sent! Check your inbox.") : toast.error(d.error || "Failed to send")
    } catch { toast.error("Error sending") } finally { setIsSendingTest(false) }
  }

  const handleSaveAbandonedCart = async () => {
    setIsAbandonedCartSaving(true)
    try {
      const ok = await patch({ abandoned_cart_email_enabled: abandonedCartEmailEnabled })
      ok ? toast.success("Abandoned cart settings saved") : toast.error("Failed to save")
    } catch { toast.error("Error saving") } finally { setIsAbandonedCartSaving(false) }
  }

  const handleSaveTracking = async () => {
    setIsTrackingSaving(true)
    try {
      const ok = await patch({ ga4_id: ga4Id, meta_pixel_id: metaPixelId, clarity_id: clarityId, meta_title: metaTitle, meta_description: metaDescription })
      ok ? toast.success("Tracking & SEO saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsTrackingSaving(false) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/admin/settings/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) { toast.success("Staff member added"); setIsInviteOpen(false); setInviteEmail(""); router.refresh() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Error") }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/settings/staff/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      res.ok ? toast.success("Role updated") : toast.error("Failed")
      if (res.ok) router.refresh()
    } catch { toast.error("Error") }
  }

  const handleRemoveStaff = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? They will become a regular customer.`)) return
    try {
      const res = await fetch(`/api/admin/settings/staff/${id}`, { method: "DELETE" })
      res.ok ? toast.success("Removed") : toast.error("Failed")
      if (res.ok) router.refresh()
    } catch { toast.error("Error") }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Tab sidebar */}
      <aside className="lg:w-56 shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all text-left w-full",
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-amber-400" : "text-zinc-500")} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Tab content */}
      <div className="flex-1 min-w-0 max-w-3xl">

        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">General</h2>
              <p className="text-sm text-muted-foreground">Your store's name, contact details, and social links.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Store Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Store Name"><Input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></Field>
                <Field label="Tagline"><Input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="Wear Your Story" /></Field>
                <Field label="Description">
                  <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </Field>
                <Field label="Currency"><Input value="BDT (৳)" disabled className="bg-muted text-muted-foreground" /></Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Support Email"><Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@store.com" /></Field>
                  <Field label="Support Phone"><Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" /></Field>
                  <Field label="WhatsApp Concierge Number" hint="Powers the floating WhatsApp button on the storefront — leave blank to hide it">
                    <Input value={whatsappConcierge} onChange={(e) => setWhatsappConcierge(e.target.value)} placeholder="+8801577825517" />
                  </Field>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Facebook"><Input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/..." /></Field>
                <Field label="Instagram"><Input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/..." /></Field>
                <Field label="TikTok"><Input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="https://tiktok.com/..." /></Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveGeneral} disabled={isSaving}>{isSaving ? "Saving…" : "Save General Settings"}</Button>
          </div>
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Payments</h2>
              <p className="text-sm text-muted-foreground">Control which payment methods appear at checkout.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Cash on Delivery (COD)"
                  description="Customer pays on delivery"
                  checked={enabledCOD} onChange={setEnabledCOD}
                />
                <ToggleRow
                  label="bKash"
                  description="Mobile banking"
                  checked={enabledBkash} onChange={setEnabledBkash}
                />
                {enabledBkash && (
                  <Field label="bKash Merchant Number" indent>
                    <Input value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="01XXXXXXXXX" />
                  </Field>
                )}
                <ToggleRow
                  label="Nagad"
                  description="Mobile banking"
                  checked={enabledNagad} onChange={setEnabledNagad}
                />
                {enabledNagad && (
                  <Field label="Nagad Merchant Number" indent>
                    <Input value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="01XXXXXXXXX" />
                  </Field>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">COD Advance Deposit</CardTitle>
                <CardDescription>Require a small bKash deposit before confirming COD orders — reduces fake orders and RTO.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Require deposit on all COD orders"
                  description="When off, only flagged high-risk customers are asked"
                  checked={codDepositEnabled} onChange={setCodDepositEnabled}
                />
                <Field label="Deposit Amount (৳)">
                  <Input type="number" min="0" value={codDepositAmount} onChange={(e) => setCodDepositAmount(e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground mt-1">Recommended ৳100–200. Remainder collected on delivery.</p>
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSavePayments} disabled={isPaymentSaving}>{isPaymentSaving ? "Saving…" : "Save Payment Settings"}</Button>
          </div>
        )}

        {/* Steadfast Courier Integration */}
        {activeTab === "courier" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Zap className="w-3.5 h-3.5" />
                  Primary Courier Partner
                </span>
              </div>
              <h2 className="text-lg font-semibold mt-1">Steadfast Courier Integration</h2>
              <p className="text-sm text-muted-foreground">
                Configure your official Steadfast API and Secret keys directly. This powers live 1-Click Dispatches, tracking synchronizations, and Fraud Risk scoring.
              </p>
            </div>

            <Card className="border-indigo-100 shadow-xs">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-white border-b border-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-zinc-900">
                      <span>API Credentials</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </CardTitle>
                    <CardDescription>
                      Find your API Key and Secret Key in your{" "}
                      <a
                        href="https://portal.steadfast.com.bd"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-semibold underline hover:text-indigo-800"
                      >
                        Steadfast Merchant Portal
                      </a>
                    </CardDescription>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white border border-zinc-200 px-2 py-1 rounded-md text-zinc-700">
                    portal.steadfast.com.bd
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <Field label="Steadfast API Key" hint="Required for parcel dispatch & fraud checks">
                  <div className="relative flex items-center">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={steadfastApiKey}
                      onChange={(e) => setSteadfastApiKey(e.target.value)}
                      placeholder="Paste your Steadfast API Key"
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Steadfast Secret Key" hint="Secret key provided by Steadfast">
                  <div className="relative flex items-center">
                    <Input
                      type={showSecretKey ? "text" : "password"}
                      value={steadfastSecretKey}
                      onChange={(e) => setSteadfastSecretKey(e.target.value)}
                      placeholder="Paste your Steadfast Secret Key"
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="API Base URL" hint="Default is https://portal.packzy.com/api/v1">
                  <Input
                    value={steadfastBaseUrl}
                    onChange={(e) => setSteadfastBaseUrl(e.target.value)}
                    placeholder="https://portal.packzy.com/api/v1"
                    className="font-mono text-xs"
                  />
                </Field>

                {connectionTestResult && (
                  <div
                    className={cn(
                      "p-3.5 rounded-xl border flex items-start gap-2.5 text-xs",
                      connectionTestResult.success
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-rose-50/80 border-rose-200 text-rose-900"
                    )}
                  >
                    {connectionTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{connectionTestResult.message}</p>
                      {connectionTestResult.balance !== undefined && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Steadfast Courier API is fully authenticated and ready for 1-Click dispatches.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleSaveSteadfast}
                disabled={isSteadfastSaving}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
              >
                {isSteadfastSaving ? "Saving to Database…" : "Save Steadfast Credentials"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestSteadfast}
                disabled={isTestingConnection}
                className="border-zinc-300 font-semibold gap-2"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isTestingConnection && "animate-spin")} />
                {isTestingConnection ? "Testing Gateway…" : "Test Connection & Balance"}
              </Button>
            </div>

            {/* Steadfast Webhook Setup Card */}
            <Card className="border-amber-200/80 bg-linear-to-br from-amber-50/50 via-white to-amber-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <Globe className="w-4 h-4" />
                  </span>
                  <div>
                    <CardTitle className="text-sm font-bold text-zinc-900">Steadfast Live Webhook Listener</CardTitle>
                    <CardDescription className="text-xs text-zinc-600 mt-0.5">
                      Receive real-time parcel status updates (Delivered, In Transit, Returned, Cancelled) automatically.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-zinc-700 leading-relaxed">
                  Paste this Webhook URL in your{" "}
                  <a
                    href="https://portal.packzy.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-amber-900 underline hover:text-amber-700"
                  >
                    Steadfast Merchant Dashboard
                  </a>{" "}
                  under <strong>Settings &rarr; Webhook / API</strong>:
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs border border-zinc-800">
                  <span className="flex-1 truncate select-all text-amber-300">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/webhooks/steadfast`
                      : "https://www.berber.clothing/api/webhooks/steadfast"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const url =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/api/webhooks/steadfast`
                          : "https://www.berber.clothing/api/webhooks/steadfast"
                      navigator.clipboard.writeText(url)
                      setCopiedWebhook(true)
                      toast.success("Copied Steadfast Webhook URL to clipboard!")
                      setTimeout(() => setCopiedWebhook(false), 2000)
                    }}
                    className="h-7 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1.5"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                <div className="pt-2 border-t border-amber-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800">
                      Webhook Bearer Token / Secret (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const token = "sf_sec_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
                        setSteadfastWebhookSecret(token)
                        toast.success("Generated secure Webhook Bearer Token. Click 'Save Steadfast Credentials' to save.")
                      }}
                      className="text-[11px] font-semibold text-amber-900 hover:text-amber-700 underline"
                    >
                      ⚡ Auto-Generate Token
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={steadfastWebhookSecret}
                      onChange={(e) => setSteadfastWebhookSecret(e.target.value)}
                      placeholder="Paste token or leave empty to use Secret Key / open verification"
                      className="font-mono text-xs bg-white"
                    />
                    {steadfastWebhookSecret && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(steadfastWebhookSecret)
                          setCopiedBearer(true)
                          toast.success("Copied Bearer Token to clipboard!")
                          setTimeout(() => setCopiedBearer(false), 2000)
                        }}
                        className="h-9 px-3 text-xs border-amber-300 gap-1.5 shrink-0"
                      >
                        {copiedBearer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBearer ? "Copied" : "Copy Token"}</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    If set, incoming webhooks must include <code>Authorization: Bearer &lt;TOKEN&gt;</code> or <code>Secret-Key: &lt;TOKEN&gt;</code>.
                  </p>
                </div>

                <div className="text-[11px] text-zinc-500 space-y-1 pt-1">
                  <p>&bull; Automatically synchronizes delivery states: <code>DELIVERED</code>, <code>IN_TRANSIT</code>, <code>CANCELLED</code>, <code>RETURNED</code>.</p>
                  <p>&bull; Marks Cash on Delivery (COD) payment status as <code>PAID</code> when delivery is confirmed.</p>
                  <p>&bull; Sends instant email updates to customers upon successful delivery.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shipping & Tax */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Shipping & Tax</h2>
              <p className="text-sm text-muted-foreground">Flat shipping rates and VAT configuration.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Shipping Rates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Flat Shipping Charge (৳)">
                    <Input type="number" min="0" value={shippingChargeAmount} onChange={(e) => setShippingChargeAmount(e.target.value)} />
                  </Field>
                  <Field label="Free Shipping Above (৳)">
                    <Input type="number" min="0" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} placeholder="Leave blank to disable" />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">For zone-based rates, use <a href="/admin/shipping-zones" className="underline">Shipping Zones</a>.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">VAT / Tax</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Enable tax at checkout"
                  description="Calculated on subtotal, shown as a separate line"
                  checked={taxEnabled} onChange={setTaxEnabled}
                />
                {taxEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tax Rate (%)">
                      <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="e.g. 5" />
                    </Field>
                    <Field label="Tax Label">
                      <Input value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} placeholder="VAT" />
                    </Field>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button onClick={handleSaveShippingTax} disabled={isShippingTaxSaving}>{isShippingTaxSaving ? "Saving…" : "Save Shipping & Tax"}</Button>
          </div>
        )}

        {/* Email / SMTP */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Email / SMTP</h2>
              <p className="text-sm text-muted-foreground">All transactional emails route through this config. Leave blank to use the built-in Resend relay.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">SMTP Server</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Field label="SMTP Host"><Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" /></Field>
                  </div>
                  <Field label="Port"><Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" /></Field>
                </div>
                <ToggleRow
                  label="Use SSL/TLS (port 465)"
                  description="Disable to use STARTTLS on port 587"
                  checked={smtpSecure} onChange={setSmtpSecure}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SMTP Username"><Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="noreply@store.com" /></Field>
                  <Field label="SMTP Password"><Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="App password" /></Field>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Sender Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="From Name"><Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="Berber" /></Field>
                  <Field label="From Email"><Input type="email" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="noreply@store.com" /></Field>
                </div>
                <Field label="Admin Notification Email" hint="Receives an email every time a new order is placed. Falls back to Support Email if empty.">
                  <Input type="email" value={adminNotificationEmail} onChange={(e) => setAdminNotificationEmail(e.target.value)} placeholder="orders@store.com" />
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveSmtp} disabled={isSmtpSaving}>{isSmtpSaving ? "Saving…" : "Save SMTP Settings"}</Button>
            <Card>
              <CardHeader><CardTitle className="text-base">Abandoned Cart Recovery</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Send abandoned cart emails"
                  description="Emails a customer's saved cart 1 hour and 24 hours after they leave it idle (24h email includes a discount code if a COMEBACK coupon is active)."
                  checked={abandonedCartEmailEnabled} onChange={setAbandonedCartEmailEnabled}
                />
                <Button onClick={handleSaveAbandonedCart} disabled={isAbandonedCartSaving}>
                  {isAbandonedCartSaving ? "Saving…" : "Save Abandoned Cart Settings"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Email</CardTitle>
                <CardDescription>Verify your config by sending a test. Save settings above first.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} placeholder="your@email.com" className="flex-1" />
                  <Button variant="outline" onClick={handleSendTestEmail} disabled={isSendingTest}>
                    {isSendingTest ? "Sending…" : "Send Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tracking & SEO */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Tracking & SEO</h2>
              <p className="text-sm text-muted-foreground">Analytics IDs and default meta tags.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Analytics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Google Analytics 4 (GA4)" hint="e.g. G-XXXXXXXXXX">
                  <Input value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} placeholder="G-XXXXXXXXXX" />
                </Field>
                <Field label="Meta Pixel ID" hint="e.g. 123456789012345">
                  <Input value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} placeholder="123456789012345" />
                </Field>
                <Field label="Microsoft Clarity ID" hint="e.g. abc123xyz">
                  <Input value={clarityId} onChange={(e) => setClarityId(e.target.value)} placeholder="abc123xyz" />
                </Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Default SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Site Title">
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Berber | Wear Your Story" />
                </Field>
                <Field label="Meta Description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveTracking} disabled={isTrackingSaving}>{isTrackingSaving ? "Saving…" : "Save Tracking & SEO"}</Button>
          </div>
        )}

        {/* Staff */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Staff</h2>
                <p className="text-sm text-muted-foreground">Manage administrators and staff access.</p>
              </div>
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger render={<Button size="sm">Add Staff</Button>} />
                <DialogContent>
                  <DialogHeader><DialogTitle>Add a Staff Member</DialogTitle></DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4 mt-4">
                    <Field label="Email Address">
                      <Input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com" />
                    </Field>
                    <Field label="Role">
                      <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "STAFF")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff (Limited Access)</SelectItem>
                          <SelectItem value="ADMIN">Administrator (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button type="submit" className="w-full">Add Staff Member</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No staff members yet.</TableCell>
                      </TableRow>
                    ) : (
                      initialStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                          <TableCell>
                            <Select value={staff.role} onValueChange={(val) => handleRoleChange(staff.id, val || "")}>
                              <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveStaff(staff.id, staff.name)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Small helper components
function Field({ label, hint, indent, children }: { label: string; hint?: string; indent?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", indent && "ml-4 pl-4 border-l border-border")}>
      <label className="flex items-center gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs text-muted-foreground font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
