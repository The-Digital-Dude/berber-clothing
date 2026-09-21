import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "Recipient email required" }, { status: 400 })

  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email", "store_name"]
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  const fromName = s.smtp_from_name || s.store_name || "Berber"
  const fromEmail = s.smtp_from_email || process.env.BREVO_FROM_EMAIL || "noreply@mail.berber.clothing"
  const provider = s.smtp_host ? s.smtp_host : process.env.BREVO_API_KEY ? "Brevo" : process.env.RESEND_API_KEY ? "Resend" : null

  if (!provider) {
    return NextResponse.json({ error: "No email provider configured. Set BREVO_API_KEY, SMTP settings, or RESEND_API_KEY." }, { status: 400 })
  }

  const subject = `Test email from ${fromName}`
  const html = `<div style="font-family:sans-serif;padding:32px;max-width:480px">
    <h2 style="margin:0 0 12px">Email is working!</h2>
    <p style="color:#555">Transactional emails from <strong>${fromName}</strong> are being delivered via <strong>${provider}</strong>.</p>
    <p style="color:#999;font-size:12px;margin-top:24px">Sent to: ${to}</p>
  </div>`

  try {
    if (s.smtp_host && s.smtp_user && s.smtp_pass) {
      const transport = nodemailer.createTransport({
        host: s.smtp_host, port: Number(s.smtp_port || 587), secure: s.smtp_secure === "true",
        auth: { user: s.smtp_user, pass: s.smtp_pass },
      })
      await transport.sendMail({ from: `${fromName} <${fromEmail}>`, to, subject, html })
    } else if (process.env.BREVO_API_KEY) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).message || `Brevo error ${res.status}`)
      }
    } else if (process.env.RESEND_API_KEY) {
      const transport = nodemailer.createTransport({
        host: "smtp.resend.com", port: 465, secure: true,
        auth: { user: "resend", pass: process.env.RESEND_API_KEY },
      })
      await transport.sendMail({ from: `${fromName} <${fromEmail}>`, to, subject, html })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Send failed" }, { status: 500 })
  }
}
