// Legacy alias. This path used to carry its own unauthenticated handler that
// let anyone flip order/payment status. It now forwards to the canonical
// handler, which verifies the X-Signature HMAC.
export { POST } from "@/app/api/webhooks/steadfast/route"
