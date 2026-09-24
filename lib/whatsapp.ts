// WhatsApp notification helper
// Uses wa.me deep-links (works without API key) or WhatsApp Business Cloud API
// Set WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID in .env to use the Cloud API.
// Without those env vars, falls back to generating a wa.me link for manual send.

const WA_TOKEN = process.env.WHATSAPP_API_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

const STATUS_EMOJI: Record<string, string> = {
  CONFIRMED: "✅",
  PROCESSING: "⚙️",
  PACKED: "📦",
  SHIPPED: "🚚",
  DELIVERED: "🎉",
  CANCELLED: "❌",
}

export function buildWhatsAppMessage(params: {
  customerName: string
  orderNumber: string
  status: string
  trackingNumber?: string
  note?: string
}): string {
  const { customerName, orderNumber, status, trackingNumber, note } = params
  const emoji = STATUS_EMOJI[status] ?? "📋"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.berber.clothing"

  let msg = `${emoji} *Berber Order Update*\n\nHi ${customerName},\n\nYour order *#${orderNumber}* status is now: *${status}*`

  if (status === "SHIPPED" && trackingNumber) {
    msg += `\n\n🔍 Tracking: ${trackingNumber}`
  }
  if (note) {
    msg += `\n\n📝 ${note}`
  }

  msg += `\n\n🔗 Track your order: ${siteUrl}/order/${orderNumber}`
  msg += `\n\nThank you for shopping with Berber! 🛍️`

  return msg
}

export function buildWaLink(phone: string, message: string): string {
  // Normalize BD phone: strip leading 0, add 880
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "880").replace(/^(?!880)/, "880")
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

// Send via WhatsApp Business Cloud API (Meta)
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!WA_TOKEN || !WA_PHONE_ID) return false

  const normalized = phone.replace(/\D/g, "").replace(/^0/, "880").replace(/^(?!880)/, "880")

  const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalized,
      type: "text",
      text: { body: message },
    }),
  })

  return res.ok
}
