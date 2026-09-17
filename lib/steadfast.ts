const BASE_URL = "https://portal.steadfast.com.bd/public/api/v1"

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
