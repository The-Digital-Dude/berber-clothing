/**
 * Validates an SSLCommerz payment against the order it claims to pay.
 * Returns true only if the gateway says VALID/VALIDATED AND the transaction,
 * currency and amount match the order — a valid payment for a cheaper order
 * must never mark a different order as paid.
 */
export async function validateSslPayment(
  valId: string | null,
  order: { id: string; total: unknown }
): Promise<boolean> {
  if (!valId) return false
  const mode = process.env.SSL_MODE || "sandbox"
  const base =
    mode === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com"
  const params = new URLSearchParams({
    val_id: valId,
    store_id: process.env.SSL_STORE_ID || "",
    store_passwd: process.env.SSL_STORE_PASSWORD || "",
    format: "json",
  })
  const res = await fetch(`${base}/validator/api/validationserverAPI.php?${params}`)
  if (!res.ok) return false
  const v = await res.json().catch(() => null)
  if (!v || (v.status !== "VALID" && v.status !== "VALIDATED")) return false
  if (v.tran_id !== order.id) return false
  if (v.currency_type && v.currency_type !== "BDT") return false
  const paid = Number(v.currency_amount ?? v.amount)
  const expected = Number(order.total)
  return Number.isFinite(paid) && Math.abs(paid - expected) < 1
}
