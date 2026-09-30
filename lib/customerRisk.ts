import prisma from "@/lib/prisma"
import { checkSteadfastFraud, type SteadfastFraudReport } from "@/lib/steadfast"

export type RiskLevel = "NEW" | "LOW" | "MEDIUM" | "HIGH"

export type CustomerRisk = {
  phone: string
  totalOrders: number
  delivered: number
  returnedOrCancelled: number
  pending: number
  successRate: number | null // null when not enough history to judge
  riskLevel: RiskLevel
  steadfast?: SteadfastFraudReport | null
  fraudWarning?: string | null
}

const FAILED_STATUSES = ["CANCELLED", "RETURNED"] as const
const SETTLED_STATUSES = ["DELIVERED", "CANCELLED", "RETURNED"] as const

/**
 * Computes a phone number's delivery track record from our own store history
 * combined with real-time Steadfast Courier Network fraud checks.
 */
export async function getCustomerRisk(phone: string): Promise<CustomerRisk> {
  const normalizedPhone = phone.trim()

  const [orders, sfFraud] = await Promise.all([
    prisma.order.findMany({
      where: { shippingPhone: normalizedPhone },
      select: { status: true },
    }),
    checkSteadfastFraud(normalizedPhone),
  ])

  const totalOrders = orders.length
  const delivered = orders.filter((o) => o.status === "DELIVERED").length
  const returnedOrCancelled = orders.filter((o) =>
    FAILED_STATUSES.includes(o.status as (typeof FAILED_STATUSES)[number])
  ).length
  const settled = orders.filter((o) =>
    SETTLED_STATUSES.includes(o.status as (typeof SETTLED_STATUSES)[number])
  ).length
  const pending = totalOrders - settled

  // Need at least 2 settled orders before we trust internal success rate
  const internalSuccessRate = settled >= 2 ? delivered / settled : null

  let riskLevel: RiskLevel = "NEW"
  let fraudWarning: string | null = null

  // 1. Evaluate internal store history
  if (internalSuccessRate !== null) {
    if (internalSuccessRate >= 0.8) riskLevel = "LOW"
    else if (internalSuccessRate >= 0.5) riskLevel = "MEDIUM"
    else {
      riskLevel = "HIGH"
      fraudWarning = `Internal history: ${returnedOrCancelled} cancelled/returned out of ${settled} settled orders.`
    }
  }

  // 2. Evaluate Steadfast Courier Network Fraud check
  if (sfFraud) {
    if (sfFraud.fraud_reports && sfFraud.fraud_reports > 0) {
      riskLevel = "HIGH"
      fraudWarning = `Steadfast Alert: ${sfFraud.fraud_reports} fraud report(s) logged across courier network.`
    } else if (sfFraud.risk_level === "HIGH") {
      riskLevel = "HIGH"
      fraudWarning = `Steadfast Network: High return risk (${sfFraud.delivered_parcels ?? 0} delivered / ${sfFraud.cancelled_parcels ?? 0} returned).`
    } else if (sfFraud.risk_level === "MEDIUM" && riskLevel !== "HIGH") {
      riskLevel = "MEDIUM"
      fraudWarning = `Steadfast Network: Moderate return rate (${Math.round((sfFraud.success_rate ?? 0) * 100)}% delivery success).`
    }
  }

  return {
    phone: normalizedPhone,
    totalOrders,
    delivered,
    returnedOrCancelled,
    pending,
    successRate: internalSuccessRate,
    riskLevel,
    steadfast: sfFraud,
    fraudWarning,
  }
}

/** Batch version — avoids N+1 queries when rendering an admin order list. */
export async function getCustomerRiskBatch(phones: string[]): Promise<Map<string, CustomerRisk>> {
  const uniquePhones = Array.from(new Set(phones.map((p) => p.trim())))
  if (uniquePhones.length === 0) return new Map()

  const orders = await prisma.order.findMany({
    where: { shippingPhone: { in: uniquePhones } },
    select: { shippingPhone: true, status: true },
  })

  const byPhone = new Map<string, { status: string }[]>()
  for (const o of orders) {
    const list = byPhone.get(o.shippingPhone) ?? []
    list.push(o)
    byPhone.set(o.shippingPhone, list)
  }

  const result = new Map<string, CustomerRisk>()
  for (const phone of uniquePhones) {
    const phoneOrders = byPhone.get(phone) ?? []
    const totalOrders = phoneOrders.length
    const delivered = phoneOrders.filter((o) => o.status === "DELIVERED").length
    const returnedOrCancelled = phoneOrders.filter((o) =>
      FAILED_STATUSES.includes(o.status as (typeof FAILED_STATUSES)[number])
    ).length
    const settled = phoneOrders.filter((o) =>
      SETTLED_STATUSES.includes(o.status as (typeof SETTLED_STATUSES)[number])
    ).length
    const pending = totalOrders - settled
    const successRate = settled >= 2 ? delivered / settled : null

    let riskLevel: RiskLevel = "NEW"
    if (successRate !== null) {
      if (successRate >= 0.8) riskLevel = "LOW"
      else if (successRate >= 0.5) riskLevel = "MEDIUM"
      else riskLevel = "HIGH"
    }

    result.set(phone, {
      phone,
      totalOrders,
      delivered,
      returnedOrCancelled,
      pending,
      successRate,
      riskLevel,
    })
  }

  return result
}
