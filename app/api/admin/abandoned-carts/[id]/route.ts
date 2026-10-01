import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const { name, email, phone } = await req.json()

  if (email && !EMAIL_RE.test(String(email).trim())) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  const cart = await prisma.abandonedCart.findUnique({ where: { id } })
  if (!cart) return NextResponse.json({ error: "Abandoned cart not found" }, { status: 404 })

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
