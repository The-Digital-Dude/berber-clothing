import prisma from "@/lib/prisma"

export interface SteadfastConfig {
  baseUrl: string
  apiKey: string
  secretKey: string
  webhookSecret?: string
}

const DEFAULT_BASE_URL = "https://portal.packzy.com/api/v1"

/**
 * Resolves Steadfast credentials dynamically from the database Settings table first,
 * with graceful fallback to environment variables.
 */
export async function getSteadfastConfig(): Promise<SteadfastConfig> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ["steadfast_api_key", "steadfast_secret_key", "steadfast_base_url", "steadfast_webhook_secret"],
        },
      },
    })

    const map = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    const apiKey = map["steadfast_api_key"] || process.env.STEADFAST_API_KEY || ""
    const secretKey = map["steadfast_secret_key"] || process.env.STEADFAST_SECRET_KEY || ""
    const baseUrl = map["steadfast_base_url"] || process.env.STEADFAST_BASE_URL || DEFAULT_BASE_URL
    const webhookSecret = map["steadfast_webhook_secret"] || process.env.STEADFAST_WEBHOOK_SECRET || ""

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""), // strip trailing slashes
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      webhookSecret: webhookSecret.trim(),
    }
  } catch {
    // If DB read fails during build / standalone execution, fallback to env vars
    return {
      baseUrl: (process.env.STEADFAST_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
      apiKey: (process.env.STEADFAST_API_KEY || "").trim(),
      secretKey: (process.env.STEADFAST_SECRET_KEY || "").trim(),
      webhookSecret: (process.env.STEADFAST_WEBHOOK_SECRET || "").trim(),
    }
  }
}

function getHeaders(config: SteadfastConfig) {
  return {
    "Content-Type": "application/json",
    "Api-Key": config.apiKey,
    "Secret-Key": config.secretKey,
  }
}

export interface SteadfastOrder {
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number
  note?: string
}

export interface SteadfastConsignment {
  consignment_id: number
  tracking_code: string
  status: string
}

export interface SteadfastFraudReport {
  total_parcels?: number
  delivered_parcels?: number
  cancelled_parcels?: number
  success_rate?: number
  fraud_reports?: number
  risk_level?: "LOW" | "MEDIUM" | "HIGH"
  raw?: any
}

/**
 * Tests connection with Steadfast API and checks current account balance.
 */
export async function testSteadfastConnection(overrideConfig?: Partial<SteadfastConfig>): Promise<{
  success: boolean
  balance?: number
  message: string
  raw?: any
}> {
  const currentConfig = await getSteadfastConfig()
  const config: SteadfastConfig = {
    baseUrl: (overrideConfig?.baseUrl || currentConfig.baseUrl).replace(/\/+$/, ""),
    apiKey: (overrideConfig?.apiKey ?? currentConfig.apiKey).trim(),
    secretKey: (overrideConfig?.secretKey ?? currentConfig.secretKey).trim(),
  }

  if (!config.apiKey || !config.secretKey) {
    return {
      success: false,
      message: "API Key and Secret Key are required.",
    }
  }

  try {
    const res = await fetch(`${config.baseUrl}/get_balance`, {
      method: "GET",
      headers: getHeaders(config),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `HTTP ${res.status} error`
      return {
        success: false,
        message: `Steadfast connection failed: ${errMsg}`,
        raw: data,
      }
    }

    if (data?.status === 200 || data?.current_balance !== undefined) {
      return {
        success: true,
        balance: data.current_balance ?? 0,
        message: `Connected successfully! Current Steadfast Balance: ৳${data.current_balance ?? 0}`,
        raw: data,
      }
    }

    return {
      success: false,
      message: data?.message || "Invalid response from Steadfast API.",
      raw: data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach Steadfast API gateway.",
    }
  }
}

export async function createConsignment(order: SteadfastOrder): Promise<SteadfastConsignment> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured in Admin Settings.")
  }

  const res = await fetch(`${config.baseUrl}/create_order`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(order),
  })

  const data = await res.json()
  if (!res.ok || data.status !== 200) {
    const errorMsg = data?.message || (data?.errors ? JSON.stringify(data.errors) : `HTTP ${res.status}`)
    throw new Error(`Steadfast parcel creation failed: ${errorMsg}`)
  }

  return data.consignment
}

export async function getConsignmentStatus(consignmentId: string): Promise<{ status: string }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/status_by_cid/${consignmentId}`, {
    headers: getHeaders(config),
  })
  if (!res.ok) throw new Error(`Steadfast status check failed: ${res.status}`)
  const data = await res.json()
  return { status: data.delivery_status }
}

export async function bulkCreate(orders: SteadfastOrder[]): Promise<SteadfastConsignment[]> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured in Admin Settings.")
  }

  const res = await fetch(`${config.baseUrl}/create_order/bulk-order`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(orders),
  })

  if (!res.ok) throw new Error(`Steadfast bulk create failed: ${res.status}`)
  const data = await res.json()
  return data.consignment ?? data.data ?? []
}

/**
 * Checks customer delivery history and fraud score across Steadfast merchant network
 * Endpoint: GET /fraud_check/score/{phone}
 */
export async function checkSteadfastFraud(phone: string, forceFresh = false): Promise<SteadfastFraudReport | null> {
  const cleanPhone = phone.trim().replace(/^(\+880|880)/, "0").replace(/[^0-9]/g, "")
  if (!cleanPhone || cleanPhone.length < 11) return null

  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    return null
  }

  try {
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: getHeaders(config),
      ...(forceFresh ? { cache: "no-store" } : { next: { revalidate: 300 } }),
    }

    const res = await fetch(`${config.baseUrl}/fraud_check/score/${cleanPhone}`, fetchOptions)

    if (!res.ok) return null
    const data = await res.json()

    // Steadfast returns fraud metrics / scoring
    const total = data.total_parcels ?? data.total_orders ?? data.total ?? 0
    const delivered = data.delivered_parcels ?? data.delivered ?? 0
    const cancelled = data.cancelled_parcels ?? data.cancelled ?? data.returned ?? 0
    const reports = data.fraud_reports ?? data.reports ?? 0

    let rate: number | undefined = undefined
    if (total > 0) {
      rate = delivered / total
    } else if (data.success_rate !== undefined) {
      rate = Number(data.success_rate) > 1 ? Number(data.success_rate) / 100 : Number(data.success_rate)
    }

    let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW"
    if (reports > 0 || (rate !== undefined && total >= 3 && rate < 0.5)) {
      risk = "HIGH"
    } else if (rate !== undefined && total >= 2 && rate < 0.8) {
      risk = "MEDIUM"
    }

    return {
      total_parcels: total,
      delivered_parcels: delivered,
      cancelled_parcels: cancelled,
      success_rate: rate,
      fraud_reports: reports,
      risk_level: risk,
      raw: data,
    }
  } catch {
    return null
  }
}
