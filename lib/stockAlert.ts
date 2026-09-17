import prisma from "@/lib/prisma"
import { Resend } from "resend"

// Call this after increasing a variant's stock from 0 → positive
export async function notifyStockAlerts(variantId: string) {
  const alerts = await prisma.stockAlert.findMany({
    where: { variantId, notified: false },
    include: { variant: { include: { product: { select: { name: true, slug: true, images: { take: 1 } } } } } },
  })
  if (alerts.length === 0) return

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const resend = new Resend(resendKey)
  const from = process.env.RESEND_FROM_EMAIL || "noreply@berber.clothing"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

  const variant = alerts[0].variant
  const product = variant.product
  const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ")
  const productUrl = `${siteUrl}/shop/${product.slug}`

  const emailPromises = alerts.map((alert) =>
    resend.emails.send({
      from,
      to: alert.email,
      subject: `Back in stock: ${product.name}${variantLabel ? ` (${variantLabel})` : ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
          <div style="background:#0f0e0c;padding:24px 32px">
            <p style="color:#c9a84c;font-weight:700;letter-spacing:0.2em;margin:0">BERBER</p>
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 8px;font-size:20px">It's back! 🎉</h2>
            <p style="color:#555;margin:0 0 24px">
              <strong>${product.name}${variantLabel ? ` — ${variantLabel}` : ""}</strong> is back in stock.
              Grab it before it sells out again.
            </p>
            <a href="${productUrl}" style="display:inline-block;padding:14px 28px;background:#0f0e0c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
              Shop Now
            </a>
            <p style="margin-top:24px;color:#aaa;font-size:12px">
              You signed up for this alert on berber.clothing.
              <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(alert.email)}" style="color:#aaa">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    }).catch(() => null)
  )

  await Promise.allSettled(emailPromises)

  // Mark all as notified
  await prisma.stockAlert.updateMany({
    where: { variantId, notified: false },
    data: { notified: true },
  })
}
