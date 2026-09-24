import crypto from "crypto"

const API_VERSION = "v21.0"

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

// Bangladeshi phone numbers are often entered without the country code —
// Meta requires E.164-ish digits (country code + number, no symbols) before hashing.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "")
  if (digits.startsWith("880")) return digits
  if (digits.startsWith("0")) return `880${digits.slice(1)}`
  return digits
}

type PurchaseEventInput = {
  eventId: string
  value: number
  currency?: string
  email?: string | null
  phone?: string | null
  eventSourceUrl?: string
  clientIp?: string | null
  userAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  /** Same dataset/Pixel ID the browser Pixel is initialized with — pass the resolved value (settings DB, falling back to env) so CAPI never drifts from the client Pixel. */
  datasetId?: string | null
}

/**
 * Sends a server-side Purchase event to Meta's Conversions API.
 * Uses the same eventId as the client-side Pixel Purchase event so Meta
 * deduplicates the two into a single conversion.
 * Never throws — a failed/misconfigured CAPI call must not break checkout.
 */
export async function sendPurchaseEvent(input: PurchaseEventInput): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const datasetId = input.datasetId || process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (!accessToken || !datasetId) return

  try {
    const userData: Record<string, unknown> = {}
    if (input.email) userData.em = [sha256(input.email)]
    if (input.phone) userData.ph = [sha256(normalizePhone(input.phone))]
    if (input.clientIp) userData.client_ip_address = input.clientIp
    if (input.userAgent) userData.client_user_agent = input.userAgent
    if (input.fbp) userData.fbp = input.fbp
    if (input.fbc) userData.fbc = input.fbc

    const body = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          action_source: "website",
          event_source_url: input.eventSourceUrl,
          user_data: userData,
          custom_data: {
            currency: input.currency || "BDT",
            value: input.value,
          },
        },
      ],
    }

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${datasetId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.error("Meta Conversions API error", res.status, errText)
    } else {
      const result = await res.json().catch(() => null)
      console.log("Meta Conversions API: Purchase event sent", result)
    }
  } catch (err) {
    console.error("Meta Conversions API request failed", err)
  }
}
