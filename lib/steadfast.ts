import prisma from "@/lib/prisma"

export interface SteadfastConfig {
  baseUrl: string
  apiKey: string
  secretKey: string
  webhookSecret?: string
}

export const DEFAULT_PACKZY_BASE_URL = "https://portal.packzy.com/api/v1"

/**
 * Sanitizes input according to Packzy API rules:
 * Replaces characters { } ; < > $ with a space, and truncates to max length.
 */
export function sanitizePackzyText(input: string | undefined | null, maxLength = 480): string {
  if (!input) return ""
  const sanitized = String(input).replace(/[{}\;<>\\$]/g, " ").trim()
  return sanitized.slice(0, maxLength)
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

export interface TrackingStep {
  status: string
  message?: string
  updated_at?: string
  created_at?: string
  note?: string
  hub?: string
  [key: string]: any
}

export interface SteadfastFraudReport {
  deliveryRatio: number | null
  cancellationRatio: number | null
  returnRatio: number | null
  totalReports: number
  doubtfulReports: boolean
  fraudCategories: string[]
  volumeBand: string | null
  score: number | null
  level: string | null
  scoringDisabled: boolean
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  raw?: any
}

export interface PayoutRecord {
  id: string | number
  payment_id?: string | number
  amount: number
  status: string
  date?: string
  created_at?: string
  parcels_count?: number
  [key: string]: any
}

/**
 * Resolves Steadfast / Packzy credentials dynamically from database Settings first,
 * with fallback to environment variables.
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

    const apiKey = map["steadfast_api_key"] || process.env.STEADFAST_API_KEY || "ligglgmw4l1nsbzzvzl5nd283w0ctkky"
    const secretKey = map["steadfast_secret_key"] || process.env.STEADFAST_SECRET_KEY || "g3dstujbozfzmkbs8ghsgqtr"
    const baseUrl = map["steadfast_base_url"] || process.env.STEADFAST_BASE_URL || DEFAULT_PACKZY_BASE_URL
    const webhookSecret = map["steadfast_webhook_secret"] || process.env.STEADFAST_WEBHOOK_SECRET || ""

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      webhookSecret: webhookSecret.trim(),
    }
  } catch {
    return {
      baseUrl: (process.env.STEADFAST_BASE_URL || DEFAULT_PACKZY_BASE_URL).replace(/\/+$/, ""),
      apiKey: (process.env.STEADFAST_API_KEY || "ligglgmw4l1nsbzzvzl5nd283w0ctkky").trim(),
      secretKey: (process.env.STEADFAST_SECRET_KEY || "g3dstujbozfzmkbs8ghsgqtr").trim(),
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

/**
 * Service Ping Check (GET /ping) — No auth required.
 */
export async function pingPackzy(baseUrl?: string): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    const url = (baseUrl || DEFAULT_PACKZY_BASE_URL).replace(/\/+$/, "")
    const res = await fetch(`${url}/ping`, { cache: "no-store" })
    const data = await res.json().catch(() => null)
    if (res.ok && (data?.status === 200 || data?.message === "pong")) {
      return { success: true, data, message: "Packzy API service is reachable and active." }
    }
    return { success: false, data, message: `Ping failed with HTTP ${res.status}` }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to reach Packzy /ping" }
  }
}

/**
 * Tests connection with Packzy / Steadfast API and checks current account balance.
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
        message: `Connected successfully! Current Balance: ৳${data.current_balance ?? 0}`,
        raw: data,
      }
    }

    return {
      success: false,
      message: data?.message || "Invalid response from Packzy API.",
      raw: data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach Packzy API gateway.",
    }
  }
}

/**
 * Creates a single parcel consignment (POST /create_order)
 */
export async function createConsignment(order: SteadfastOrder): Promise<SteadfastConsignment> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured.")
  }

  const payload = {
    invoice: sanitizePackzyText(order.invoice, 100),
    recipient_name: sanitizePackzyText(order.recipient_name, 100),
    recipient_phone: sanitizePackzyText(order.recipient_phone, 40),
    recipient_address: sanitizePackzyText(order.recipient_address, 490),
    cod_amount: Math.round(Number(order.cod_amount) || 0),
    ...(order.note ? { note: sanitizePackzyText(order.note, 480) } : {}),
  }

  const res = await fetch(`${config.baseUrl}/create_order`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status !== 200) {
    const errorMsg = data?.message || (data?.errors ? JSON.stringify(data.errors) : `HTTP ${res.status}`)
    throw new Error(`Steadfast parcel creation failed: ${errorMsg}`)
  }

  return data.consignment
}

/**
 * Bulk create consignments (POST /create_order/bulk-order)
 */
