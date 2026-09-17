import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Resend } from "resend"

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "GC-"
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const VALID_AMOUNTS = [500, 1000, 2000, 5000]

export async function POST(req: NextRequest) {
  const { amount, recipientEmail, recipientName, senderName, senderEmail, message } = await req.json()

  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }
  if (!recipientEmail) {
    return NextResponse.json({ error: "Recipient email required" }, { status: 400 })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year

  const card = await prisma.giftCard.create({
    data: {
      code,
      amount,
      balance: amount,
      recipientEmail,
      senderName: senderName || null,
      senderEmail: senderEmail || null,
      message: message || null,
      expiresAt,
    },
  })

  // Send email to recipient
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@berber.clothing"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `You've received a ৳${amount.toLocaleString()} Berber Gift Card!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:0">
          <div style="background:#0f0e0c;padding:32px;text-align:center">
            <h1 style="color:#c9a84c;font-size:28px;margin:0;letter-spacing:0.1em">BERBER</h1>
          </div>
          <div style="padding:40px 32px;background:#fff">
            <h2 style="font-size:22px;margin:0 0 8px">You've received a gift card!</h2>
            ${senderName ? `<p style="color:#555">From <strong>${senderName}</strong></p>` : ""}
            ${message ? `<div style="background:#f9f5ef;border-left:3px solid #c9a84c;padding:12px 16px;margin:16px 0;color:#555;font-style:italic">"${message}"</div>` : ""}

            <div style="background:#f9f5ef;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
              <p style="color:#888;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Your gift card code</p>
              <p style="font-family:monospace;font-size:24px;font-weight:700;letter-spacing:0.15em;color:#0f0e0c;margin:0">${code}</p>
              <p style="color:#c9a84c;font-size:20px;font-weight:700;margin:12px 0 0">৳${amount.toLocaleString()}</p>
            </div>

            <p style="color:#555;font-size:14px">Use this code at checkout on <a href="${siteUrl}" style="color:#0f0e0c">berber.clothing</a>. Valid for one year.</p>
            <a href="${siteUrl}/shop" style="display:inline-block;margin-top:16px;padding:14px 28px;background:#0f0e0c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Shop Now</a>
          </div>
          <div style="padding:16px 32px;background:#f9f5ef;text-align:center">
            <p style="color:#aaa;font-size:12px;margin:0">Expires: ${expiresAt.toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })} · Berber, Dhaka</p>
          </div>
        </div>
      `,
    }).catch(() => {})

    // Also notify sender
    if (senderEmail && senderEmail !== recipientEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: senderEmail,
        subject: `Your gift card to ${recipientEmail} is on its way`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><p>Hi ${senderName || "there"},</p><p>Your ৳${amount.toLocaleString()} Berber gift card has been sent to <strong>${recipientEmail}</strong>.</p><p>Code: <code style="font-family:monospace;font-weight:700">${code}</code></p><p style="color:#888;font-size:12px">Berber · Made in Bangladesh</p></div>`,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, code, amount })
}
