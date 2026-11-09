import prisma from "@/lib/prisma"

const DEFAULT_BASE_URL = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"

export type BkashConfig = {
  baseUrl: string
  username: string
  password: string
  appKey: string
  appSecret: string
}

let cachedToken: string | null = null
let tokenExpiry: number | null = null
let cachedTokenFor: string | null = null

/**
 * bKash credentials are managed from Admin > Settings > Payments (stored in the
 * Setting table). Environment variables are only a fallback.
 */
export async function getBkashConfig(): Promise<BkashConfig> {
  let map: Record<string, string> = {}
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["bkash_username", "bkash_password", "bkash_app_key", "bkash_app_secret", "bkash_base_url"] } },
    })
    map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch {
    // fall through to env
  }
  return {
    baseUrl: (map.bkash_base_url || process.env.BKASH_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, ""),
    username: (map.bkash_username || process.env.BKASH_USERNAME || "").trim(),
    password: (map.bkash_password || process.env.BKASH_PASSWORD || "").trim(),
    appKey: (map.bkash_app_key || process.env.BKASH_APP_KEY || "").trim(),
    appSecret: (map.bkash_app_secret || process.env.BKASH_APP_SECRET || "").trim(),
  }
}

export function isBkashConfigComplete(c: BkashConfig) {
  return !!(c.username && c.password && c.appKey && c.appSecret)
}

/** True only when all four bKash credentials are saved. */
export async function isBkashConfigured() {
  return isBkashConfigComplete(await getBkashConfig())
}

async function authHeaders(config: BkashConfig) {
  const token = await getBkashToken(config)
  return {
    "Content-Type": "application/json",
    authorization: token || "",
    "x-app-key": config.appKey,
  }
}

export async function getBkashToken(config?: BkashConfig) {
  const cfg = config ?? (await getBkashConfig())
  if (!isBkashConfigComplete(cfg)) {
    throw new Error("bKash is not configured. Add the credentials in Admin > Settings > Payments.")
  }
  const fingerprint = `${cfg.baseUrl}|${cfg.appKey}|${cfg.username}`
  if (cachedToken && tokenExpiry && cachedTokenFor === fingerprint && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const res = await fetch(`${cfg.baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: cfg.username,
      password: cfg.password,
    },
    body: JSON.stringify({ app_key: cfg.appKey, app_secret: cfg.appSecret }),
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Token Grant Failed: ${errorText}`)
  }

  const data = await res.json()

  if (data.id_token) {
    cachedToken = data.id_token
    cachedTokenFor = fingerprint
    // expires_in is in seconds, buffer 1 minute
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return cachedToken
  }

  throw new Error(`Failed to extract bKash token: ${JSON.stringify(data)}`)
}

export async function createPayment(amount: number, orderId: string) {
  const config = await getBkashConfig()
  const headers = await authHeaders(config)
  const res = await fetch(`${config.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "0011", // checkout
      payerReference: orderId,
      callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/payments/bkash/callback?orderId=${orderId}`,
      amount: amount.toString(),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId,
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Create Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  if (data.bkashURL && data.paymentID) {
    return { bkashURL: data.bkashURL, paymentID: data.paymentID }
  }

  throw new Error(`Failed to create bKash payment: ${JSON.stringify(data)}`)
}

export async function executePayment(paymentID: string) {
  const config = await getBkashConfig()
  const headers = await authHeaders(config)
  const res = await fetch(`${config.baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      paymentID
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Execute Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  return data // typically includes transactionStatus, trxID, paymentID, amount, intent, etc.
}

export async function queryPayment(paymentID: string) {
  const config = await getBkashConfig()
  const headers = await authHeaders(config)
  const res = await fetch(`${config.baseUrl}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      paymentID
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Query Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  return data
}