export async function bulkCreate(orders: SteadfastOrder[]): Promise<SteadfastConsignment[]> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured.")
  }

  const sanitized = orders.map((order) => ({
    invoice: sanitizePackzyText(order.invoice, 100),
    recipient_name: sanitizePackzyText(order.recipient_name, 100),
    recipient_phone: sanitizePackzyText(order.recipient_phone, 40),
    recipient_address: sanitizePackzyText(order.recipient_address, 490),
    cod_amount: Math.round(Number(order.cod_amount) || 0),
    ...(order.note ? { note: sanitizePackzyText(order.note, 480) } : {}),
  }))

  const res = await fetch(`${config.baseUrl}/create_order/bulk-order`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(sanitized),
  })

  if (!res.ok) throw new Error(`Steadfast bulk create failed: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return data.consignment ?? data.data ?? []
}

/**
 * Status by Consignment ID (GET /status_by_cid/{consignment_id})
 */
export async function getConsignmentStatus(consignmentId: string | number): Promise<{ status: string; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/status_by_cid/${consignmentId}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Steadfast status check failed: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return { status: data.delivery_status || data.status, raw: data }
}

/**
 * Status with Return Status (GET /status_with_return_status_by_cid/{consignment_id})
 */
export async function getConsignmentStatusWithReturn(
  consignmentId: string | number
): Promise<{ status: string; return_status?: string; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/status_with_return_status_by_cid/${consignmentId}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Steadfast return status check failed: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return {
    status: data.delivery_status || data.status,
    return_status: data.return_status,
    raw: data,
  }
}

/**
 * Status by Invoice Number (GET /status_by_invoice/{invoice})
 */
export async function getStatusByInvoice(invoice: string): Promise<{ status: string; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/status_by_invoice/${encodeURIComponent(invoice)}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Steadfast invoice status check failed: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return { status: data.delivery_status || data.status, raw: data }
}

/**
 * Status by Tracking Code (GET /status_by_trackingcode/{tracking_code})
 */
export async function getStatusByTrackingCode(trackingCode: string): Promise<{ status: string; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Steadfast tracking code status check failed: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return { status: data.delivery_status || data.status, raw: data }
}

/**
 * Detailed step-by-step movement tracking history (GET /trackings_by_invoice/{invoice})
 */
export async function getTrackingTimeline(invoice: string): Promise<TrackingStep[]> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) return []

  try {
    const res = await fetch(`${config.baseUrl}/trackings_by_invoice/${encodeURIComponent(invoice)}`, {
      headers: getHeaders(config),
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.trackings)) return data.trackings
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch {
    return []
  }
}

/**
 * Schedules a courier pickup request (POST /create_pickup_request)
 */
export async function createPickupRequest(payload: {
  pickup_address: string
  note?: string
  phone?: string
}): Promise<{ success: boolean; message: string; data?: any }> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured.")
  }

  const res = await fetch(`${config.baseUrl}/create_pickup_request`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify({
      pickup_address: sanitizePackzyText(payload.pickup_address, 490),
      note: sanitizePackzyText(payload.note, 480),
      ...(payload.phone ? { phone: sanitizePackzyText(payload.phone, 40) } : {}),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status !== 200) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`
    return { success: false, message: msg, data }
  }

  return { success: true, message: data.message || "Pickup request scheduled successfully", data }
}

/**
 * Creates a return request for a parcel (POST /create_return_request)
 */
export async function createReturnRequest(payload: {
  consignment_id?: string | number
  invoice?: string
  reason?: string
}): Promise<{ success: boolean; message: string; data?: any }> {
  const config = await getSteadfastConfig()
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Steadfast API Key or Secret Key is not configured.")
  }

  const res = await fetch(`${config.baseUrl}/create_return_request`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify({
      ...(payload.consignment_id ? { consignment_id: payload.consignment_id } : {}),
      ...(payload.invoice ? { invoice: sanitizePackzyText(payload.invoice, 100) } : {}),
      reason: sanitizePackzyText(payload.reason || "Customer Return", 480),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status !== 200) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`
    return { success: false, message: msg, data }
  }

  return { success: true, message: data.message || "Return request submitted successfully", data }
}

/**
 * Fetches list of return requests (GET /get_return_requests)
 */
export async function getReturnRequests(page = 1): Promise<{ data: any[]; meta?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/get_return_requests?page=${page}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) return { data: [] }
  const json = await res.json().catch(() => ({}))
  return {
    data: json.data || [],
    meta: json.meta || null,
  }
}

/**
 * Fetches single return request details (GET /get_return_request/{id})
 */
export async function getReturnRequestById(id: string | number): Promise<any> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/get_return_request/${id}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) return null
  return await res.json().catch(() => null)
}

/**
 * Fetches current balance (GET /get_balance)
 */
export async function getPackzyBalance(): Promise<{ balance: number; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/get_balance`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.status}`)
  const data = await res.json().catch(() => ({}))
  return { balance: Number(data.current_balance ?? 0), raw: data }
}

/**
 * Fetches payout settlements (GET /payments)
 */
export async function getPackzyPayouts(page = 1): Promise<{ payments: PayoutRecord[]; raw?: any }> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/payments?page=${page}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) return { payments: [] }
  const data = await res.json().catch(() => ({}))
  const list = data.payments || data.data || []
  return { payments: Array.isArray(list) ? list : [], raw: data }
}

/**
 * Fetches payout settlement details (GET /payments/{payment_id})
 */
export async function getPackzyPayoutById(paymentId: string | number): Promise<any> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/payments/${paymentId}`, {
    headers: getHeaders(config),
    cache: "no-store",
  })
  if (!res.ok) return null
  return await res.json().catch(() => null)
}

/**
 * Fetches deliverable police stations / thanas and districts (GET /police_stations)
 */
export async function getPoliceStations(): Promise<any[]> {
  const config = await getSteadfastConfig()
  const res = await fetch(`${config.baseUrl}/police_stations`, {
    headers: getHeaders(config),
    next: { revalidate: 86400 }, // Cache 24 hours
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.data || []
}

/**
 * Checks customer delivery history and fraud score across merchant network
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
    const doubtfulReports = !data.doubtful_reports
    const fraudCategories = Array.isArray(data.fraud_categories) ? data.fraud_categories : []
    const volumeBand = data.volume_band ?? null
    const score = typeof data.score === "number" ? data.score : null
    const level = data.level ?? null
    const scoringDisabled = !data.scoring_disabled

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
