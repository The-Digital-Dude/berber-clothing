import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"
import { logAudit } from "@/lib/auditLog"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      loyaltyPoints: true,
      customerTags: true,
    },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const { addTag, removeTag, name, email, phone, abandonedCartEmailsEnabled } = body

  if (abandonedCartEmailsEnabled !== undefined) {
    await prisma.user.update({ where: { id }, data: { abandonedCartEmailsEnabled: !!abandonedCartEmailsEnabled } })
    return NextResponse.json({ ok: true })
  }

  if (addTag) {
    await prisma.customerTag.upsert({
      where: { userId_tag: { userId: id, tag: addTag } },
      create: { userId: id, tag: addTag },
      update: {},
    })
  }
  if (removeTag) {
    await prisma.customerTag.deleteMany({ where: { userId: id, tag: removeTag } })
  }

  // Profile edit (name/email/phone) — kept separate from the tag branches
  // above since it's a distinct action with its own validation and Supabase
  // Auth sync requirement.
  if (name !== undefined || email !== undefined || phone !== undefined) {
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

    const nextEmail = String(email).trim()
    const emailChanged = nextEmail.toLowerCase() !== existing.email.toLowerCase()

    // Email doubles as the Supabase Auth login identity — sync it there
    // FIRST, so Prisma and Supabase Auth can never end up out of sync. If
    // this fails (e.g. another Supabase user already has that email), abort
    // before touching Prisma at all.
    if (emailChanged) {
      const admin = createAdminClient()
      const { error: authError } = await admin.auth.admin.updateUserById(id, { email: nextEmail })
      if (authError) {
        return NextResponse.json({ error: authError.message || "Could not update login email" }, { status: 409 })
      }
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { name: String(name).trim(), email: nextEmail, phone: phone ? String(phone).trim() : null },
      })

      await logAudit({
        actorId: session!.user.id,
        actorEmail: session!.user.email,
        actorRole: session!.user.role,
        action: "customer.profile_updated",
        entityType: "User",
        entityId: id,
        before: { name: existing.name, email: existing.email, phone: existing.phone },
        after: { name: updated.name, email: updated.email, phone: updated.phone },
      })

      return NextResponse.json({ user: updated })
    } catch (e: any) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "That email is already in use by another account" }, { status: 409 })
      }
      return NextResponse.json({ error: e.message || "Failed to update customer" }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
