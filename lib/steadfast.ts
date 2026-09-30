const BASE_URL = process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1"

function headers() {
  return {
    "Content-Type": "application/json",
    "Api-Key": process.env.STEADFAST_API_KEY ?? "",
    "Secret-Key": process.env.STEADFAST_SECRET_KEY ?? "",
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

export async function createConsignment(order: SteadfastOrder): Promise<SteadfastConsignment> {
  const res = await fetch(`${BASE_URL}/create_order`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(order),
  })
  if (!res.ok) throw new Error(`Steadfast create failed: ${res.status}`)
  const data = await res.json()
  return data.consignment
}

export async function getConsignmentStatus(consignmentId: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, { headers: headers() })
  if (!res.ok) throw new Error(`Steadfast status failed: ${res.status}`)
  const data = await res.json()
  return { status: data.delivery_status }
}

export async function bulkCreate(orders: SteadfastOrder[]): Promise<SteadfastConsignment[]> {
  const res = await fetch(`${BASE_URL}/create_order/bulk-order`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(orders),
  })
  if (!res.ok) throw new Error(`Steadfast bulk create failed: ${res.status}`)
  const data = await res.json()
  return data.consignment ?? []
}

/**
 * Checks customer delivery history and fraud score across Steadfast merchant network
 * Endpoint: GET /fraud_check/score/{phone}
 */
export async function checkSteadfastFraud(phone: string): Promise<SteadfastFraudReport | null> {
  const cleanPhone = phone.trim().replace(/^(\+880|880)/, "0").replace(/[^0-9]/g, "")
  if (!cleanPhone || cleanPhone.length < 11) return null

  try {
    const res = await fetch(`${BASE_URL}/fraud_check/score/${cleanPhone}`, {
      method: "GET",
      headers: headers(),
      next: { revalidate: 300 }, // cache for 5 mins
    })

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
