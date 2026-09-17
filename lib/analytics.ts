"use client"

// ─── GA4 helpers ──────────────────────────────────────────────────────────────

function gtag(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const w = window as any
  if (typeof w.gtag === "function") w.gtag("event", event, params)
}

function fbq(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const w = window as any
  if (typeof w.fbq === "function") w.fbq("track", event, params)
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
  fbq("ViewContent", { content_ids: [product.id], content_name: product.name, value: product.price, currency: "BDT" })
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
  fbq("AddToCart", { content_ids: [product.id], content_name: product.name, value: product.price * qty, currency: "BDT" })
}

export function trackInitiateCheckout(value: number, itemCount: number) {
  gtag("begin_checkout", { currency: "BDT", value, num_items: itemCount })
  fbq("InitiateCheckout", { value, currency: "BDT", num_items: itemCount })
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
  fbq("Purchase", { value: order.total, currency: "BDT" })
}

export function trackSearch(query: string) {
  gtag("search", { search_term: query })
  fbq("Search", { search_string: query })
}

export function trackAddToWishlist(product: { id: string; name: string; price: number }) {
  gtag("add_to_wishlist", { currency: "BDT", value: product.price, items: [{ item_id: product.id, item_name: product.name }] })
  fbq("AddToWishlist", { content_ids: [product.id], value: product.price, currency: "BDT" })
}

export function trackAddPaymentInfo(value: number, paymentMethod: string) {
  gtag("add_payment_info", { currency: "BDT", value, payment_type: paymentMethod })
  fbq("AddPaymentInfo", { value, currency: "BDT" })
}

export function trackCompleteRegistration() {
  gtag("sign_up")
  fbq("CompleteRegistration")
}
