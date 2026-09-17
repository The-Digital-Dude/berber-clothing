import prisma from "@/lib/prisma"

const BASE = "https://api.brevo.com/v3"

function headers() {
  return {
    "Content-Type": "application/json",
    "api-key": process.env.BREVO_API_KEY || "",
  }
}

export async function brevoSubscribe(email: string, name?: string, listId?: number) {
  const lid = listId ?? Number(process.env.BREVO_LIST_ID || 0)
  if (!process.env.BREVO_API_KEY) return

  const [firstName, ...rest] = (name || "").split(" ")

  await fetch(`${BASE}/contacts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: firstName || "", LASTNAME: rest.join(" ") },
      listIds: lid ? [lid] : [],
      updateEnabled: true,
    }),
  }).catch(() => {})

  await prisma.marketingSubscriber.upsert({
    where: { email },
    create: { email, name, provider: "brevo", listId: String(lid || ""), syncedAt: new Date() },
    update: { syncedAt: new Date() },
  }).catch(() => {})
}

export async function brevoAddTags(email: string, tags: string[]) {
  if (!process.env.BREVO_API_KEY) return
  // Brevo uses attributes for tags; update contact attributes
  await fetch(`${BASE}/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ attributes: { TAGS: tags.join(",") } }),
  }).catch(() => {})
}

export async function brevoTrackEvent(email: string, event: string, properties?: Record<string, any>) {
  if (!process.env.BREVO_API_KEY) return
  await fetch(`${BASE}/trackEvent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, event, properties }),
  }).catch(() => {})
}

export async function brevoOrderPlaced(email: string, order: {
  orderNumber: string
  total: number
  items: { productName: string; quantity: number; price: number }[]
}) {
  await brevoTrackEvent(email, "order_placed", {
    order_id: order.orderNumber,
    order_total: order.total,
    items: order.items,
  })
}

export async function brevoUnsubscribe(email: string) {
  if (!process.env.BREVO_API_KEY) return
  await fetch(`${BASE}/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ emailBlacklisted: true }),
  }).catch(() => {})

  await prisma.marketingSubscriber.updateMany({
    where: { email },
    data: { status: "unsubscribed" },
  }).catch(() => {})
}
