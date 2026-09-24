"use client"

// ─── GA4 helpers ──────────────────────────────────────────────────────────────

function gtag(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const w = window as any
  if (typeof w.gtag === "function") w.gtag("event", event, params)
}

function fbq(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (typeof window === "undefined") return
  const w = window as any
  if (typeof w.fbq !== "function") return
  if (eventID) w.fbq("track", event, params, { eventID })
  else w.fbq("track", event, params)
}

// ─── Tracking events ──────────────────────────────────────────────────────────

export function trackViewContent(product: {
  id: string
  name: string
  price: number
  category?: string
}) {
  gtag("view_item", {
    currency: "BDT",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
  })
  fbq("ViewContent", { content_ids: [product.id], content_type: "product", content_name: product.name, value: product.price, currency: "BDT" })
}

export function trackAddToCart(product: {
  id: string
  name: string
  price: number
  quantity?: number
}) {
  const qty = product.quantity ?? 1
  gtag("add_to_cart", {
    currency: "BDT",
    value: product.price * qty,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
  })
  fbq("AddToCart", { content_ids: [product.id], content_type: "product", content_name: product.name, value: product.price * qty, currency: "BDT" })
}

export function trackInitiateCheckout(
  value: number,
  items: { productId: string; quantity: number }[]
) {
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  gtag("begin_checkout", { currency: "BDT", value, num_items: itemCount })
  fbq("InitiateCheckout", {
    content_ids: items.map((i) => i.productId),
    content_type: "product",
    value,
    currency: "BDT",
    num_items: itemCount,
  })
}

export function trackPurchase(order: {
  id: string
  orderNumber: string
  total: number
  items?: { productId: string; name: string; price: number; quantity: number }[]
}) {
  gtag("purchase", {
    transaction_id: order.orderNumber,
    currency: "BDT",
    value: order.total,
    items: order.items?.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
  })
  // eventID matches the order.id used server-side by the Conversions API
  // Purchase event, so Meta deduplicates the two into one conversion.
  fbq(
    "Purchase",
    {
      content_ids: order.items?.map((i) => i.productId) || [],
      content_type: "product",
      value: order.total,
      currency: "BDT",
    },
    order.id
  )
}

export function trackSearch(query: string) {
  gtag("search", { search_term: query })
  fbq("Search", { search_string: query })
}

export function trackAddToWishlist(product: { id: string; name: string; price: number }) {
  gtag("add_to_wishlist", { currency: "BDT", value: product.price, items: [{ item_id: product.id, item_name: product.name }] })
  fbq("AddToWishlist", { content_ids: [product.id], content_type: "product", value: product.price, currency: "BDT" })
}

export function trackAddPaymentInfo(value: number, paymentMethod: string) {
  gtag("add_payment_info", { currency: "BDT", value, payment_type: paymentMethod })
  fbq("AddPaymentInfo", { value, currency: "BDT" })
}

export function trackCompleteRegistration() {
  gtag("sign_up")
  fbq("CompleteRegistration")
}
