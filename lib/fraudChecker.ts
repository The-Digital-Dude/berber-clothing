import prisma from "@/lib/prisma"

export type CourierBreakdown = {
  courier: string
  total: number
  success: number
  cancel: number
  deliveredPercentage: number
  returnPercentage: number
  rating?: string | null
}

export type FraudNetworkReport = {
  phone: string
  score: number | null
  status: "Safe" | "Moderate Risk" | "High Risk" | string
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  source: string
  totalParcel: number
  successParcel: number
  cancelParcel: number
  unresolvedReports: number
  communityReports: any[]
  couriers: CourierBreakdown[]
}

export type FraudApiConfig = { baseUrl: string; apiKey: string; domain: string }

const DEFAULT_BASE_URL = "https://fraudchecker.smartposbd.com"

/** Normalise any Bangladeshi mobile format to the 11-digit 01XXXXXXXXX form. */
export function normalizeBdPhone(input: string): string | null {
  const digits = String(input || "").replace(/[^0-9]/g, "")
  const local = digits.replace(/^(880)/, "0")
  return /^01[3-9][0-9]{8}$/.test(local) ? local : null
}

export async function getFraudApiConfig(): Promise<FraudApiConfig> {
  let map: Record<string, string> = {}
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["fraud_api_key", "fraud_api_base_url", "fraud_api_domain"] } },
    })
    map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch {
    /* fall back to env */
  }
  return {
    apiKey: (map.fraud_api_key || process.env.FRAUD_API_KEY || "").trim(),
    baseUrl: (map.fraud_api_base_url || process.env.FRAUD_API_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, ""),
    domain: (map.fraud_api_domain || process.env.FRAUD_API_DOMAIN || "").trim(),
  }
}

function toRisk(status: string, score: number | null, unresolved: number): "LOW" | "MEDIUM" | "HIGH" {
  if (unresolved > 0) return "HIGH"
  const s = status.toLowerCase()
  if (s.includes("high")) return "HIGH"
  if (s.includes("moderate")) return "MEDIUM"
  if (s.includes("safe")) return "LOW"
  if (score === null) return "LOW"
  return score >= 80 ? "LOW" : score >= 50 ? "MEDIUM" : "HIGH"
}

/**
 * Multi-courier fraud screening (Steadfast, Pathao, RedX, CarryBee, Paperfly)
 * through the Free Courier Fraud Screening API. Returns null when the API key
 * isn't configured or the lookup fails — callers treat that as "no data".
 */
export async function checkFraudNetwork(
  phone: string,
  forceFresh = false,
  overrideConfig?: Partial<FraudApiConfig>
): Promise<FraudNetworkReport | null> {
  const clean = normalizeBdPhone(phone)
  if (!clean) return null

  const base = await getFraudApiConfig()
  const config = { ...base, ...overrideConfig }
  if (!config.apiKey) return null

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/fraud-check/${clean}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": config.apiKey,
        ...(config.domain ? { "X-Domain": config.domain } : {}),
      },
      ...(forceFresh ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const data = await res.json()

    const score = typeof data.score === "number" ? data.score : data.score != null ? Number(data.score) : null
    const status = String(data.status || "")
    const unresolved = Number(data.unresolved_reports || 0)
    const couriers: CourierBreakdown[] = Object.entries<any>(data.response || {})
      .filter(([, v]) => v && v.status !== false && v.data)
      .map(([name, v]) => ({
        courier: name,
        total: Number(v.data.total || 0),
        success: Number(v.data.success || 0),
        cancel: Number(v.data.cancel || 0),
        deliveredPercentage: Number(v.data.deliveredPercentage || 0),
        returnPercentage: Number(v.data.returnPercentage || 0),
        rating: v.data.rating ?? null,
      }))

    return {
      phone: clean,
      score: score !== null && Number.isFinite(score) ? score : null,
      status,
      riskLevel: toRisk(status, score, unresolved),
      source: String(data.source || "live"),
      totalParcel: Number(data.total_parcel || 0),
      successParcel: Number(data.success_parcel || 0),
      cancelParcel: Number(data.cancel_parcel || 0),
      unresolvedReports: unresolved,
      communityReports: Array.isArray(data.community_reports) ? data.community_reports : [],
      couriers,
    }
  } catch {
    return null
  }
}
