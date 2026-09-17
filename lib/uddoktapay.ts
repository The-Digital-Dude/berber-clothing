import prisma from "@/lib/prisma"

export interface UddoktaPayConfig {
  baseUrl: string
  apiKey: string
}

export interface UddoktaPayVerifyResponse {
  status: string
  invoice_id: string
  metadata?: { order_id?: string }
}

async function getSetting(key: string): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key } })
  return s?.value ?? ""
}

export async function getUddoktaPayConfig(): Promise<UddoktaPayConfig> {
  const [baseUrl, apiKey] = await Promise.all([
    getSetting("uddoktapay_base_url"),
    getSetting("uddoktapay_api_key"),
  ])
  return { baseUrl, apiKey }
}

export async function createCharge(
  params: {
    full_name: string
    email: string
    amount: number
    metadata: Record<string, string>
    redirect_url: string
    cancel_url: string
    webhook_url: string
  },
  config: UddoktaPayConfig
): Promise<{ payment_url: string; invoice_id: string }> {
  const res = await fetch(`${config.baseUrl}/api/checkout-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "RT-UDDOKTAPAY-API-KEY": config.apiKey },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`UddoktaPay charge failed: ${res.status}`)
  return res.json()
}

export async function verifyPayment(
  invoiceId: string,
  config: UddoktaPayConfig
): Promise<UddoktaPayVerifyResponse> {
  const res = await fetch(`${config.baseUrl}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "RT-UDDOKTAPAY-API-KEY": config.apiKey },
    body: JSON.stringify({ invoice_id: invoiceId }),
  })
  if (!res.ok) throw new Error(`UddoktaPay verify failed: ${res.status}`)
  return res.json()
}
