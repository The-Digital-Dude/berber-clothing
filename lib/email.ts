import nodemailer from "nodemailer"
import prisma from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Transport factory — reads SMTP config from Setting table at call time.
// Falls back to Resend SMTP relay if no custom SMTP configured.
// ---------------------------------------------------------------------------

async function getSmtpConfig() {
  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email"]
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return s
}

async function getSenderMeta() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["smtp_from_name", "smtp_from_email", "store_name", "support_email"] } },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    name: s.smtp_from_name || s.store_name || "Berber",
    email: s.smtp_from_email || s.support_email || process.env.BREVO_FROM_EMAIL || process.env.FROM_EMAIL || "noreply@berber.clothing",
  }
}

async function sendMail(to: string, subject: string, html: string) {
  const sender = await getSenderMeta()
  const smtpCfg = await getSmtpConfig()

  // 1. Custom SMTP
  if (smtpCfg.smtp_host && smtpCfg.smtp_user && smtpCfg.smtp_pass) {
    const transport = nodemailer.createTransport({
      host: smtpCfg.smtp_host,
      port: Number(smtpCfg.smtp_port || 587),
      secure: smtpCfg.smtp_secure === "true",
      auth: { user: smtpCfg.smtp_user, pass: smtpCfg.smtp_pass },
    })
    await transport.sendMail({ from: `${sender.name} <${sender.email}>`, to, subject, html })
    return
  }

  // 2. Brevo Transactional Email API
  if (process.env.BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message || `Brevo API error ${res.status}`)
    }
    return
  }

  // 3. Resend SMTP relay
  if (process.env.RESEND_API_KEY) {
    const transport = nodemailer.createTransport({
      host: "smtp.resend.com", port: 465, secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    })
    await transport.sendMail({ from: `${sender.name} <${sender.email}>`, to, subject, html })
    return
  }

  // 4. No provider — log only
  console.warn("[email] No provider configured. Would have sent:", { to, subject })
}

// ---------------------------------------------------------------------------
// Store metadata (name / logo / url) for email templates
// ---------------------------------------------------------------------------

async function getStoreMeta() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["store_name", "store_logo", "support_email", "store_url"] } },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return {
    name: map.store_name || "Berber",
    logo: map.store_logo || "",
    email: map.support_email || process.env.FROM_EMAIL || "noreply@berber.clothing",
    url: map.store_url || process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing",
  }
}

// ---------------------------------------------------------------------------
// Base HTML template
// ---------------------------------------------------------------------------

