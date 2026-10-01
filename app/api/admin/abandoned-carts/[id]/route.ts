import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const { name, email, phone, abandonedCartEmailsEnabled } = await req.json()

  const cart = await prisma.abandonedCart.findUnique({ where: { id } })
  if (!cart) return NextResponse.json({ error: "Abandoned cart not found" }, { status: 404 })

  // Opt-out lives on the User record, not this cart -- only possible when the
  // cart's email matches a registered customer (guests have no account).
  if (abandonedCartEmailsEnabled !== undefined) {
    if (!cart.email) return NextResponse.json({ error: "This cart has no email on file" }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { email: cart.email } })
    if (!user) return NextResponse.json({ error: "No registered customer matches this email" }, { status: 404 })
    await prisma.user.update({ where: { id: user.id }, data: { abandonedCartEmailsEnabled: !!abandonedCartEmailsEnabled } })
    return NextResponse.json({ ok: true, abandonedCartEmailsEnabled: !!abandonedCartEmailsEnabled })
  }

  if (email && !EMAIL_RE.test(String(email).trim())) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  const updated = await prisma.abandonedCart.update({
    where: { id },
    data: {
      name: name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    },
  })

  return NextResponse.json(updated)
}
