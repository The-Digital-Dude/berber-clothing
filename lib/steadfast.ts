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

// Matches the REAL /fraud_check/score/{phone} response shape (confirmed
// against a live call -- the previous version of this interface guessed
// field names like total_parcels/delivered_parcels/success_rate that don't
// exist anywhere in Steadfast's actual response, so every check silently
// fell back to zeros no matter what Steadfast actually returned).
export interface SteadfastFraudReport {
  deliveryRatio: number | null // percentage, e.g. 95 = 95%
  cancellationRatio: number | null
  returnRatio: number | null
  totalReports: number // fraud reports logged by other merchants on this network
  doubtfulReports: boolean
  fraudCategories: string[]
  volumeBand: string | null // Steadfast's own qualitative parcel-volume bucket, e.g. "high" | "low"
  score: number | null // Steadfast's own numeric fraud score, when it has enough data to produce one
  level: string | null // Steadfast's own risk level, when available
  scoringDisabled: boolean // true when Steadfast doesn't yet have enough history to score this phone
  risk_level: "LOW" | "MEDIUM" | "HIGH"
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

    const deliveryRatio = typeof data.delivery_ratio === "number" ? data.delivery_ratio : null
    const cancellationRatio = typeof data.cancellation_ratio === "number" ? data.cancellation_ratio : null
    const returnRatio = typeof data.return_ratio === "number" ? data.return_ratio : null
    const totalReports = Number(data.total_reports || 0)
    const doubtfulReports = !!data.doubtful_reports
    const fraudCategories = Array.isArray(data.fraud_categories) ? data.fraud_categories : []
    const volumeBand = data.volume_band ?? null
    const score = typeof data.score === "number" ? data.score : null
    const level = data.level ?? null
    const scoringDisabled = !!data.scoring_disabled

    // Prefer Steadfast's own level/score when it has enough data to produce
    // one; fall back to our own thresholds on the raw ratios otherwise.
    let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW"
    if (totalReports > 0 || doubtfulReports) {
      risk = "HIGH"
    } else if (level && ["LOW", "MEDIUM", "HIGH"].includes(String(level).toUpperCase())) {
      risk = String(level).toUpperCase() as "LOW" | "MEDIUM" | "HIGH"
    } else if (deliveryRatio !== null) {
      if (deliveryRatio < 50) risk = "HIGH"
      else if (deliveryRatio < 80) risk = "MEDIUM"
    }

    return {
      deliveryRatio,
      cancellationRatio,
      returnRatio,
      totalReports,
      doubtfulReports,
      fraudCategories,
      volumeBand,
      score,
      level,
      scoringDisabled,
      risk_level: risk,
      raw: data,
    }
  } catch {
    return null
  }
}