function baseTemplate(store: { name: string; logo: string; url: string }, content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f0;color:#1a1a1a;font-size:15px;line-height:1.6}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e0}
.header{background:#1a1a1a;padding:28px 32px;text-align:center}
.header-name{color:#fff;font-size:22px;font-weight:700;letter-spacing:4px;text-transform:uppercase}
.body{padding:32px}
.footer{padding:20px 32px;text-align:center;font-size:12px;color:#888;border-top:1px solid #f0f0e8;background:#fafaf8}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.5px;margin:20px 0}
.divider{border:none;border-top:1px solid #f0f0e8;margin:24px 0}
.muted{color:#666;font-size:13px}
.label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px}
.value{font-size:15px;font-weight:500;color:#1a1a1a}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
.item-row{display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f5f5f0}
.item-row:last-child{border-bottom:none}
.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#666}
.total-final{display:flex;justify-content:space-between;padding:12px 0;font-size:17px;font-weight:700;border-top:2px solid #1a1a1a;margin-top:8px}
.tag{display:inline-block;background:#f0f0e8;color:#555;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:500}
.tag-gold{background:#faf3d8;color:#7a5c00}
.tag-green{background:#eaf3de;color:#3b6d11}
.tag-red{background:#fcebeb;color:#a32d2d}
.alert{background:#faf3d8;border:1px solid #e8d88a;border-radius:8px;padding:16px;margin:20px 0;font-size:14px}
</style></head><body>
<div class="wrap">
<div class="header">
  ${store.logo ? `<img src="${store.logo}" alt="${store.name}" style="height:36px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto">` : ""}
  <div class="header-name">${store.name}</div>
</div>
<div class="body">${content}</div>
<div class="footer">
  <p>&copy; ${new Date().getFullYear()} ${store.name} &nbsp;·&nbsp; <a href="${store.url}" style="color:#888">${store.url}</a></p>
  <p style="margin-top:6px">Questions? Reply to this email or contact support.</p>
</div>
</div>
</body></html>`
}

// ---------------------------------------------------------------------------
// Email send functions
// ---------------------------------------------------------------------------

type OrderEmailData = {
  to: string
  orderNumber: string
  customerName: string
  items: { productName: string; size: string; color: string; quantity: number; price: number }[]
  subtotal: number
  shippingCharge: number
  discount: number
  giftWrapCharge: number
  total: number
  paymentMethod: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingArea: string
  shippingDistrict: string
  shippingDivision: string
  note?: string | null
  giftWrap?: boolean
  giftMessage?: string | null
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const store = await getStoreMeta()
  const itemRows = data.items.map((i) => `
    <div class="item-row">
      <div>
        <div style="font-weight:500">${i.productName}</div>
        <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
      </div>
      <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
    </div>`).join("")

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order confirmed!</h1>
    <p class="muted">Hi ${data.customerName}, your order has been placed and is being processed.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Order number</div><div class="value">${data.orderNumber}</div></div>
      <div><div class="label">Payment method</div><div class="value">${data.paymentMethod}</div></div>
    </div>
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Items ordered</h3>
    ${itemRows}
    <div style="margin-top:16px">
      <div class="total-row"><span>Subtotal</span><span>৳${data.subtotal.toLocaleString()}</span></div>
      ${data.shippingCharge > 0 ? `<div class="total-row"><span>Shipping</span><span>৳${data.shippingCharge.toLocaleString()}</span></div>` : `<div class="total-row"><span>Shipping</span><span class="tag tag-green">Free</span></div>`}
      ${data.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#3b6d11">−৳${data.discount.toLocaleString()}</span></div>` : ""}
      ${data.giftWrapCharge > 0 ? `<div class="total-row"><span>Gift wrap</span><span>৳${data.giftWrapCharge.toLocaleString()}</span></div>` : ""}
      <div class="total-final"><span>Total</span><span>৳${data.total.toLocaleString()}</span></div>
    </div>
    <hr class="divider">
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Shipping to</h3>
    <p style="font-weight:500">${data.shippingName}</p>
    <p class="muted">${data.shippingPhone}</p>
    <p class="muted">${data.shippingAddress}, ${data.shippingArea}</p>
    <p class="muted">${data.shippingDistrict}, ${data.shippingDivision}</p>
    ${data.note ? `<div class="alert" style="margin-top:20px"><strong>Your note:</strong> ${data.note}</div>` : ""}
    ${data.giftWrap ? `<div class="alert" style="margin-top:16px">🎁 <strong>Gift wrapped</strong>${data.giftMessage ? ` — "${data.giftMessage}"` : ""}</div>` : ""}
    <a href="${store.url}/account/orders" class="btn">Track your order →</a>`

  await sendMail(data.to, `Order confirmed — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendShippingDispatched(data: {
  to: string
  customerName: string
  orderNumber: string
  courierName: string
  trackingNumber: string
  trackingUrl?: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Your order is on the way!</h1>
    <p class="muted">Hi ${data.customerName}, <strong>${data.orderNumber}</strong> has been dispatched.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Courier</div><div class="value">${data.courierName}</div></div>
      <div><div class="label">Tracking number</div><div class="value" style="font-family:monospace">${data.trackingNumber}</div></div>
    </div>
    ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="btn">Track shipment →</a>` : `<a href="${store.url}/account/orders" class="btn">View order →</a>`}
    <p class="muted" style="margin-top:16px">Delivery typically takes 1–3 business days after dispatch.</p>`

  await sendMail(data.to, `Dispatched — ${data.orderNumber} is on the way!`, baseTemplate(store, content))
}

export async function sendOrderStatusUpdate(data: {
  to: string
  customerName: string
  orderNumber: string
  status: string
  note?: string | null
}) {
  const store = await getStoreMeta()
  const statusLabel: Record<string, string> = {
    CONFIRMED: "Order confirmed",
    PROCESSING: "Being processed",
    PACKED: "Packed and ready for pickup",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Return processed",
  }
  const label = statusLabel[data.status] || data.status
  const isNegative = data.status === "CANCELLED" || data.status === "RETURNED"
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order update</h1>
    <p class="muted">Hi ${data.customerName}, here's an update on <strong>${data.orderNumber}</strong>.</p>
    <hr class="divider">
    <div style="margin:20px 0">
      <div class="label">New status</div>
      <span class="tag ${isNegative ? "tag-red" : "tag-green"}" style="font-size:14px;padding:6px 16px;margin-top:6px;display:inline-block">${label}</span>
    </div>
    ${data.note ? `<div class="alert">${data.note}</div>` : ""}
    <a href="${store.url}/account/orders" class="btn">View order →</a>`

  await sendMail(data.to, `${label} — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendReturnUpdate(data: {
  to: string
  customerName: string
  orderNumber: string
  status: string
  refundAmount?: number
  adminNote?: string | null
}) {
  const store = await getStoreMeta()
  const isApproved = data.status === "APPROVED" || data.status === "REFUNDED"
  const isRejected = data.status === "REJECTED"
  const label = { APPROVED: "Return approved", REJECTED: "Return rejected", REFUNDED: "Refund processed", RECEIVED: "Return received" }[data.status] || data.status

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Return request update</h1>
    <p class="muted">Hi ${data.customerName}, your return request for <strong>${data.orderNumber}</strong> has been updated.</p>
    <hr class="divider">
    <div style="margin:20px 0">
      <span class="tag ${isApproved ? "tag-green" : isRejected ? "tag-red" : "tag-gold"}" style="font-size:14px;padding:6px 16px;display:inline-block">${label}</span>
    </div>
    ${data.refundAmount && data.refundAmount > 0 ? `<p><strong>Refund amount:</strong> ৳${data.refundAmount.toLocaleString()}</p>` : ""}
    ${data.adminNote ? `<div class="alert">${data.adminNote}</div>` : ""}
    <a href="${store.url}/account/orders" class="btn">View order →</a>`

  await sendMail(data.to, `${label} — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendBackInStockAlert(data: {
  to: string
  productName: string
  productUrl: string
  variantLabel: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Back in stock!</h1>
    <p class="muted">Good news — an item on your watchlist just came back.</p>
    <hr class="divider">
    <div style="margin:20px 0">
      <div style="font-size:18px;font-weight:600">${data.productName}</div>
      <div class="muted" style="margin-top:4px">${data.variantLabel}</div>
    </div>
    <p class="muted">Stock is limited — grab it before it sells out again.</p>
    <a href="${data.productUrl}" class="btn">Shop now →</a>`

  await sendMail(data.to, `Back in stock: ${data.productName}`, baseTemplate(store, content))
}

export async function sendAbandonedCartEmail(data: {
  to: string
  customerName: string
  cartItems: { name: string; size: string; color: string; quantity: number; price: number; image?: string }[]
  cartTotal: number
  recoveryUrl: string
  note?: string
}) {
  const store = await getStoreMeta()
  const itemRows = data.cartItems.map((i) => `
    <div class="item-row">
      ${i.image ? `<img src="${i.image}" alt="${i.name}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;margin-right:12px;flex-shrink:0">` : ""}
      <div style="flex:1">
        <div style="font-weight:500">${i.name}</div>
        <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
      </div>
      <div style="font-weight:500">৳${(i.price * i.quantity).toLocaleString()}</div>
    </div>`).join("")

  const noteHtml = data.note
    ? `<p style="margin-top:16px;padding:12px 16px;background:#fef9ec;border-left:3px solid #c9a84c;border-radius:4px;font-size:14px;color:#92670a">${data.note}</p>`
    : ""

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">You left something behind</h1>
    <p class="muted">Hi ${data.customerName}, you left ${data.cartItems.length} item${data.cartItems.length > 1 ? "s" : ""} in your bag.</p>
    <hr class="divider">
    ${itemRows}
    <div class="total-final" style="margin-top:16px"><span>Total</span><span>৳${data.cartTotal.toLocaleString()}</span></div>
    ${noteHtml}
    <a href="${data.recoveryUrl}" class="btn">Complete your order →</a>
    <p class="muted" style="margin-top:16px">This link takes you straight back to checkout. Your bag is saved.</p>`

  await sendMail(data.to, `Your bag is waiting — complete your ${store.name} order`, baseTemplate(store, content))
}

export async function sendGiftCardEmail(data: {
  to: string
  recipientName: string
  senderName: string
  code: string
  amount: number
  message?: string | null
  expiresAt?: Date | null
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">You've received a gift card!</h1>
    <p class="muted"><strong>${data.senderName}</strong> sent you a ${store.name} gift card.</p>
    ${data.message ? `<div class="alert" style="margin:20px 0;font-style:italic">"${data.message}"</div>` : "<hr class='divider'>"}
    <div style="background:#f5f5f0;border-radius:12px;padding:28px;text-align:center;margin:20px 0">
      <div class="label" style="text-align:center">Gift card value</div>
      <div style="font-size:40px;font-weight:700;margin:8px 0">৳${data.amount.toLocaleString()}</div>
      <div class="label" style="text-align:center;margin-top:16px">Redemption code</div>
      <div style="font-size:24px;font-weight:700;font-family:monospace;letter-spacing:3px;margin-top:4px;background:#fff;border:2px dashed #ccc;border-radius:8px;padding:12px 24px;display:inline-block">${data.code}</div>
    </div>
    ${data.expiresAt ? `<p class="muted" style="text-align:center">Valid until ${new Date(data.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
    <a href="${store.url}" class="btn" style="display:block;text-align:center">Start shopping →</a>`

  await sendMail(data.to, `${data.senderName} sent you a ৳${data.amount.toLocaleString()} ${store.name} gift card`, baseTemplate(store, content))
}

export async function sendAdminNewOrder(data: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: { productName: string; size: string; color: string; quantity: number; price: number }[]
  subtotal: number
  shippingCharge: number
  discount: number
  total: number
  paymentMethod: string
  shippingAddress: string
  shippingArea: string
  shippingDistrict: string
  shippingDivision: string
}) {
  const store = await getStoreMeta()
  const rows = await prisma.setting.findMany({ where: { key: { in: ["admin_notification_email", "support_email"] } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const adminEmail = s.admin_notification_email || s.support_email
  if (!adminEmail) return

  const itemRows = data.items.map((i) => `
    <div class="item-row">
      <div>
        <div style="font-weight:500">${i.productName}</div>
        <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
      </div>
      <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
    </div>`).join("")

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">New order received</h1>
    <p class="muted">A new order just landed in your store.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Order number</div><div class="value">${data.orderNumber}</div></div>
      <div><div class="label">Payment</div><div class="value">${data.paymentMethod}</div></div>
    </div>
    <div class="grid-2" style="margin-top:0">
      <div><div class="label">Customer</div><div class="value">${data.customerName}</div></div>
      <div><div class="label">Phone</div><div class="value">${data.customerPhone}</div></div>
    </div>
    ${data.customerEmail ? `<p class="muted" style="margin-top:4px">${data.customerEmail}</p>` : ""}
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 12px">Items</h3>
    ${itemRows}
    <div style="margin-top:16px">
      <div class="total-row"><span>Subtotal</span><span>৳${data.subtotal.toLocaleString()}</span></div>
      ${data.shippingCharge > 0 ? `<div class="total-row"><span>Shipping</span><span>৳${data.shippingCharge.toLocaleString()}</span></div>` : `<div class="total-row"><span>Shipping</span><span style="color:#3b6d11">Free</span></div>`}
      ${data.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#3b6d11">−৳${data.discount.toLocaleString()}</span></div>` : ""}
      <div class="total-final"><span>Total</span><span>৳${data.total.toLocaleString()}</span></div>
    </div>
    <hr class="divider">
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">Ship to</h3>
    <p class="muted">${data.shippingAddress}, ${data.shippingArea}, ${data.shippingDistrict}, ${data.shippingDivision}</p>
    <a href="${store.url}/admin/orders" class="btn">View in admin →</a>`

  await sendMail(adminEmail, `New order — ${data.orderNumber} (৳${data.total.toLocaleString()})`, baseTemplate(store, content))
}

export async function sendWelcomeEmail(data: { to: string; name: string }) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Welcome to ${store.name}</h1>
    <p class="muted">Hi ${data.name}, your account is ready.</p>
    <hr class="divider">
    <p>Explore the latest drops, save your favourites, and track your orders — all from one place.</p>
    <a href="${store.url}/shop" class="btn">Start shopping →</a>`

  await sendMail(data.to, `Welcome to ${store.name}`, baseTemplate(store, content))
}

export async function sendStoreCreditIssued(data: {
  to: string
  customerName: string
  amount: number
  reason: string
  balance: number
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Store credit added!</h1>
    <p class="muted">Hi ${data.customerName}, you've received store credit.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Amount added</div><div class="value tag-green" style="font-size:18px;font-weight:700;color:#3b6d11">+৳${data.amount.toLocaleString()}</div></div>
      <div><div class="label">New balance</div><div class="value" style="font-size:18px;font-weight:700">৳${data.balance.toLocaleString()}</div></div>
    </div>
    ${data.reason ? `<p class="muted" style="margin-top:12px">Reason: ${data.reason}</p>` : ""}
    <a href="${store.url}/shop" class="btn">Use your credit →</a>`

  await sendMail(data.to, `৳${data.amount.toLocaleString()} store credit added to your account`, baseTemplate(store, content))
}

export async function sendOrderDelivered(data: {
  to: string
  customerName: string
  orderNumber: string
  productName: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Delivered! 🎉</h1>
    <p class="muted">Hi ${data.customerName}, your order <strong>${data.orderNumber}</strong> has arrived.</p>
    <hr class="divider">
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Care tips</h3>
    <p>To keep your ${store.name} pieces looking sharp:</p>
    <ul style="margin:12px 0 12px 20px;color:#444;font-size:14px;line-height:1.8">
      <li>Dry clean or hand wash in cold water</li>
      <li>Hang to dry — avoid direct sunlight and tumble dryers</li>
      <li>Iron on a low-to-medium heat setting</li>
    </ul>
    <p class="muted">We'd love to hear what you think.</p>
    <a href="${store.url}/account/orders" class="btn">Leave a review →</a>`

  await sendMail(data.to, `Delivered — ${data.orderNumber} has arrived!`, baseTemplate(store, content))
}

export async function sendReviewRequest(data: {
  to: string
  customerName: string
  orderNumber: string
  productName: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">How was your ${data.productName}?</h1>
    <p class="muted">Hi ${data.customerName}, we hope you're loving order <strong>${data.orderNumber}</strong>.</p>
    <hr class="divider">
    <p>Would you mind leaving a quick review? It helps other customers and supports our small team.</p>
    <a href="${store.url}/account/orders" class="btn">Leave a review →</a>`

  await sendMail(data.to, `How was your ${data.productName}?`, baseTemplate(store, content))
}

export async function sendAdminLowStockAlert(data: {
  productName: string
  sku: string
  size: string
  color: string
  stock: number
  productId: string
}) {
  const store = await getStoreMeta()
  const rows = await prisma.setting.findMany({ where: { key: { in: ["admin_notification_email", "support_email"] } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const adminEmail = s.admin_notification_email || s.support_email
  if (!adminEmail) return

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">⚠️ Low stock alert</h1>
    <p class="muted">A variant is running low and may need restocking.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Product</div><div class="value">${data.productName}</div></div>
      <div><div class="label">SKU</div><div class="value">${data.sku}</div></div>
    </div>
    <div class="grid-2" style="margin-top:0">
      <div><div class="label">Variant</div><div class="value">${data.size} / ${data.color}</div></div>
      <div><div class="label">Remaining stock</div><div class="value tag-red" style="color:#b91c1c;font-weight:700;font-size:18px">${data.stock}</div></div>
    </div>
    <a href="${store.url}/admin/inventory" class="btn">Go to Inventory →</a>`

  await sendMail(adminEmail, `Low stock: ${data.productName} (${data.size}/${data.color}) — ${data.stock} left`, baseTemplate(store, content))
}

// ---------------------------------------------------------------------------
// Admin Email Studio — preview + test-send support
// ---------------------------------------------------------------------------

export const EMAIL_TEMPLATE_KEYS = [
  "order_confirmation",
  "shipping_dispatched",
  "order_status_update",
  "order_delivered",
  "return_update",
  "abandoned_cart",
  "review_request",
  "welcome_email",
  "gift_card",
  "store_credit",
  "back_in_stock",
  "admin_new_order",
  "admin_low_stock",
] as const

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number]

const DUMMY_ITEMS = [
  { productName: "Berber Student Blazer – Classic Black", size: "M", color: "Black", quantity: 1, price: 1750 },
  { productName: "Berber Student Trouser – Classic Black", size: "32", color: "Black", quantity: 1, price: 800 },
]

// Builds { subject, content } for a given template key using representative
// dummy data — used only for the admin preview/test-send, kept separate
// from the sendX() functions above so a preview can never accidentally
// trigger a real customer-facing side effect (stock decrement, coupon use, etc).
function buildPreview(key: EmailTemplateKey, storeName: string): { subject: string; content: string } {
  switch (key) {
    case "order_confirmation": {
      const itemRows = DUMMY_ITEMS.map((i) => `
        <div class="item-row">
          <div>
            <div style="font-weight:500">${i.productName}</div>
            <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
          </div>
          <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
        </div>`).join("")
      return {
        subject: "Order confirmed — ORD-2026-0001",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order confirmed!</h1>
          <p class="muted">Hi Rafiq, your order has been placed and is being processed.</p>
          <hr class="divider">
          <div class="grid-2">
            <div><div class="label">Order number</div><div class="value">ORD-2026-0001</div></div>
            <div><div class="label">Payment method</div><div class="value">COD</div></div>
          </div>
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Items ordered</h3>
          ${itemRows}
          <div style="margin-top:16px">
            <div class="total-row"><span>Subtotal</span><span>৳2,550</span></div>
            <div class="total-row"><span>Shipping</span><span>৳80</span></div>
            <div class="total-final"><span>Total</span><span>৳2,630</span></div>
          </div>
          <hr class="divider">
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Shipping to</h3>
          <p style="font-weight:500">Rafiq Islam</p>
          <p class="muted">01700000000</p>
          <p class="muted">House 12, Road 5, Gulshan</p>
          <p class="muted">Dhaka, Dhaka</p>
          <a href="#" class="btn">Track your order →</a>`,
      }
    }
    case "shipping_dispatched":
      return {
        subject: "Dispatched — ORD-2026-0001 is on the way!",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Your order is on the way!</h1>
          <p class="muted">Hi Rafiq, <strong>ORD-2026-0001</strong> has been dispatched.</p>
          <hr class="divider">
          <div class="grid-2">
            <div><div class="label">Courier</div><div class="value">Steadfast</div></div>
            <div><div class="label">Tracking number</div><div class="value" style="font-family:monospace">SF123456789</div></div>
          </div>
          <a href="#" class="btn">Track shipment →</a>
          <p class="muted" style="margin-top:16px">Delivery typically takes 1–3 business days after dispatch.</p>`,
      }
    case "order_status_update":
      return {
        subject: "Order confirmed — ORD-2026-0001",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order update</h1>
          <p class="muted">Hi Rafiq, here's an update on <strong>ORD-2026-0001</strong>.</p>
          <hr class="divider">
          <div style="margin:20px 0">
            <div class="label">New status</div>
            <span class="tag tag-green" style="font-size:14px;padding:6px 16px;margin-top:6px;display:inline-block">Order confirmed</span>
          </div>
          <a href="#" class="btn">View order →</a>`,
      }
    case "order_delivered":
      return {
        subject: "Delivered — ORD-2026-0001 has arrived!",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Delivered! 🎉</h1>
          <p class="muted">Hi Rafiq, your order <strong>ORD-2026-0001</strong> has arrived.</p>
          <hr class="divider">
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Care tips</h3>
          <p>To keep your ${storeName} pieces looking sharp:</p>
          <ul style="margin:12px 0 12px 20px;color:#444;font-size:14px;line-height:1.8">
            <li>Dry clean or hand wash in cold water</li>
            <li>Hang to dry — avoid direct sunlight and tumble dryers</li>
            <li>Iron on a low-to-medium heat setting</li>
          </ul>
          <a href="#" class="btn">Leave a review →</a>`,
      }
    case "return_update":
      return {
        subject: "Return approved — ORD-2026-0001",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Return request update</h1>
          <p class="muted">Hi Rafiq, your return request for <strong>ORD-2026-0001</strong> has been updated.</p>
          <hr class="divider">
          <div style="margin:20px 0">
            <span class="tag tag-green" style="font-size:14px;padding:6px 16px;display:inline-block">Return approved</span>
          </div>
          <p><strong>Refund amount:</strong> ৳1,750</p>
          <a href="#" class="btn">View order →</a>`,
      }
    case "abandoned_cart": {
      const itemRows = DUMMY_ITEMS.map((i) => `
        <div class="item-row">
          <div style="flex:1">
            <div style="font-weight:500">${i.productName}</div>
            <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
          </div>
          <div style="font-weight:500">৳${(i.price * i.quantity).toLocaleString()}</div>
        </div>`).join("")
      return {
        subject: `Your bag is waiting — complete your ${storeName} order`,
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">You left something behind</h1>
          <p class="muted">Hi Rafiq, you left 2 items in your bag.</p>
          <hr class="divider">
          ${itemRows}
          <div class="total-final" style="margin-top:16px"><span>Total</span><span>৳2,550</span></div>
          <a href="#" class="btn">Complete your order →</a>`,
      }
    }
    case "review_request":
      return {
        subject: "How was your Berber Student Blazer?",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">How was your Berber Student Blazer?</h1>
          <p class="muted">Hi Rafiq, we hope you're loving order <strong>ORD-2026-0001</strong>.</p>
          <hr class="divider">
          <p>Would you mind leaving a quick review? It helps other customers and supports our small team.</p>
          <a href="#" class="btn">Leave a review →</a>`,
      }
    case "welcome_email":
      return {
        subject: `Welcome to ${storeName}`,
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Welcome to ${storeName}</h1>
          <p class="muted">Hi Rafiq, your account is ready.</p>
          <hr class="divider">
          <p>Explore the latest drops, save your favourites, and track your orders — all from one place.</p>
          <a href="#" class="btn">Start shopping →</a>`,
      }
    case "gift_card":
      return {
        subject: `Nadia sent you a ৳1,000 ${storeName} gift card`,
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">You've received a gift card!</h1>
          <p class="muted"><strong>Nadia</strong> sent you a ${storeName} gift card.</p>
          <div class="alert" style="margin:20px 0;font-style:italic">"Happy birthday! Treat yourself."</div>
          <div style="background:#f5f5f0;border-radius:12px;padding:28px;text-align:center;margin:20px 0">
            <div class="label" style="text-align:center">Gift card value</div>
            <div style="font-size:40px;font-weight:700;margin:8px 0">৳1,000</div>
            <div class="label" style="text-align:center;margin-top:16px">Redemption code</div>
            <div style="font-size:24px;font-weight:700;font-family:monospace;letter-spacing:3px;margin-top:4px;background:#fff;border:2px dashed #ccc;border-radius:8px;padding:12px 24px;display:inline-block">BERBER-GIFT</div>
          </div>
          <a href="#" class="btn" style="display:block;text-align:center">Start shopping →</a>`,
      }
    case "store_credit":
      return {
        subject: "৳500 store credit added to your account",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Store credit added!</h1>
          <p class="muted">Hi Rafiq, you've received store credit.</p>
          <hr class="divider">
          <div class="grid-2">
            <div><div class="label">Amount added</div><div class="value tag-green" style="font-size:18px;font-weight:700;color:#3b6d11">+৳500</div></div>
            <div><div class="label">New balance</div><div class="value" style="font-size:18px;font-weight:700">৳500</div></div>
          </div>
          <p class="muted" style="margin-top:12px">Reason: Return refund</p>
          <a href="#" class="btn">Use your credit →</a>`,
      }
    case "back_in_stock":
      return {
        subject: "Back in stock: Berber Student Blazer – Classic Black",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Back in stock!</h1>
          <p class="muted">Good news — an item on your watchlist just came back.</p>
          <hr class="divider">
          <div style="margin:20px 0">
            <div style="font-size:18px;font-weight:600">Berber Student Blazer – Classic Black</div>
            <div class="muted" style="margin-top:4px">Size M</div>
          </div>
          <a href="#" class="btn">Shop now →</a>`,
      }
    case "admin_new_order": {
      const itemRows = DUMMY_ITEMS.map((i) => `
        <div class="item-row">
          <div>
            <div style="font-weight:500">${i.productName}</div>
            <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
          </div>
          <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
        </div>`).join("")
      return {
        subject: "New order — ORD-2026-0001 (৳2,630)",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">New order received</h1>
          <p class="muted">A new order just landed in your store.</p>
          <hr class="divider">
          <div class="grid-2">
            <div><div class="label">Order number</div><div class="value">ORD-2026-0001</div></div>
            <div><div class="label">Payment</div><div class="value">COD</div></div>
          </div>
          <div class="grid-2" style="margin-top:0">
            <div><div class="label">Customer</div><div class="value">Rafiq Islam</div></div>
            <div><div class="label">Phone</div><div class="value">01700000000</div></div>
          </div>
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 12px">Items</h3>
          ${itemRows}
          <div style="margin-top:16px"><div class="total-final"><span>Total</span><span>৳2,630</span></div></div>
          <a href="#" class="btn">View in admin →</a>`,
      }
    }
    case "admin_low_stock":
      return {
        subject: "Low stock: Berber Student Blazer – Classic Black (M/Black) — 2 left",
        content: `
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">⚠️ Low stock alert</h1>
          <p class="muted">A variant is running low and may need restocking.</p>
          <hr class="divider">
          <div class="grid-2">
            <div><div class="label">Product</div><div class="value">Berber Student Blazer – Classic Black</div></div>
            <div><div class="label">SKU</div><div class="value">BSB-BLK-M</div></div>
          </div>
          <div class="grid-2" style="margin-top:0">
            <div><div class="label">Variant</div><div class="value">M / Black</div></div>
            <div><div class="label">Remaining stock</div><div class="value tag-red" style="color:#b91c1c;font-weight:700;font-size:18px">2</div></div>
          </div>
          <a href="#" class="btn">Go to Inventory →</a>`,
      }
  }
}

export async function renderTemplatePreview(key: EmailTemplateKey): Promise<{ subject: string; html: string }> {
  const store = await getStoreMeta()
  const { subject, content } = buildPreview(key, store.name)
  return { subject, html: baseTemplate(store, content) }
}

export async function sendTemplatePreviewTo(key: EmailTemplateKey, to: string): Promise<void> {
  const { subject, html } = await renderTemplatePreview(key)
  await sendMail(to, `[Test] ${subject}`, html)
}

export async function sendOrderMessageNotification({
  to,
  customerName,
  orderNumber,
  orderId,
  message,
}: {
  to: string
  customerName: string
  orderNumber: string
  orderId: string
  message: string
}) {
  const store = await getStoreMeta()
  const orderUrl = `${store.url}/account/orders/${orderId}`
  const content = `
    <h2 style="font-size:20px;font-weight:700;margin-bottom:12px;color:#111;">Update on your Order #${orderNumber}</h2>
    <p style="margin-bottom:16px;color:#555;">Hello ${customerName || "Customer"},</p>
    <p style="margin-bottom:20px;color:#555;">Our customer care team has left a message regarding your order:</p>
    <div style="background:#f9f8f6;border-left:4px solid #b89b5e;padding:16px;margin-bottom:24px;border-radius:4px;color:#222;font-style:italic;line-height:1.6;">
      "${message}"
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${orderUrl}" style="background:#111;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">View Order & Reply</a>
    </div>
  `
  await sendMail(to, `Update on Order #${orderNumber} - ${store.name}`, baseTemplate(store, content)).catch((err) => {
    console.error("[sendOrderMessageNotification] error:", err)
  })
}

export async function sendAdminContactMessageAlert({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject?: string | null
  message: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h2 style="font-size:20px;font-weight:700;margin-bottom:12px;color:#111;">New Contact Form Message</h2>
    <p style="margin-bottom:12px;color:#555;">You received a new inquiry from the website contact form:</p>
    <div style="background:#f9f8f6;border-left:4px solid #b89b5e;padding:16px;margin-bottom:20px;border-radius:4px;color:#222;">
      <p style="margin-bottom:6px;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      ${subject ? `<p style="margin-bottom:6px;"><strong>Subject:</strong> ${subject}</p>` : ""}
      <p style="margin-top:10px;font-style:italic;line-height:1.6;">"${message}"</p>
    </div>
    <p style="color:#666;font-size:13px;">You can view and reply to this message directly in the Admin Contact Inbox.</p>
  `
  await sendMail(store.email, `New Inquiry: ${subject || name} - ${store.name}`, baseTemplate(store, content)).catch((err) => {
    console.error("[sendAdminContactMessageAlert] error:", err)
  })
}

export async function sendContactReply({
  to,
  customerName,
  subject,
  replyMessage,
}: {
  to: string
  customerName: string
  subject?: string | null
  replyMessage: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h2 style="font-size:20px;font-weight:700;margin-bottom:12px;color:#111;">Response to your inquiry</h2>
    <p style="margin-bottom:16px;color:#555;">Hello ${customerName || "Customer"},</p>
    <p style="margin-bottom:20px;color:#555;">Thank you for contacting ${store.name}. Here is a response from our team:</p>
    <div style="background:#f9f8f6;border-left:4px solid #b89b5e;padding:16px;margin-bottom:24px;border-radius:4px;color:#222;line-height:1.6;white-space:pre-wrap;">
${replyMessage}
    </div>
    <p style="color:#777;font-size:12px;">If you have any further questions, feel free to reply directly to this email.</p>
  `
  await sendMail(to, `Re: ${subject || "Your inquiry with " + store.name}`, baseTemplate(store, content)).catch((err) => {
    console.error("[sendContactReply] error:", err)
  })
}


